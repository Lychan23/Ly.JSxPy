import torch
import asyncio
import gc
from contextlib import asynccontextmanager
from typing import Dict, Any
from .model_manager import ModelManager
from .generation_utils import (
    generate_context_summary,
    generate_follow_up_questions,
    generate_summary,
    calculate_confidence_score,
)
from .fallback_answer import fallback_pipeline
from rich.logging import RichHandler
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)

logger = logging.getLogger("rich")

@asynccontextmanager
async def model_context(model_name: str, mode: str):
    model = await ModelManager.get_model(model_name, mode)
    try:
        yield model
    finally:
        del model
        torch.cuda.empty_cache()
        gc.collect()

async def enhanced_answer_generation(query: str, raw_context: str, processed_context: str, mode: str) -> Dict[str, Any]:
    logger.info(f"Starting enhanced answer generation for query: {query}")
    logger.info(f"Mode: {mode}")
    logger.info(f"Raw context length: {len(raw_context)}")
    logger.info(f"Processed context length: {len(processed_context)}")

    result = {}

    try:
        # Generate context summary
        logger.info("Generating context summary")
        async with model_context("bart-cnn", mode) as bart_cnn:
            context_summary = await generate_context_summary(raw_context, processed_context, query, mode)
            result["context_summary"] = context_summary

        # Split and rank context
        logger.info("Loading Sentence Transformer for context ranking")
        async with model_context("sentence-transformer", mode) as sentence_transformer:
            segments = processed_context.split()
            if not segments:
                logger.warning("No segments found in processed context. Using fallback method.")
                return await fallback_pipeline(query, mode)

            query_embedding = sentence_transformer.encode([query], convert_to_tensor=True)
            segment_embeddings = sentence_transformer.encode(segments, convert_to_tensor=True)

            if query_embedding.size(0) == 0 or segment_embeddings.size(0) == 0:
                logger.warning("Empty embeddings generated. Using fallback method.")
                return await fallback_pipeline(query, mode)

            similarities = torch.cosine_similarity(query_embedding, segment_embeddings)
            top_segments = [segments[i] for i in similarities.argsort(descending=True)[:10]]
            refined_context = " ".join(top_segments)
            logger.info(f"Refined context created. Length: {len(refined_context)}")

        # Generate extractive answer
        logger.info("Loading RoBERTa QA model for extractive answer")
        async with model_context("roberta-qa", mode) as roberta_qa:
            qa_input = roberta_qa["tokenizer"](query, refined_context, return_tensors="pt", truncation=True, max_length=512).to(roberta_qa["model"].device)
            with torch.no_grad():
                qa_outputs = roberta_qa["model"](**qa_input)
            answer_start = torch.argmax(qa_outputs.start_logits)
            answer_end = torch.argmax(qa_outputs.end_logits) + 1
            extractive_answer = roberta_qa["tokenizer"].decode(qa_input["input_ids"][0][answer_start:answer_end], skip_special_tokens=True)
            logger.info(f"Extractive answer generated: {extractive_answer}")
            result["extractive_answer"] = extractive_answer

        # Generate abstractive answer
        logger.info("Loading FLAN-T5 model for abstractive answer")
        async with model_context("flan-t5", mode) as flan_t5:
            flan_input = f"""Question: {query}
            Context: {refined_context}
            Raw Context: {raw_context[:1000]}
            Extracted Answer: {extractive_answer}
            Context Summary: {context_summary}

            Provide a comprehensive answer to the question based on all the information above. Be concise yet informative:"""
            flan_input_ids = flan_t5["tokenizer"](flan_input, return_tensors="pt", max_length=1024, truncation=True).input_ids.to(flan_t5["model"].device)
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
            result["abstractive_answer"] = abstractive_answer

        # Generate summary
        logger.info("Generating summary")
        summary = await generate_summary(abstractive_answer, mode)
        result["summary"] = summary
        logger.info(f"Summary generated. Length: {len(summary)}")

        # Generate follow-up questions
        logger.info("Generating follow-up questions")
        follow_up_questions = await generate_follow_up_questions(query, abstractive_answer)
        result["follow_up_questions"] = follow_up_questions
        logger.info(f"Generated {len(follow_up_questions)} follow-up questions")

        # Perform sentiment analysis
        logger.info("Loading sentiment analysis model")
        async with model_context("sentiment-analysis", mode) as sentiment_model:
            sentiment_score = sentiment_model(abstractive_answer)  # No await here, as it's not an async pipeline
            result["sentiment_score"] = sentiment_score[0]['score'] if isinstance(sentiment_score, list) else sentiment_score
            logger.info(f"Sentiment score: {result['sentiment_score']}")

        # Calculate confidence score
        logger.info("Calculating confidence score")
        async with model_context("sentence-transformer", mode) as sentence_transformer:
            confidence_score = await calculate_confidence_score(abstractive_answer, extractive_answer, refined_context, query)
            result["confidence_score"] = confidence_score
            logger.info(f"Confidence score: {confidence_score}")

        return result

    except Exception as e:
        logger.error(f"Unexpected error in enhanced_answer_generation: {str(e)}", exc_info=True)
        logger.info("Falling back to fallback_pipeline")
        try:
            return await fallback_pipeline(query, mode)
        except Exception as fallback_error:
            logger.error(f"Error in fallback_pipeline: {str(fallback_error)}", exc_info=True)
            return {"error": "Both enhanced and fallback pipelines failed"}

    finally:
        # Ensure all models are unloaded and memory is freed
        torch.cuda.empty_cache()
        gc.collect()
