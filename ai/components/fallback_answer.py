import torch
from typing import Dict, List
from .model_manager import ModelManager
from .generation_utils import generate_summary, generate_follow_up_questions

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

async def fallback_pipeline(query: str, mode: str) -> Dict:
    fallback_answer = await generate_fallback_answer(query, mode)
    
    summary = await generate_summary(fallback_answer, mode)
    
    sentiment_pipeline = await ModelManager.get_model("sentiment-analysis", mode)
    sentiment_score = sentiment_pipeline(fallback_answer)[0]['score']
    
    follow_up_questions = await generate_follow_up_questions(query, fallback_answer)
    
    return {
        "extractive_answer": "",
        "abstractive_answer": fallback_answer,
        "summary": summary,
        "context_summary": "",
        "sentiment_score": sentiment_score,
        "confidence_score": 50.0,
        "follow_up_questions": follow_up_questions
    }

async def generate_fallback_answer(query: str, mode: str) -> str:
    flan_t5 = await ModelManager.get_model("flan-t5", mode)
    
    flan_input = f"Question: {query} Answer:"
    flan_input_ids = flan_t5["tokenizer"](flan_input, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
    
    with torch.no_grad():
        flan_outputs = flan_t5["model"].generate(
            flan_input_ids,
            max_length=200,
            num_beams=8,
            early_stopping=True,
            no_repeat_ngram_size=3,
            do_sample=True,
            temperature=0.6,
            top_k=50,
            top_p=0.95
        )
    
    return flan_t5["tokenizer"].decode(flan_outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)