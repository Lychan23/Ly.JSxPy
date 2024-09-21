import os
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForQuestionAnswering, pipeline
from sentence_transformers import SentenceTransformer, util
from sklearn.metrics.pairwise import cosine_similarity
from nltk.tokenize import sent_tokenize
from textblob import TextBlob
import logging
from dotenv import load_dotenv
import ssl
from typing import List, Dict, Tuple

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# SSL context setup
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Initialize models
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

flan_t5_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-large").to(device)
flan_t5_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large")

roberta_qa_model = AutoModelForQuestionAnswering.from_pretrained("deepset/roberta-base-squad2").to(device)
roberta_qa_tokenizer = AutoTokenizer.from_pretrained("deepset/roberta-base-squad2")

sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2').to(device)

t5_summarizer_model = AutoModelForSeq2SeqLM.from_pretrained("t5-small").to(device)
t5_summarizer_tokenizer = AutoTokenizer.from_pretrained("t5-small")

bart_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn").to(device)
bart_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

sentiment_pipeline = pipeline("sentiment-analysis", model="facebook/bart-large-mnli", device=0 if torch.cuda.is_available() else -1)

async def google_search(query: str, api_key: str, cx: str, num_results: int = 10) -> Dict:
    """Perform a Google search using the Custom Search JSON API."""
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'q': query,
        'key': api_key,
        'cx': cx,
        'num': num_results
    }
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, params=params, ssl=ssl_context) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Google Search API returned status code {response.status}")
                    return {}
        except aiohttp.ClientError as e:
            logger.error(f"Error during Google Search API request: {str(e)}")
            return {}

def get_top_results(search_results: Dict) -> List[Dict]:
    """Extract the top search results from the Google Custom Search response."""
    if 'items' not in search_results:
        return []
    return [{'title': item['title'], 'link': item['link'], 'snippet': item['snippet']} for item in search_results['items']]

async def scrape_website(url: str) -> str:
    """Scrape text content from a given website URL."""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=30, ssl=ssl_context) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    for script in soup(["script", "style"]):
                        script.decompose()
                    return soup.get_text()
                else:
                    logger.error(f"Failed to retrieve {url}: HTTP status {response.status}")
                    return ""
        except Exception as e:
            logger.error(f"Error while retrieving {url}: {str(e)}")
            return ""

async def process_result(result: Dict) -> Tuple[str, str]:
    """Process a single search result."""
    try:
        text = await scrape_website(result['link'])
        if not text:
            logger.warning(f"No content scraped from {result['link']}")
            return "", result['link']
        logger.info(f"Processed content from {result['link']}: {text[:100]}...")
        return text, result['link']
    except Exception as e:
        logger.error(f"Error processing result {result['link']}: {e}")
        return "", result['link']

async def fetch_and_process_results(query: str, api_key: str, cx: str) -> Tuple[str, List[str]]:
    """Fetch search results and process them in parallel."""
    search_results = await google_search(query, api_key, cx)
    top_results = get_top_results(search_results)
    
    tasks = [process_result(result) for result in top_results]
    results = await asyncio.gather(*tasks)
    
    combined_text = " ".join([text for text, _ in results if text])
    sources = [url for _, url in results if url]
    
    return combined_text, sources

def generate_context_summary(text: str) -> str:
    """Generate a summary of the input text using BART."""
    inputs = bart_tokenizer([text], max_length=1024, return_tensors="pt", truncation=True).to(device)
    summary_ids = bart_model.generate(inputs["input_ids"], num_beams=4, max_length=150, early_stopping=True)
    summary = bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

def enhanced_answer_generation(query: str, context: str) -> Dict:
    """Generate an enhanced answer using multiple models and techniques."""
    
    # Generate context summary
    context_summary = generate_context_summary(context)
    logger.info(f"Context summary: {context_summary}")
    
    # Use Sentence Transformer for semantic similarity ranking
    sentences = sent_tokenize(context)
    query_embedding = sentence_transformer.encode([query])
    sentence_embeddings = sentence_transformer.encode(sentences)
    similarities = cosine_similarity(query_embedding, sentence_embeddings)[0]
    
    top_sentences = [sentences[i] for i in similarities.argsort()[-5:][::-1]]
    refined_context = " ".join(top_sentences)
    
    # Use RoBERTa for extractive QA
    qa_input = roberta_qa_tokenizer(query, refined_context, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        qa_outputs = roberta_qa_model(**qa_input)
    answer_start = torch.argmax(qa_outputs.start_logits)
    answer_end = torch.argmax(qa_outputs.end_logits) + 1
    extractive_answer = roberta_qa_tokenizer.convert_tokens_to_string(roberta_qa_tokenizer.convert_ids_to_tokens(qa_input["input_ids"][0][answer_start:answer_end]))
    
    # Use FLAN-T5 for abstractive answer generation
    flan_input = f"Answer the following question based on the context, the extracted answer, and the context summary. Question: {query} Context: {refined_context} Extracted Answer: {extractive_answer} Context Summary: {context_summary} Comprehensive answer:"
    flan_input_ids = flan_t5_tokenizer(flan_input, return_tensors="pt", max_length=1024, truncation=True).input_ids.to(device)
    with torch.no_grad():
        flan_outputs = flan_t5_model.generate(
            flan_input_ids,
            max_length=300,
            num_beams=5,
            early_stopping=True,
            no_repeat_ngram_size=3,
            do_sample=True,
            temperature=0.7
        )
    abstractive_answer = flan_t5_tokenizer.decode(flan_outputs[0], skip_special_tokens=True)
    
    # Summarize the abstractive answer using T5
    summarizer_input = f"summarize: {abstractive_answer}"
    summary_input_ids = t5_summarizer_tokenizer(summarizer_input, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
    with torch.no_grad():
        summary_outputs = t5_summarizer_model.generate(summary_input_ids, max_length=150, min_length=50, length_penalty=2.0, num_beams=4, early_stopping=True)
    summary = t5_summarizer_tokenizer.decode(summary_outputs[0], skip_special_tokens=True)
    
    # Perform sentiment analysis
    sentiment_score = sentiment_pipeline(abstractive_answer)[0]['score']
    
    # Calculate confidence score
    confidence_score = calculate_confidence_score(abstractive_answer, extractive_answer, refined_context, query)
    
    # Generate follow-up questions
    follow_up_questions = generate_follow_up_questions(query, abstractive_answer)
    
    return {
        "extractive_answer": extractive_answer,
        "abstractive_answer": abstractive_answer,
        "summary": summary,
        "context_summary": context_summary,
        "sentiment_score": sentiment_score,
        "confidence_score": confidence_score,
        "follow_up_questions": follow_up_questions
    }

def calculate_confidence_score(abstractive_answer: str, extractive_answer: str, context: str, query: str) -> float:
    """Calculate a confidence score based on multiple factors."""
    # Length-based score
    length_score = min(len(abstractive_answer.split()) / 50, 1.0)
    
    # Semantic similarity between query and answers
    texts = [query, abstractive_answer, extractive_answer, context]
    embeddings = sentence_transformer.encode(texts)
    query_sim_abstractive = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    query_sim_extractive = cosine_similarity([embeddings[0]], [embeddings[2]])[0][0]
    answer_sim_context = cosine_similarity([embeddings[1]], [embeddings[3]])[0][0]
    
    # Coherence score (similarity between extractive and abstractive answers)
    coherence_score = cosine_similarity([embeddings[1]], [embeddings[2]])[0][0]
    
    # Readability score
    readability_score = TextBlob(abstractive_answer).sentiment.subjectivity
    
    # Combine scores
    combined_score = (
        length_score * 0.15 +
        query_sim_abstractive * 0.25 +
        query_sim_extractive * 0.15 +
        answer_sim_context * 0.2 +
        coherence_score * 0.15 +
        readability_score * 0.1
    ) * 100
    
    return round(combined_score, 2)

def generate_follow_up_questions(query: str, answer: str) -> List[str]:
    """Generate follow-up questions based on the query and answer."""
    combined_text = f"Based on the question '{query}' and the answer '{answer}', generate 3 follow-up questions:"
    input_ids = flan_t5_tokenizer(combined_text, return_tensors="pt", max_length=512, truncation=True).input_ids.to(device)
    with torch.no_grad():
        outputs = flan_t5_model.generate(input_ids, max_length=100, num_return_sequences=3, num_beams=5, do_sample=True, temperature=0.7)
    questions = [flan_t5_tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
    return questions

async def main():
    api_key = os.getenv('GOOGLE_API_KEY')
    cx = os.getenv('GOOGLE_CX')
    
    if not api_key or not cx:
        logger.error("Google API key or Custom Search Engine ID not found in environment variables.")
        return
    
    user_query = input("Enter your question: ")
    
    # Fetch and process search results
    context, sources = await fetch_and_process_results(user_query, api_key, cx)
    
    # Generate enhanced answer
    enhanced_result = enhanced_answer_generation(user_query, context)
    
    # Display results
    print("\n" + "="*50)
    print("Query:", user_query)
    print("="*50)
    
    print("\nContext Summary:")
    print(enhanced_result['context_summary'])
    
    print("\nExtractive Answer:")
    print(enhanced_result['extractive_answer'])
    
    print("\nAbstractive Answer:")
    print(enhanced_result['abstractive_answer'])
    
    print("\nSummary:")
    print(enhanced_result['summary'])
    
    print(f"\nSentiment Score: {enhanced_result['sentiment_score']:.2f}")
    print(f"Confidence Score: {enhanced_result['confidence_score']:.2f}%")
    
    print("\nFollow-up Questions:")
    for i, question in enumerate(enhanced_result['follow_up_questions'], 1):
        print(f"{i}. {question}")
    
    print("\nSources:")
    for source in set(sources):  # Use set to remove duplicates
        print(f"- {source}")
    
    print("\n" + "="*50)
    
    # Ask if the user wants to continue
    continue_asking = input("\nWould you like to ask another question? (yes/no): ").lower().strip()
    if continue_asking == 'yes':
        await main()  # Recursively call main() for another question
    else:
        print("Thank you for using the enhanced ML answering system!")

if __name__ == "__main__":
    asyncio.run(main())