import torch
from typing import Dict
from .model_manager import ModelManager
from .generation_utils import generate_summary, generate_follow_up_questions

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

async def offline_mode(query: str, mode: str) -> Dict:
    flan_t5 = await ModelManager.get_model("flan-t5", mode)
    
    prompt = f"""Generate a comprehensive answer to the following question without using any external information:

Question: {query}

Provide a detailed response that:
1. Addresses the main points of the question
2. Offers relevant examples or explanations
3. Acknowledges any limitations in answering without access to real-time information

Answer:"""

    input_ids = flan_t5["tokenizer"](prompt, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
    
    with torch.no_grad():
        outputs = flan_t5["model"].generate(
            input_ids,
            max_length=300,
            num_beams=5,
            early_stopping=True,
            no_repeat_ngram_size=3,
            do_sample=True,
            temperature=0.7,
            top_k=50,
            top_p=0.95
        )
    
    offline_answer = flan_t5["tokenizer"].decode(outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
    
    summary = await generate_summary(offline_answer, mode)
    sentiment_pipeline = await ModelManager.get_model("sentiment-analysis", mode)
    sentiment_score = sentiment_pipeline(offline_answer)[0]['score']
    follow_up_questions = await generate_follow_up_questions(query, offline_answer)
    
    return {
        "extractive_answer": "",
        "abstractive_answer": offline_answer,
        "summary": summary,
        "context_summary": "No context available in offline mode.",
        "sentiment_score": sentiment_score,
        "confidence_score": 50.0,  # Fixed confidence score for offline mode
        "follow_up_questions": follow_up_questions,
        "sources": []  # Empty sources list for offline mode
    }