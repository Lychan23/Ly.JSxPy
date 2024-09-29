import torch
from typing import Dict, List
from sklearn.metrics.pairwise import cosine_similarity
from torch.nn.functional import cosine_similarity as torch_cosine_similarity
from nltk.tokenize import sent_tokenize
from textblob import TextBlob
import logging
from .model_manager import ModelManager
from .generation_utils import generate_context_summary, generate_follow_up_questions, generate_summary, calculate_confidence_score
from .fallback_answer import fallback_pipeline
import spacy
import re

logger = logging.getLogger(__name__)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
nlp = spacy.load("en_core_web_sm")

async def enhanced_answer_generation(query: str, raw_context: str, processed_context: str, mode: str) -> Dict:
    try:
        logger.info(f"Starting enhanced answer generation for query: {query}")
        logger.info(f"Mode: {mode}")
        logger.info(f"Raw context length: {len(raw_context)}")
        logger.info(f"Processed context length: {len(processed_context)}")

        bart_cnn = await ModelManager.get_model("bart-cnn", mode)
        logger.info("BART-CNN model loaded")

        context_summary = await generate_context_summary(raw_context, processed_context, query, mode)
        logger.info(f"Context summary generated. Length: {len(context_summary)}")

        sentence_transformer = await ModelManager.get_model("sentence-transformer", mode)
        logger.info("Sentence transformer model loaded")

        segments = processed_context.split()
        logger.info(f"Context split into {len(segments)} segments")

        if not segments:
            logger.warning("No segments found in processed context. Using fallback method.")
            return await fallback_pipeline(query, mode)

        try:
            logger.info("Encoding query")
            query_embedding = sentence_transformer.encode([query], convert_to_tensor=True)
            logger.info(f"Query encoded. Shape: {query_embedding.shape}")

            if len(segments) < 2:
                logger.warning(f"Less than two segments found. Segment count: {len(segments)}. Using fallback method.")
                return await fallback_pipeline(query, mode)
            
            logger.info("Encoding segments")
            segment_embeddings = sentence_transformer.encode(segments, convert_to_tensor=True)
            logger.info(f"Segments encoded. Shape: {segment_embeddings.shape}")
            
            if query_embedding.size(0) == 0 or segment_embeddings.size(0) == 0:
                logger.warning("Empty embeddings generated. Using fallback method.")
                return await fallback_pipeline(query, mode)
            
            logger.info("Calculating similarities")
            similarities = torch_cosine_similarity(query_embedding, segment_embeddings)
            logger.info(f"Similarities calculated. Shape: {similarities.shape}")
            
            if similarities.ndim == 0:
                logger.warning("Similarities is a scalar value. Using fallback method.")
                return await fallback_pipeline(query, mode)
            
            if similarities.ndim == 1:
                top_segments = [segments[i] for i in similarities.argsort(descending=True)[:10]]
            elif similarities.ndim == 2:
                top_segments = [segments[i] for i in similarities[0].argsort(descending=True)[:10]]
            else:
                logger.error(f"Unexpected shape for similarities tensor: {similarities.shape}")
                return await fallback_pipeline(query, mode)
            
            logger.info(f"Selected top {len(top_segments)} segments")
            refined_context = " ".join(top_segments)
            logger.info(f"Refined context created. Length: {len(refined_context)}")
        except Exception as e:
            logger.error(f"Error in semantic similarity ranking: {str(e)}", exc_info=True)
            return await fallback_pipeline(query, mode)
        
        logger.info("Loading RoBERTa QA model")
        roberta_qa = await ModelManager.get_model("roberta-qa", mode)
        logger.info("Preparing input for RoBERTa QA")
        qa_input = roberta_qa["tokenizer"](query, refined_context, return_tensors="pt", truncation=True, max_length=512).to(device)
        logger.info("Generating extractive answer")
        with torch.no_grad():
            qa_outputs = roberta_qa["model"](**qa_input)
        answer_start = torch.argmax(qa_outputs.start_logits)
        answer_end = torch.argmax(qa_outputs.end_logits) + 1
        extractive_answer = roberta_qa["tokenizer"].convert_tokens_to_string(roberta_qa["tokenizer"].convert_ids_to_tokens(qa_input["input_ids"][0][answer_start:answer_end]))
        logger.info(f"Extractive answer generated. Length: {len(extractive_answer)}")
        
        logger.info("Loading FLAN-T5 model")
        flan_t5 = await ModelManager.get_model("flan-t5", mode)
        logger.info("Preparing input for FLAN-T5")
        flan_input = f"""Question: {query}
    Context: {refined_context}
    Raw Context: {raw_context[:1000]}
    Extracted Answer: {extractive_answer}
    Context Summary: {context_summary}

    Provide a comprehensive answer to the question based on all the information above. Be concise yet informative:"""
        flan_input_ids = flan_t5["tokenizer"](flan_input, return_tensors="pt", max_length=1024, truncation=True).input_ids.to(device)
        logger.info("Generating abstractive answer")
        with torch.no_grad():
            flan_outputs = flan_t5["model"].generate(
                flan_input_ids,
                max_length=300,
                num_beams=5,
                early_stopping=True,
                no_repeat_ngram_size=3,
                do_sample=True,
                temperature=0.7,
                top_k=50,
                top_p=0.95
            )
        abstractive_answer = flan_t5["tokenizer"].decode(flan_outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        logger.info(f"Abstractive answer generated. Length: {len(abstractive_answer)}")
        
        logger.info("Generating summary")
        summary = await generate_summary(abstractive_answer, mode)
        logger.info(f"Summary generated. Length: {len(summary)}")
        
        logger.info("Performing sentiment analysis")
        sentiment_pipeline = await ModelManager.get_model("sentiment-analysis", mode)
        sentiment_score = sentiment_pipeline(abstractive_answer)[0]['score']
        logger.info(f"Sentiment score: {sentiment_score}")
        
        logger.info("Calculating confidence score")
        try:
            confidence_score = await calculate_confidence_score(abstractive_answer, extractive_answer, refined_context, query)
            logger.info(f"Confidence score: {confidence_score}")
        except Exception as e:
            logger.error(f"Error calculating confidence score: {str(e)}", exc_info=True)
            confidence_score = 0.0

        logger.info("Generating follow-up questions")
        try:
            follow_up_questions = await generate_follow_up_questions(query, abstractive_answer)
            logger.info(f"Generated {len(follow_up_questions)} follow-up questions")
        except Exception as e:
            logger.error(f"Error generating follow-up questions: {str(e)}", exc_info=True)
            follow_up_questions = []

        logger.info("Preparing result dictionary")
        try:
            result = {
                "extractive_answer": extractive_answer,
                "abstractive_answer": abstractive_answer,
                "summary": summary,
                "context_summary": context_summary,
                "sentiment_score": sentiment_score,
                "confidence_score": confidence_score,
                "follow_up_questions": follow_up_questions
            }
            logger.info("Result dictionary prepared successfully")
        except Exception as e:
            logger.error(f"Error preparing result dictionary: {str(e)}", exc_info=True)
            raise

        logger.info("Answer generation complete")
        try:
            logger.info(f"Result: {result}")  # Log the entire result
        except Exception as e:
            logger.error(f"Error logging result: {str(e)}", exc_info=True)

        logger.info("Returning result")
        return result

    except Exception as e:
        logger.error(f"Unexpected error in enhanced_answer_generation: {str(e)}", exc_info=True)
        logger.info("Falling back to fallback_pipeline")
        try:
            return await fallback_pipeline(query, mode)
        except Exception as fallback_error:
            logger.error(f"Error in fallback_pipeline: {str(fallback_error)}", exc_info=True)
            return {"error": "Both enhanced and fallback pipelines failed"}
