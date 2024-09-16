import os
import requests
import re
import logging
import random
import time
from bs4 import BeautifulSoup
from transformers import GPT2LMHeadModel, GPT2Tokenizer, AdamW, get_linear_schedule_with_warmup
from transformers import BertTokenizer, BertModel
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType
from sklearn.cluster import KMeans
from torch.utils.data import DataLoader
from dotenv import load_dotenv
from typing import List, Dict
import torch
import torch.nn.functional as F
import numpy as np

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load pre-trained models and tokenizers
gpt2_model_name = "gpt2-medium"
bert_model_name = "bert-base-uncased"

gpt2_tokenizer = GPT2Tokenizer.from_pretrained(gpt2_model_name)
gpt2_model = GPT2LMHeadModel.from_pretrained(gpt2_model_name)

bert_tokenizer = BertTokenizer.from_pretrained(bert_model_name)
bert_model = BertModel.from_pretrained(bert_model_name)

# Add special tokens for different tasks
special_tokens = {"pad_token": "<PAD>", "sep_token": "<SEP>", "additional_special_tokens": ["<SUMMARIZE>", "<QA>", "<SEARCH>"]}
gpt2_tokenizer.add_special_tokens(special_tokens)
gpt2_model.resize_token_embeddings(len(gpt2_tokenizer))

# Google Search API setup
api_key = os.getenv('GOOGLE_API_KEY')
cx = os.getenv('GOOGLE_CX')

def clean_text(text: str) -> str:
    """Clean and normalize the text."""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'[^\w\s]', '', text)
    return text.lower()

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
        logging.info(f"Scraped and cleaned text length: {len(cleaned_text)}")
        return cleaned_text
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
        return [{'link': result['link'], 'snippet': result.get('snippet', '')} for result in results[:10]]
    except requests.exceptions.RequestException as e:
        logging.error(f"Google search request failed: {e}")
        return []

def get_bert_embeddings(texts: List[str]) -> np.ndarray:
    """Get BERT embeddings for a list of texts."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    bert_model.to(device)
    bert_model.eval()

    embeddings = []
    with torch.no_grad():
        for text in texts:
            inputs = bert_tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
            inputs = {k: v.to(device) for k, v in inputs.items()}
            outputs = bert_model(**inputs)
            embedding = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
            embeddings.append(embedding)

    return np.vstack(embeddings)

def cluster_texts(texts: List[str], n_clusters: int = 5) -> List[int]:
    """Cluster texts into topics using BERT embeddings and K-means."""
    embeddings = get_bert_embeddings(texts)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    return kmeans.fit_predict(embeddings)

def select_diverse_samples(texts: List[str], n_samples: int = 1000) -> List[str]:
    """Select diverse samples from the collected texts."""
    if len(texts) <= n_samples:
        return texts
    
    clusters = cluster_texts(texts)
    selected_texts = []
    for cluster in range(max(clusters) + 1):
        cluster_texts = [text for text, c in zip(texts, clusters) if c == cluster]
        selected_texts.extend(random.sample(cluster_texts, min(len(cluster_texts), n_samples // (max(clusters) + 1))))
    
    return selected_texts

def fine_tune_efficient(model, train_texts, val_texts, epochs=3, batch_size=4):
    # Prepare datasets
    train_dataset = Dataset.from_dict({"text": train_texts})
    val_dataset = Dataset.from_dict({"text": val_texts})

    # Tokenize datasets
    def tokenize_function(examples):
        return gpt2_tokenizer(examples["text"], padding="max_length", truncation=True, max_length=512)

    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_val = val_dataset.map(tokenize_function, batched=True)

    # Set up LoRA
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        inference_mode=False,
        r=16,
        lora_alpha=32,
        lora_dropout=0.1
    )
    model = get_peft_model(model, peft_config)

    # Prepare data loaders
    train_loader = DataLoader(tokenized_train, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(tokenized_val, batch_size=batch_size)

    # Set up optimizer and scheduler
    optimizer = AdamW(model.parameters(), lr=2e-5)
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=100, num_training_steps=len(train_loader) * epochs)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch in train_loader:
            inputs = {k: v.to(device) for k, v in batch.items()}
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
                inputs = {k: v.to(device) for k, v in batch.items()}
                outputs = model(**inputs, labels=inputs["input_ids"])
                val_loss += outputs.loss.item()
        val_loss /= len(val_loader)
        logging.info(f"Epoch {epoch+1}/{epochs}, Validation Loss: {val_loss:.4f}")

    return model

def generate_new_queries(texts: List[str], n_queries: int = 5) -> List[str]:
    """Generate new queries based on the most common topics in the texts."""
    embeddings = get_bert_embeddings(texts)
    kmeans = KMeans(n_clusters=n_queries, random_state=42)
    clusters = kmeans.fit_predict(embeddings)
    
    centroids = kmeans.cluster_centers_
    new_queries = []
    
    for centroid in centroids:
        closest_text_idx = np.argmin(np.linalg.norm(embeddings - centroid, axis=1))
        closest_text = texts[closest_text_idx]
        keywords = " ".join(closest_text.split()[:3])  # Use first 3 words as keywords
        new_queries.append(f"Latest developments in {keywords}")
    
    return new_queries

def main():
    global gpt2_model

    initial_queries = [
        "Artificial intelligence",
        "Climate change",
        "Quantum computing",
        "Renewable energy",
        "Biotechnology"
    ]

    searched_queries = set()
    epochs = 0
    max_epochs = 100
    samples_per_topic = 200
    min_total_samples = 1000

    all_texts = []

    start_time = time.time()
    training_duration = 3600  # 1 hour in seconds

    try:
        while epochs < max_epochs:
            logging.info(f"Starting epoch {epochs + 1}")
            logging.info(f"Current number of collected texts: {len(all_texts)}")
            logging.info(f"Searched queries: {searched_queries}")

            for query in initial_queries:
                if query in searched_queries:
                    logging.info(f"Skipping already searched query: {query}")
                    continue

                logging.info(f"Searching for query: {query}")
                searched_queries.add(query)

                try:
                    results = google_search(query)
                    logging.info(f"Google search results: {len(results)} items")

                    for result in results:
                        try:
                            text = scrape_website(result['link'])
                            if text:
                                all_texts.append(text)
                                logging.info(f"Successfully scraped text from {result['link']}. Total texts: {len(all_texts)}")
                            else:
                                logging.warning(f"Failed to scrape text from {result['link']}")
                        except Exception as e:
                            logging.error(f"Error scraping {result['link']}: {str(e)}")

                    # Sleep to avoid overwhelming Google API
                    time.sleep(60)  # Wait for 1 minute between each query
                except Exception as e:
                    logging.error(f"Error processing query '{query}': {str(e)}")

            logging.info(f"Total collected texts after queries: {len(all_texts)}")

            if len(all_texts) < min_total_samples:
                logging.warning(f"Insufficient samples collected. Needed {min_total_samples}, got {len(all_texts)}. Generating new queries and continuing.")
                initial_queries = generate_new_queries(all_texts)
                logging.info(f"Generated new queries: {initial_queries}")
                continue

            logging.info("Sufficient samples collected. Proceeding to select diverse samples and fine-tune.")
            
            # Select diverse samples
            selected_texts = select_diverse_samples(all_texts, n_samples=min_total_samples)
            logging.info(f"Selected {len(selected_texts)} diverse samples for training")
            
            # Split into train and validation sets
            split_index = int(0.8 * len(selected_texts))
            train_texts = selected_texts[:split_index]
            val_texts = selected_texts[split_index:]

            logging.info("Starting fine-tuning")
            # Fine-tune the model
            try:
                gpt2_model = fine_tune_efficient(gpt2_model, train_texts, val_texts)
                logging.info("Fine-tuning completed successfully")
            except Exception as e:
                logging.error(f"Error during fine-tuning: {str(e)}")
                # Consider whether to break or continue here

            # Check if 1 hour has passed
            current_time = time.time()
            if current_time - start_time >= training_duration:
                logging.info("1 hour of training completed. Saving the model...")
                save_path = "advanced_gpt2_finetuned_1hour.pt"
                torch.save(gpt2_model.state_dict(), save_path)
                logging.info(f"Model saved at {save_path}")
                break  # Exit the training loop

            # Increment epoch counter
            epochs += 1

            # Generate new queries for the next epoch
            initial_queries = generate_new_queries(all_texts)
            logging.info(f"Generated new queries for next epoch: {initial_queries}")

            # Clear the all_texts list only after generating new queries
            all_texts = []

    except KeyboardInterrupt:
        logging.info("Training interrupted. Saving final model...")
        save_path = f"advanced_gpt2_finetuned_final.pt"
        torch.save(gpt2_model.state_dict(), save_path)
        logging.info(f"Final model saved at {save_path}")
    except Exception as e:
        logging.error(f"Unexpected error in main loop: {str(e)}")
        logging.info("Attempting to save model despite error...")
        save_path = f"advanced_gpt2_finetuned_error.pt"
        torch.save(gpt2_model.state_dict(), save_path)
        logging.info(f"Model saved at {save_path}")

if __name__ == "__main__":
    main()