# ai/main.py

import os
import sys
import time
import random
import logging
import threading
import subprocess
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification
import torch
import torch.optim as optim
from elasticsearch import Elasticsearch
from collections import deque
import numpy as np
from textblob import TextBlob
import json
import spacy

# Enable logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("logs.txt"),
                        logging.StreamHandler()
                    ])

# Add the real path of the `ai` directory to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
ai_dir = os.path.join(script_dir)
sys.path.append(ai_dir)

# Import modules from the `ai` directory
from nlp_model import understand_query
from rl_model import QNetwork, select_action, optimize_model
from web_scraping_env import WebScrapingEnv

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# Paths to the models and tokenizer
bert_tokenizer_path = os.path.join(script_dir, "models/bert-base-uncased")
bert_model_path = os.path.join(script_dir, "models/bert-base-uncased")

# Load the tokenizer and model for BERT
tokenizer = AutoTokenizer.from_pretrained(bert_tokenizer_path)
model = TFAutoModelForSequenceClassification.from_pretrained(bert_model_path)

# Set up Elasticsearch
es = Elasticsearch(hosts=["http://localhost:9200"])

app = Flask(__name__)

# Store feedback for use in environment
feedback_store = {"feedback": None}

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "API is running"}), 200

@app.route("/api/webscrape", methods=["POST"])
def webscrape():
    data = request.json
    if not data or 'input' not in data:
        logging.error("No input provided")
        return jsonify({"detail": "No input provided"}), 400

    input_text = data['input']
    logging.debug(f"Received input: {input_text}")

    try:
        inputs = tokenizer(input_text, return_tensors='tf', padding=True, truncation=True)
        outputs = model(inputs)
        logits = outputs.logits.numpy()
        search_query = tokenizer.decode(np.argmax(logits), skip_special_tokens=True)
        logging.debug(f"Generated search query: {search_query}")
    except Exception as e:
        logging.error(f"Error generating search query: {e}")
        return jsonify({"detail": f"Error generating search query: {e}"}), 500

    search_urls = [
        f"https://www.google.com/search?q={search_query}",
        f"https://www.bing.com/search?q={search_query}",
        f"https://search.yahoo.com/search?p={search_query}"
    ]
    
    headers_list = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3", 
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
    ]

    headers = {"User-Agent": random.choice(headers_list)}

    try:
        process = subprocess.Popen(
            ["scrapy", "runspider", os.path.join(script_dir, "web_scraper/web_scraper/spiders/multi_spider.py"), "-a", f"urls={json.dumps(search_urls)}", "-a", f"headers={json.dumps(headers)}"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            logging.error(f"Error during web scraping: {stderr}")
            return jsonify({"detail": f"Error during web scraping: {stderr}"}), 500

        if stdout.strip():
            results = json.loads(stdout.strip())
        else:
            logging.error("No output from scrapy subprocess")
            return jsonify({"detail": "Error during web scraping"}), 500

        all_results = results['results']

        if not all_results:
            logging.warning("No results found from any source")
            return jsonify({"detail": "No results found"}), 404

        # Combine and find the most relevant result
        best_result = max(all_results, key=lambda x: TextBlob(x['content']).sentiment.polarity)
        for result in all_results:
            es.index(index="web_scraping", body=result)

        return jsonify({"best_result": best_result})
    except Exception as e:
        logging.error(f"Error during web scraping: {e}")
        return jsonify({"detail": f"Error during web scraping: {e}"}), 500

@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.json
    feedback_store["feedback"] = data['feedback']
    return jsonify({"message": "Feedback received"})

env = WebScrapingEnv()
q_network = QNetwork()
optimizer = optim.Adam(q_network.parameters(), lr=1e-3)
memory = deque(maxlen=2000)

def rl_loop():
    epsilon = 1.0
    num_episodes = 1000
    for episode in range(num_episodes):
        state = env.reset()
        total_reward = 0
        while not env.episode_ended:
            action = select_action(state, epsilon, q_network)
            next_state, reward, done, _ = env.step(int(action), tokenizer, model, feedback_store)
            memory.append((state, action, reward, next_state, done))
            optimize_model(memory, q_network, optimizer)
            state = next_state
            total_reward += reward
            if done:
                logging.info(f"Episode {episode} finished with total reward: {total_reward}")
        epsilon = max(0.01, epsilon * 0.995)

def run_server():
    app.run(host="0.0.0.0", port=8000)

if __name__ == "__main__":
    # Start the Flask server in a separate thread
    server_thread = threading.Thread(target=run_server)
    server_thread.start()

    # Wait for a short period to ensure the server is up
    time.sleep(5)

    # Start the RL loop
    rl_loop()
