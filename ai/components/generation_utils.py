import torch
from typing import Dict, List
from sklearn.metrics.pairwise import cosine_similarity
from torch.nn.functional import cosine_similarity as torch_cosine_similarity
from nltk.tokenize import sent_tokenize
from textblob import TextBlob
from .model_manager import ModelManager
import logging
import spacy
import re
import traceback
from rich.logging import RichHandler
from rich.traceback import install as install_rich_traceback
from rich.console import Console
from rich import print as rprint

# Set up Rich traceback
install_rich_traceback(show_locals=True)

# Set up logging with Rich
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("rich")

# Create Rich console
console = Console()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("Loaded spaCy model successfully")
except Exception as e:
    logger.error(f"Failed to load spaCy model: {str(e)}")
    nlp = None

async def generate_context_summary(raw_text: str, processed_text: str, query: str, mode: str) -> str:
    logger.info("Starting generate_context_summary")
    try:
        bart_cnn = await ModelManager.get_model("bart-cnn", mode)
        
        combined_text = f"Processed: {processed_text[:768]} Raw: {raw_text[:256]}"
        
        logger.debug(f"Combined text length: {len(combined_text)}")
        
        inputs = bart_cnn["tokenizer"]("summarize: " + combined_text, max_length=1024, return_tensors="pt", truncation=True).to(device)
        
        logger.debug(f"Input shape: {inputs['input_ids'].shape}")
        
        summary_ids = bart_cnn["model"].generate(
            inputs["input_ids"],
            num_beams=4,
            max_length=150,
            min_length=40,
            length_penalty=2.0,
            early_stopping=True,
            no_repeat_ngram_size=3,
            do_sample=True,
            top_k=50,
            top_p=0.95
        )
        
        summary = bart_cnn["tokenizer"].decode(summary_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        logger.info("Context summary generated successfully")
        logger.debug(f"Summary length: {len(summary)}")
        return summary
    except Exception as e:
        logger.exception("Error in generate_context_summary")
        console.print_exception(show_locals=True)
        return "Failed to generate context summary due to an error."

async def generate_summary(text: str, mode: str) -> str:
    logger.info("Starting generate_summary")
    try:
        summarize = await ModelManager.get_model("bart-summarization", mode)
        summarizer_input = f"summarize: {text}"
        
        logger.debug(f"Input text length: {len(text)}")
        
        summary_input_ids = summarize["tokenizer"](summarizer_input, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
        
        logger.debug(f"Tokenized input shape: {summary_input_ids.shape}")
        
        with torch.no_grad():
            summary_outputs = summarize["model"].generate(
                summary_input_ids, 
                max_length=100,
                min_length=30,
                length_penalty=2.0, 
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3
            )
        
        summary = summarize["tokenizer"].decode(summary_outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        logger.info("Summary generated successfully")
        logger.debug(f"Summary length: {len(summary)}")
        return summary
    except Exception as e:
        logger.exception("Error in generate_summary")
        console.print_exception(show_locals=True)
        return "Failed to generate summary due to an error."

async def calculate_confidence_score(abstractive_answer: str, extractive_answer: str, context: str, query: str) -> float:
    logger.info("Starting calculate_confidence_score")
    try:
        sentence_transformer = await ModelManager.get_model("sentence-transformer")
        
        if not abstractive_answer or not extractive_answer or not context or not query:
            logger.warning("Empty input in calculate_confidence_score")
            return 0.0
        
        length_score = min(len(abstractive_answer.split()) / 50, 1.0)
        
        texts = [query, abstractive_answer, extractive_answer, context]
        embeddings = sentence_transformer.encode(texts)
        
        logger.debug(f"Embeddings shape: {embeddings.shape}")
        
        if embeddings.size == 0 or embeddings.ndim != 2:
            logger.warning("Empty or unexpected embeddings generated")
            return 0.0
        
        query_sim_abstractive = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        query_sim_extractive = cosine_similarity([embeddings[0]], [embeddings[2]])[0][0]
        answer_sim_context = cosine_similarity([embeddings[1]], [embeddings[3]])[0][0]
        
        coherence_score = cosine_similarity([embeddings[1]], [embeddings[2]])[0][0]
        
        readability_score = TextBlob(abstractive_answer).sentiment.subjectivity
        
        ner_score = calculate_ner_score(abstractive_answer)
        
        combined_score = (
            length_score * 0.15 +
            query_sim_abstractive * 0.2 +
            query_sim_extractive * 0.15 +
            answer_sim_context * 0.2 +
            coherence_score * 0.15 +
            readability_score * 0.1 +
            ner_score * 0.05
        ) * 100
        
        final_score = round(combined_score, 2)
        logger.info(f"Confidence score calculated: {final_score}")
        
        # Debug print individual scores
        rprint({
            "length_score": length_score,
            "query_sim_abstractive": query_sim_abstractive,
            "query_sim_extractive": query_sim_extractive,
            "answer_sim_context": answer_sim_context,
            "coherence_score": coherence_score,
            "readability_score": readability_score,
            "ner_score": ner_score,
            "final_score": final_score
        })
        
        return final_score
    except Exception as e:
        logger.exception("Error in calculate_confidence_score")
        console.print_exception(show_locals=True)
        return 0.0

def calculate_ner_score(text: str) -> float:
    logger.info("Starting calculate_ner_score")
    try:
        if nlp is None:
            logger.warning("spaCy model not loaded, returning default NER score")
            return 0.5
        doc = nlp(text)
        ner_count = len(doc.ents)
        score = min(ner_count / 10, 1.0)
        logger.info(f"NER score calculated: {score}")
        logger.debug(f"Named entities found: {', '.join(str(ent) for ent in doc.ents)}")
        return score
    except Exception as e:
        logger.exception("Error in calculate_ner_score")
        console.print_exception(show_locals=True)
        return 0.0

async def generate_follow_up_questions(query: str, answer: str) -> List[str]:
    logger.info("Starting generate_follow_up_questions")
    try:
        godel_model = await ModelManager.get_model("follow-up-questions")
        logger.info("BLOOM model loaded")

        prompt = f"""Human: You are an expert in generating follow-up questions based on a question and its answer. The original question is: "{query}" and the answer provided is: "{answer}".

        Please generate exactly 3 unique, thought-provoking follow-up questions that:
        1. Address different dimensions of the topic that were not directly covered in the original question or the provided answer.
        2. Explore specific details, nuances, or implications from the answer provided.
        3. Ask the user to think critically about broader implications or real-world applications related to the answer.

        Make sure each question:
        - Is relevant to the given topic.
        - Is open-ended and fosters deeper discussion.
        - Is concise and well-structured.

        Please provide the questions in a numbered list without any extra text.

        AI: Here are 3 follow-up questions:

        Human: Now, give me only the questions without any extra information.

        AI:"""
        
        logger.debug(f"Prompt length: {len(prompt)}")
        
        input_ids = godel_model["tokenizer"](prompt, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
        logger.debug(f"Input shape: {input_ids.shape}")
        
        with torch.no_grad():
            outputs = godel_model["model"].generate(
                input_ids, 
                max_length=200,
                num_return_sequences=1,
                num_beams=5, 
                do_sample=True, 
                temperature=0.7,
                no_repeat_ngram_size=3,
                top_k=50,
                top_p=0.95
            )
        logger.info("Model generation complete")
        
        generated_text = godel_model["tokenizer"].decode(outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        logger.debug(f"Generated text: {generated_text}")
        
        questions = [q.strip() for q in generated_text.split('\n') if q.strip()]
        logger.info(f"Questions extracted: {len(questions)}")
        
        while len(questions) < 3:
            backup_question = f"What other aspects of {query.lower().split()[0]} would be interesting to explore?"
            questions.append(backup_question)
        logger.info("Questions list finalized")
        
        # Debug print questions
        rprint({"Generated Questions": questions})
        
        return questions[:3]
    except Exception as e:
        logger.exception("Error in generate_follow_up_questions")
        console.print_exception(show_locals=True)
        return [f"Could not generate follow-up questions due to an error: {str(e)}"]

async def filter_and_sort_sentences(text: str, query: str, model_name: str = "roberta-qa", mode: str = "power") -> str:
    logger.info("Starting filter_and_sort_sentences")
    try:
        sentences = sent_tokenize(text)
        logger.debug(f"Total sentences: {len(sentences)}")
        
        filtered_sentences = [
            sent for sent in sentences
            if len(sent.split()) > 5
            and not re.match(r'^(Navigation|Menu|Search|Home|About|Contact)', sent)
            and not re.search(r'(cookie|privacy policy|terms of use)', sent.lower())
        ]
        logger.debug(f"Filtered sentences: {len(filtered_sentences)}")
        
        sentence_scores = []
        for sent in filtered_sentences:
            score = await score_sentence(query, sent, model_name, mode)
            sentence_scores.append((sent, score))
        
        sorted_sentences = [sent for sent, score in sorted(sentence_scores, key=lambda x: x[1], reverse=True)]
        
        result = ' '.join(sorted_sentences[:10])
        logger.info("Sentences filtered and sorted successfully")
        logger.debug(f"Result length: {len(result)}")
        
        # Debug print top 3 sentences with scores
        rprint({
            "Top 3 Sentences": [
                {"sentence": sent[:50] + "...", "score": score}
                for sent, score in sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:3]
            ]
        })
        
        return result
    except Exception as e:
        logger.exception("Error in filter_and_sort_sentences")
        console.print_exception(show_locals=True)
        return "Failed to filter and sort sentences due to an error."

async def score_sentence(question: str, sentence: str, model_name: str = "roberta-qa", mode: str = "power") -> float:
    logger.info(f"Starting score_sentence for model: {model_name}")
    try:
        model_info = await ModelManager.get_model(model_name, mode)
        tokenizer = model_info["tokenizer"]
        model = model_info["model"]

        inputs = tokenizer(question, sentence, return_tensors='pt', truncation=True, max_length=512).to(device)
        logger.debug(f"Input shape: {inputs['input_ids'].shape}")
        
        with torch.no_grad():
            outputs = model(**inputs)
        
        start_scores = outputs.start_logits
        end_scores = outputs.end_logits
        
        start_index = torch.argmax(start_scores)
        end_index = torch.argmax(end_scores)
        
        score = start_scores[0, start_index].item() + end_scores[0, end_index].item()
        logger.info(f"Sentence scored successfully: {score}")
        
        # Debug print
        rprint({
            "Question": question[:50] + "...",
            "Sentence": sentence[:50] + "...",
            "Score": score
        })
        
        return score
    except Exception as e:
        logger.exception("Error in score_sentence")
        console.print_exception(show_locals=True)
        return 0.0