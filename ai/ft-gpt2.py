import os
import requests
import re
import logging
import random
import time
from bs4 import BeautifulSoup
from transformers import GPT2LMHeadModel, GPT2Tokenizer, AdamW, get_linear_schedule_with_warmup
from torch.utils.data import Dataset, DataLoader
from dotenv import load_dotenv
from typing import List, Dict
import torch

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load pre-trained model and tokenizer
model_name = "gpt2-medium"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

# Add special tokens for different tasks
special_tokens = {"pad_token": "<PAD>", "sep_token": "<SEP>", "additional_special_tokens": ["<SUMMARIZE>", "<QA>", "<SEARCH>"]}
tokenizer.add_special_tokens(special_tokens)
model.resize_token_embeddings(len(tokenizer))

# Google Search API setup
api_key = os.getenv('GOOGLE_API_KEY')
cx = os.getenv('GOOGLE_CX')

class CustomDataset(Dataset):
    def __init__(self, texts, task_labels):
        self.texts = texts
        self.task_labels = task_labels

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        task_token = ["<SUMMARIZE>", "<QA>", "<SEARCH>"][self.task_labels[idx]]
        text = f"{task_token} {self.texts[idx]}"
        return tokenizer(text, padding="max_length", truncation=True, max_length=512, return_tensors="pt")

def fine_tune(model, train_dataset, val_dataset, epochs=3, batch_size=4):
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size)

    optimizer = AdamW(model.parameters(), lr=5e-5)
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=0, num_training_steps=len(train_loader) * epochs)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch in train_loader:
            inputs = {k: v.squeeze().to(device) for k, v in batch.items()}
            outputs = model(**inputs, labels=inputs["input_ids"])
            loss = outputs.loss
            total_loss += loss.item()
            loss.backward()
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()

        avg_train_loss = total_loss / len(train_loader)
        logging.info(f"Epoch {epoch+1}/{epochs}, Training Loss: {avg_train_loss:.4f}")

        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch in val_loader:
                inputs = {k: v.squeeze().to(device) for k, v in batch.items()}
                outputs = model(**inputs, labels=inputs["input_ids"])
                val_loss += outputs.loss.item()
        val_loss /= len(val_loader)
        logging.info(f"Epoch {epoch+1}/{epochs}, Validation Loss: {val_loss:.4f}")

    return model

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
        cleaned_text = clean_text(text)
        logging.info(f"Scraped text length: {len(text)}")
        logging.info(f"Cleaned text length: {len(cleaned_text)}")
        return cleaned_text[:2000]  # Limit to first 2000 characters
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve {url}: {e}")
        return ""


def google_search(query: str) -> List[Dict[str, str]]:
    """Perform a Google search using the Custom Search JSON API and return result snippets."""
    url = f'https://www.googleapis.com/customsearch/v1?q={query}&key={api_key}&cx={cx}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        results = response.json().get('items', [])
        return [{'link': result['link'], 'snippet': result.get('snippet', '')} for result in results[:3]]  # Get the top 3 results with snippets
    except requests.exceptions.RequestException as e:
        logging.error(f"Google search request failed: {e}")
        return []

def generate_new_query(snippets: List[str], num_queries: int = 3) -> List[str]:
    """Generate new queries from the search result snippets."""
    new_queries = []
    for snippet in snippets:
        words = snippet.split()
        # Pick random keywords from the snippet to form new queries
        if len(words) > 3:
            new_query = ' '.join(random.sample(words, min(3, len(words))))
            new_queries.append(new_query)
        if len(new_queries) >= num_queries:
            break
    return new_queries

def save_model(model, epoch: int):
    """Save the model at a given epoch."""
    model_save_path = f"gpt2_finetuned_epoch_{epoch}.pt"
    torch.save(model.state_dict(), model_save_path)
    logging.info(f"Model checkpoint saved at {model_save_path}")

def main():
    global model  # Declare model as global to fix the UnboundLocalError

    # Initialize with a starting query
    initial_queries = [
        "Artificial intelligence",
        "Machine learning",
        "Natural language processing",
        "Deep learning",
        "Computer vision"
    ]

    searched_queries = set()  # To track already-searched queries
    max_epochs = 10  # Set a maximum number of epochs
    min_data_size = 100  # Minimum number of texts required for training

    for epoch in range(max_epochs):
        logging.info(f"Starting epoch {epoch + 1}/{max_epochs}")

        if not initial_queries:
            logging.info("No more queries left. Ending training.")
            break

        current_query = initial_queries.pop(0)
        logging.info(f"Searching for query: {current_query}")
        searched_queries.add(current_query)

        # Fetch training data
        train_texts, val_texts = [], []
        train_labels, val_labels = [], []

        results = google_search(current_query)
        logging.info(f"Google search results: {results}")

        texts = [scrape_website(result['link']) for result in results]
        logging.info(f"Scraped texts: {texts}")

        if len(texts) < min_data_size:
            logging.warning(f"Insufficient data found for query: {current_query}. Skipping this query.")
            continue

        # Split data into training and validation sets
        split_index = int(0.8 * len(texts))
        train_texts.extend(texts[:split_index])
        val_texts.extend(texts[split_index:])
        train_labels.extend([0] * split_index)  # 0 for SUMMARIZE task
        val_labels.extend([0] * (len(texts) - split_index))

        # Generate new queries from snippets to continue search
        snippets = [result['snippet'] for result in results]
        new_queries = generate_new_query(snippets)
        initial_queries.extend([query for query in new_queries if query not in searched_queries])

        # Create datasets
        train_dataset = CustomDataset(train_texts, train_labels)
        val_dataset = CustomDataset(val_texts, val_labels)

        # Fine-tune the model
        model = fine_tune(model, train_dataset, val_dataset)

        # Save model checkpoint
        save_model(model, epoch)

        # Sleep to avoid overwhelming Google API
        time.sleep(60)  # Wait for 1 minute between each cycle

    logging.info("Training complete.")


if __name__ == "__main__":
    main()