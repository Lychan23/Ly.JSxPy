import os
import asyncio
import aiohttp
import re
from bs4 import BeautifulSoup
from transformers import BertTokenizer, BertModel, T5Tokenizer, T5ForConditionalGeneration
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import logging
import torch
import json
from typing import List, Dict
from functools import lru_cache
import aiofiles
import hashlib
import ssl
import spacy

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize models
bert_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
bert_model = BertModel.from_pretrained("bert-base-uncased").to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))

t5_tokenizer = T5Tokenizer.from_pretrained("t5-large", legacy=False)
t5_model = T5ForConditionalGeneration.from_pretrained("t5-large").to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))

sentence_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

# Spacy model
nlp = spacy.load("en_core_web_md")

# Cache directory
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Create a custom SSL context that doesn't verify certificates
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

@lru_cache(maxsize=100)
async def google_search(query: str, api_key: str, cx: str) -> Dict:
    """Perform a Google search using the Custom Search JSON API with caching."""
    cache_file = os.path.join(CACHE_DIR, f"search_{hashlib.md5(query.encode()).hexdigest()}.json")
    if os.path.exists(cache_file):
        async with aiofiles.open(cache_file, 'r') as f:
            return json.loads(await f.read())

    url = f'https://www.googleapis.com/customsearch/v1?q={query}&key={api_key}&cx={cx}'
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, ssl=ssl_context) as response:
                response.raise_for_status()
                result = await response.json()
                async with aiofiles.open(cache_file, 'w') as f:
                    await f.write(json.dumps(result))
                return result
        except aiohttp.ClientError as e:
            logging.error(f"Request failed: {e}")
            return {}

def get_top_results(results: Dict) -> List[Dict]:
    """Extract top search results from the Google search API response."""
    items = results.get('items', [])
    return [{'title': item.get('title'), 'link': item.get('link'), 'snippet': item.get('snippet')}
            for item in items[:5]]

def clean_text(text: str) -> str:
    """Clean and normalize the text."""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'[^\w\s.]', '', text)
    return text

async def scrape_website(url: str) -> str:
    """Scrape text content from a given website URL with caching and improved error handling."""
    cache_file = os.path.join(CACHE_DIR, f"scrape_{hashlib.md5(url.encode()).hexdigest()}.txt")
    if os.path.exists(cache_file):
        async with aiofiles.open(cache_file, 'r', encoding='utf-8') as f:
            return await f.read()

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=30, ssl=ssl_context, allow_redirects=True) as response:
                if response.status != 200:
                    logging.error(f"Failed to retrieve {url}: HTTP status {response.status}")
                    return ""

                content_type = response.headers.get('Content-Type', '')
                if 'text/html' not in content_type.lower():
                    logging.error(f"Unexpected content type for {url}: {content_type}")
                    return ""

                html = await response.text(encoding='utf-8', errors='ignore')
                soup = BeautifulSoup(html, 'html.parser')
                for script in soup(["script", "style"]):
                    script.decompose()
                text = soup.get_text()
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = '\n'.join(chunk for chunk in chunks if chunk)
                cleaned_text = clean_text(text)
                
                if not cleaned_text:
                    logging.warning(f"No text content extracted from {url}")
                    return ""

                async with aiofiles.open(cache_file, 'w', encoding='utf-8') as f:
                    await f.write(cleaned_text)
                logging.info(f"Successfully scraped content from {url}")
                return cleaned_text
        except aiohttp.ClientError as e:
            logging.error(f"aiohttp.ClientError while retrieving {url}: {str(e)}")
        except asyncio.TimeoutError:
            logging.error(f"Timeout while retrieving {url}")
        except Exception as e:
            logging.error(f"Unexpected error while retrieving {url}: {str(e)}")
        return ""

def extract_key_info_with_bert(text: str, query: str) -> str:
    """Extract key information from the text using BERT embeddings and cosine similarity."""
    sentences = [sent.text for sent in nlp(text).sents]
    query_embedding = bert_model(**bert_tokenizer(query, return_tensors='pt', truncation=True, max_length=512)).last_hidden_state.mean(dim=1)
    sentence_embeddings = [bert_model(**bert_tokenizer(sentence, return_tensors='pt', truncation=True, max_length=512)).last_hidden_state.mean(dim=1) for sentence in sentences]
    
    # Compute cosine similarity
    similarities = [cosine_similarity(query_embedding.detach().cpu(), sent_emb.detach().cpu())[0][0] for sent_emb in sentence_embeddings]
    
    # Find the most similar sentence
    most_similar_idx = similarities.index(max(similarities))
    return sentences[most_similar_idx]

def generate_answer_with_t5(context: str, query: str) -> Dict:
    """Generate a structured answer using T5 based on the context and query."""
    if not context.strip():
        return {
            "main_answer": "I'm sorry, but I couldn't find any relevant information to answer your question.",
            "additional_info": None,
            "confidence_score": 0,
            "sources": []
        }

    # Generate answer using T5
    answer_prompt = f"question: {query}\ncontext: {context}\nAnswer:"
    input_ids = t5_tokenizer.encode(answer_prompt, return_tensors="pt", max_length=512, truncation=True).to(t5_model.device)
    answer_ids = t5_model.generate(input_ids, max_length=200, num_beams=4, length_penalty=2.0, early_stopping=True)
    answer = t5_tokenizer.decode(answer_ids[0], skip_special_tokens=True)

    # Generate confidence score
    confidence_prompt = f"Rate the confidence of this answer from 0 to 100:\nQuestion: {query}\nAnswer: {answer}"
    input_ids = t5_tokenizer.encode(confidence_prompt, return_tensors="pt", max_length=512, truncation=True).to(t5_model.device)
    confidence_ids = t5_model.generate(input_ids, max_length=10, num_beams=4, length_penalty=2.0, early_stopping=True)
    confidence_score = t5_tokenizer.decode(confidence_ids[0], skip_special_tokens=True)

    try:
        confidence_score = int(re.search(r'\d+', confidence_score).group())
    except:
        confidence_score = 0

    return {
        "main_answer": answer,
        "additional_info": None,
        "confidence_score": confidence_score,
        "sources": []
    }

def meta_safeguard(text: str) -> str:
    """Apply meta safeguards to the generated text."""
    toxic_words = ["explicit", "offensive", "harmful"]  # Expand this list as needed
    for word in toxic_words:
        if word in text.lower():
            return json.dumps({
                "main_answer": "I apologize, but I cannot provide an answer that may contain inappropriate content.",
                "additional_info": None,
                "confidence_score": 0,
                "sources": []
            })
    return text

def prompt_guard(query: str) -> str:
    """Apply prompt guarding to the user's query."""
    if any(word in query.lower() for word in ["hack", "illegal", "exploit"]):
        return "I'm sorry, but I cannot assist with potentially harmful or illegal activities."
    return query

def extract_keywords(text: str) -> str:
    """Extract keywords from the input text using Spacy."""
    doc = nlp(text)
    keywords = [token.text for token in doc if not token.is_stop and not token.is_punct and token.pos_ in ['NOUN', 'PROPN', 'ADJ']]
    return ' '.join(keywords)

async def process_result(result: Dict, query: str) -> str:
    """Process a single search result."""
    try:
        text = await scrape_website(result['link'])
        if not text:
            logging.warning(f"No content scraped from {result['link']}")
            return ""
        key_info = extract_key_info_with_bert(text, query)
        logging.info(f"Extracted key info from {result['link']}: {key_info[:100]}...")
        return key_info
    except Exception as e:
        logging.error(f"Error processing result {result['link']}: {e}")
        return ""

async def main():
    api_key = os.getenv('GOOGLE_API_KEY')
    cx = os.getenv('GOOGLE_CX')
    
    user_query = input("Enter your question: ")
    user_query = prompt_guard(user_query)
    
    if user_query.startswith("I'm sorry"):
        print(user_query)
        return

    # Extract keywords for search query
    search_query = extract_keywords(user_query)
    logging.info(f"Extracted keywords for search: {search_query}")

    # Search and retrieve top results
    search_results = await google_search(search_query, api_key, cx)
    top_results = get_top_results(search_results)

    # Display search results
    print("\nSearch Results:")
    for i, result in enumerate(top_results, 1):
        print(f"{i}. {result['title']}")
        print(f"   {result['link']}")
        print(f"   {result['snippet']}\n")

    # Process results in parallel
    tasks = [process_result(result, user_query) for result in top_results]
    key_infos = await asyncio.gather(*tasks)

    combined_info = " ".join(key_infos)
    logging.info(f"Combined info: {combined_info[:200]}...")
    
    # Generate answer
    answer = generate_answer_with_t5(combined_info, user_query)

    safe_answer = meta_safeguard(json.dumps(answer))

    print("\nGenerated Answer:")
    print(json.dumps(json.loads(safe_answer), indent=2))

if __name__ == "__main__":
    asyncio.run(main())
