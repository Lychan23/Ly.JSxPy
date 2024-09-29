import torch
from typing import Dict
from .model_manager import ModelManager
from .enhanced_answer import enhanced_answer_generation
from .fallback_answer import fallback_pipeline

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

async def combined_answer_generation(query: str, raw_context: str, processed_context: str, mode: str) -> Dict:
    # Generate answers from both pipelines
    enhanced_result = await enhanced_answer_generation(query, raw_context, processed_context, mode)
    fallback_result = await fallback_pipeline(query, mode)

    # Use FLAN-T5 to generate a final combined answer
    flan_t5 = await ModelManager.get_model("flan-t5", mode)
    flan_input = f"""Question: {query}
Main Answer: {enhanced_result['abstractive_answer']}
Fallback Answer: {fallback_result['abstractive_answer']}

Provide a comprehensive and coherent answer that combines the information from both answers above:"""
    flan_input_ids = flan_t5["tokenizer"](flan_input, return_tensors="pt", max_length=1024, truncation=True).input_ids.to(device)
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
    combined_answer = flan_t5["tokenizer"].decode(flan_outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)

    # Combine other elements
    combined_result = {
        "extractive_answer": enhanced_result['extractive_answer'],
        "abstractive_answer": combined_answer,
        "summary": enhanced_result['summary'],
        "context_summary": enhanced_result['context_summary'],
        "sentiment_score": (enhanced_result['sentiment_score'] + fallback_result['sentiment_score']) / 2,
        "confidence_score": (enhanced_result['confidence_score'] + fallback_result['confidence_score']) / 2,
        "follow_up_questions": enhanced_result['follow_up_questions'] + fallback_result['follow_up_questions']
    }

    return combined_result