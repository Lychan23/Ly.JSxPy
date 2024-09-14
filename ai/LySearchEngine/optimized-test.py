import os
import requests
import re
from bs4 import BeautifulSoup
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from dotenv import load_dotenv
import logging
from typing import List, Dict
import torch

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load OPT-1.3B model and tokenizer
model_name = "facebook/opt-1.3b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16)  # Use float16 for memory efficiency

def google_search(query: str, api_key: str, cx: str) -> Dict:
    """Perform a Google search using the Custom Search JSON API."""
    url = f'https://www.googleapis.com/customsearch/v1?q={query}&key={api_key}&cx={cx}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return {}

def get_top_results(results: Dict) -> List[Dict]:
    """Extract top search results from the Google search API response."""
    items = results.get('items', [])
    return [{'title': item.get('title'), 'link': item.get('link'), 'snippet': item.get('snippet')}
            for item in items[:3]]  # Reduced to top 3 results

def clean_text(text: str) -> str:
    """Clean and normalize the text."""
    text = re.sub(r'\s+', ' ', text).strip()
    return re.sub(r'[^\w\s]', '', text)

def scrape_website(url: str) -> str:
    """Scrape text content from a given website URL."""
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        logging.info(f"Successfully scraped content from {url}")
        return clean_text(text)[:2000]  # Limit to first 2000 characters
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve {url}: {e}")
        return ""

def summarize_text(text: str) -> str:
    """Summarize the text using OPT-1.3B."""
    prompt = f"Summarize the following text in a few sentences:\n\n{text}\n\nSummary:"
    input_ids = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).input_ids
    
    with torch.no_grad():
        output = model.generate(input_ids, max_new_tokens=150, num_return_sequences=1, temperature=0.7)
    
    summary = tokenizer.decode(output[0], skip_special_tokens=True)
    return summary.split("Summary:")[1].strip()

def answer_question(context: str, question: str) -> str:
    """Generate an answer using OPT-1.3B."""
    prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"
    input_ids = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).input_ids
    
    with torch.no_grad():
        output = model.generate(input_ids, max_new_tokens=150, num_return_sequences=1, temperature=0.7)
    
    answer = tokenizer.decode(output[0], skip_special_tokens=True)
    return answer.split("Answer:")[1].strip()

def main():
    api_key = os.getenv('GOOGLE_API_KEY')
    cx = os.getenv('GOOGLE_CX')
    
    query = input("Enter your search query: ")
    
    # Search and retrieve top results
    search_results = google_search(query, api_key, cx)
    top_results = get_top_results(search_results)

    # Display search results
    print("\nSearch Results:")
    for i, result in enumerate(top_results, 1):
        print(f"{i}. {result['title']}")
        print(f"   {result['link']}")
        print(f"   {result['snippet']}\n")

    # Scrape and process content sequentially
    combined_text = ""
    for result in top_results:
        scraped_text = scrape_website(result['link'])
        combined_text += scraped_text + " "

    # Summarize the combined text
    summary = summarize_text(combined_text)

    # Generate answer
    answer = answer_question(summary, query)

    print("\nGenerated Answer:")
    print(answer)

if __name__ == "__main__":
    main()
