import os
import requests
import re
from bs4 import BeautifulSoup
from transformers import pipeline, AutoTokenizer, AutoModel
from dotenv import load_dotenv
import logging
import torch
from typing import List, Dict

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
            for item in items[:5]]

def clean_text(text: str) -> str:
    """Clean and normalize the text."""
    return re.sub(r'\s+', ' ', text).strip()

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
        text = '\n'.join(chunk for chunk in chunks if chunk)
        logging.info(f"Successfully scraped content from {url}")
        return clean_text(text)
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve {url}: {e}")
        return ""

def extract_key_info(text: str) -> str:
    """Extract key information from the text using BERT."""
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
    model = AutoModel.from_pretrained("bert-base-uncased")

    # Truncate or split the text if it's too long
    max_length = 512
    chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]

    key_info = []
    for chunk in chunks[:5]:  # Process up to 5 chunks
        inputs = tokenizer(chunk, return_tensors="pt", padding=True, truncation=True, max_length=max_length)
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Use the [CLS] token embedding as a summary of the chunk
        summary_embedding = outputs.last_hidden_state[:, 0, :]
        
        # Convert the summary embedding back to text
        summary_tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
        summary = tokenizer.decode(tokenizer.convert_tokens_to_ids(summary_tokens[:100]))  # Limit to 100 tokens
        key_info.append(summary)

    return " ".join(key_info)

def generate_answer(context: str, query: str) -> str:
    """Generate an answer using GPT-2 based on the context and query."""
    generator = pipeline('text-generation', model='gpt2-medium')
    
    prompt = f"""Based on the following information:
{context}

Provide a concise and accurate answer to this question:
{query}

Answer:"""
    
    try:
        response = generator(
            prompt,
            max_new_tokens=150,
            num_return_sequences=1,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.7
        )[0]['generated_text']
        
        # Extract only the generated part of the response
        answer_start = response.find("Answer:") + 7
        generated_answer = response[answer_start:].strip()
        return generated_answer
    except Exception as e:
        logging.error(f"Error in GPT-2 generation: {str(e)}")
        return f"An error occurred during text generation: {str(e)}"

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

    # Scrape content from top results
    scraped_texts = [scrape_website(result['link']) for result in top_results]
    combined_text = " ".join(scraped_texts)

    # Extract key information
    key_info = extract_key_info(combined_text)
    
    # Generate answer
    answer = generate_answer(key_info, query)

    print("\nGenerated Answer:")
    print(answer)

if __name__ == "__main__":
    main()