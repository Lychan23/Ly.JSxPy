import torch
from typing import Dict, List
from sklearn.metrics.pairwise import cosine_similarity
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
import asyncio
import gc

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
console = Console()

# Initialize device and load spaCy model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("Loaded spaCy model successfully")
except Exception as e:
    logger.error(f"Failed to load spaCy model: {str(e)}")
    nlp = None

async def generate_summary(text: str, mode: str, model_type: str = "bart-summarization") -> str:
    logger.info("Starting summary generation")
    try:
        model_info = await ModelManager.get_model(model_type, mode)
        input_text = f"summarize: {text}"
        logger.debug(f"Input text length: {len(text)}")
        
        input_ids = model_info["tokenizer"](input_text, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
        logger.debug(f"Tokenized input shape: {input_ids.shape}")
        
        with torch.no_grad():
            summary_ids = model_info["model"].generate(
                input_ids, 
                max_length=100,
                min_length=30,
                length_penalty=2.0, 
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3
            )
        
        summary = model_info["tokenizer"].decode(summary_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        logger.info("Summary generated successfully")
        logger.debug(f"Summary length: {len(summary)}")
        return summary
    except Exception as e:
        logger.exception("Error in generate_summary")
        console.print_exception(show_locals=True)
        return "Failed to generate summary due to an error."
    finally:
        clean_up()

async def generate_context_summary(raw_text: str, processed_text: str, query: str, mode: str) -> str:
    logger.info("Starting generate_context_summary")
    combined_text = f"Processed: {processed_text[:768]} Raw: {raw_text[:256]}"
    logger.debug(f"Combined text length: {len(combined_text)}")

    return await generate_summary(combined_text, mode, model_type="bart-cnn")

async def calculate_confidence_score(abstractive_answer: str, extractive_answer: str, context: str, query: str) -> float:
    logger.info("Starting calculate_confidence_score")
    
    if not (abstractive_answer and extractive_answer and context and query):
        logger.warning("Empty input in calculate_confidence_score")
        return 0.0

    try:
        length_score = min(len(abstractive_answer.split()) / 50, 1.0)
        texts = [query, abstractive_answer, extractive_answer, context]
        embeddings = await get_embeddings(texts)

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
    finally:
        clean_up()

async def get_embeddings(texts: List[str]):
    logger.info("Generating embeddings")
    model_info = await ModelManager.get_model("sentence-transformer")
    embeddings = model_info["model"].encode(texts)
    logger.debug(f"Embeddings shape: {embeddings.shape}")
    return embeddings

def calculate_ner_score(text: str) -> float:
    logger.info("Starting calculate_ner_score")
    if nlp is None:
        logger.warning("spaCy model not loaded, returning default NER score")
        return 0.5

    try:
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
        godel_model = await ModelManager.get_model("flan-t5")
        logger.info("T5 model loaded")

        prompt = (
            f"""Human: You are an expert in generating follow-up questions based on a question and its answer. The original question is: "{query}" and the answer provided is: "{answer}".\n\n"""
            f"""Please generate exactly 3 unique, thought-provoking follow-up questions that:\n"""
            f"""1. Address different dimensions of the topic that were not directly covered in the original question or the provided answer.\n"""
            f"""2. Explore specific details, nuances, or implications from the answer provided.\n"""
            f"""3. Ask the user to think critically about broader implications or real-world applications related to the answer.\n\n"""
            f"""Make sure each question:\n"""
            f"""- Is relevant to the given topic.\n"""
            f"""- Is open-ended and fosters deeper discussion.\n"""
            f"""- Is concise and well-structured.\n\n"""
            f"""AI: Here are 3 follow-up questions:\n\n"""
            f"""Human: Now, give me only the questions without any extra information.\n\n"""
            f"""AI:"""
        )
        
        logger.debug(f"Prompt length: {len(prompt)}")
        input_ids = godel_model["tokenizer"](prompt, return_tensors="pt", truncation=True).input_ids.to(device)
        
        with torch.no_grad():
            outputs = godel_model["model"].generate(input_ids, max_new_tokens=150, num_beams=5, early_stopping=True)

        response = godel_model["tokenizer"].decode(outputs[0], skip_special_tokens=True)
        logger.info("Follow-up questions generated successfully")
        
        questions = re.findall(r'\d+\.\s(.+)', response)
        logger.debug(f"Extracted questions: {questions}")
        return questions[:3]
    except Exception as e:
        logger.exception("Error in generate_follow_up_questions")
        console.print_exception(show_locals=True)
        return []
    finally:
        clean_up()

async def filter_and_sort_sentences(text: str, query: str, model_name: str = "roberta-qa", mode: str = "power") -> str:
    logger.info("Starting filter_and_sort_sentences")
    sentences = sent_tokenize(text)
    logger.debug(f"Total sentences: {len(sentences)}")
    
    filtered_sentences = [
        sent for sent in sentences
        if len(sent.split()) > 5 and not re.match(r'^(Navigation|Menu|Search|Home|About|Contact)', sent) and not re.search(r'(cookie|privacy policy|terms of use)', sent.lower())
    ]
    logger.debug(f"Filtered sentences: {len(filtered_sentences)}")
    
    sentence_scores = await asyncio.gather(*[score_sentence(query, sent, model_name, mode) for sent in filtered_sentences])
    
    sorted_sentences = [sent for sent, score in sorted(zip(filtered_sentences, sentence_scores), key=lambda x: x[1], reverse=True)]
    logger.info(f"Sorted sentences based on scores: {sorted_sentences}")

    return sorted_sentences[:3]  # Return top 3 sentences

async def score_sentence(query: str, sentence: str, model_name: str, mode: str) -> float:
    logger.info("Scoring a sentence")
    try:
        model_info = await ModelManager.get_model(model_name, mode)
        input_text = f"{query} {sentence}"
        
        input_ids = model_info["tokenizer"](input_text, return_tensors="pt", truncation=True).input_ids.to(device)
        
        with torch.no_grad():
            outputs = model_info["model"](input_ids)
            score = outputs.logits.softmax(dim=-1).max().item()  # Get the highest probability
        logger.debug(f"Score for sentence '{sentence}': {score}")
        return score
    except Exception as e:
        logger.exception("Error in score_sentence")
        console.print_exception(show_locals=True)
        return 0.0

def clean_up():
    logger.info("Cleaning up resources")
    gc.collect()  # Trigger garbage collection
