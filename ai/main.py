import time
import random
import logging
import threading
import subprocess
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification
import spacy
import torch
import torch.nn as nn
import torch.optim as optim
from elasticsearch import Elasticsearch
from collections import deque
import numpy as np
from textblob import TextBlob
import json

# Enable logging
logging.basicConfig(level=logging.DEBUG)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# Paths to the models and tokenizer
bert_tokenizer_path = "ai/models/bert-base-uncased"
bert_model_path = "ai/models/bert-base-uncased"

# Load the tokenizer and model for BERT
tokenizer = AutoTokenizer.from_pretrained(bert_tokenizer_path)
model = TFAutoModelForSequenceClassification.from_pretrained(bert_model_path)

# Set up Elasticsearch
es = Elasticsearch(hosts=["http://localhost:9200"])

app = Flask(__name__)

# Store feedback for use in environment
feedback_store = {"feedback": None}

# Spider script to be run in a subprocess
SPIDER_SCRIPT = """
import scrapy
from scrapy.crawler import CrawlerProcess
from elasticsearch import Elasticsearch

class WebScraper(scrapy.Spider):
    name = "web_scraper"

    def __init__(self, search_url, headers, *args, **kwargs):
        super(WebScraper, self).__init__(*args, **kwargs)
        self.start_urls = [search_url]
        self.headers = headers
        self.es = Elasticsearch(hosts=["http://localhost:9200"])

    def parse(self, response):
        search_results = response.xpath('//div[@class="BNeawe vvjwJb AP7Wnd"]/text()').getall()
        descriptions = response.xpath('//div[@class="BNeawe s3v9rd AP7Wnd"]/text()').getall()
        results = [{'title': title, 'description': desc} for title, desc in zip(search_results, descriptions)]
        for result in results:
            self.es.index(index="web_scraping", body=result)
        yield {"results": results}

if __name__ == "__main__":
    import sys
    search_url = sys.argv[1]
    headers = json.loads(sys.argv[2])

    process = CrawlerProcess(settings={"LOG_LEVEL": "ERROR"})
    process.crawl(WebScraper, search_url=search_url, headers=headers)
    process.start()
"""

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "API is running"}), 200

@app.route("/api/webscrape", methods=["POST"])
def webscrape():
    data = request.json
    input_text = data['input']
    logging.debug(f"Received input: {input_text}")

    try:
        inputs = tokenizer(input_text, return_tensors='tf', padding=True, truncation=True)
        outputs = model(inputs)
        logits = outputs.logits.numpy()  # Convert TensorFlow tensor to NumPy array
        search_query = tokenizer.decode(np.argmax(logits), skip_special_tokens=True)
        logging.debug(f"Generated search query: {search_query}")
    except Exception as e:
        logging.error(f"Error generating search query: {e}")
        return jsonify({"detail": f"Error generating search query: {e}"}), 500

    search_url = f"https://www.google.com/search?q={search_query}"
    headers_list = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3", 
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
    ]

    try:
        headers = {"User-Agent": random.choice(headers_list)}

        # Run the spider script in a separate process
        result = subprocess.run(
            ["python3", "-c", SPIDER_SCRIPT, search_url, json.dumps(headers)],
            capture_output=True, text=True
        )

        if result.returncode != 0:
            logging.error(f"Error during web scraping: {result.stderr}")
            return jsonify({"detail": f"Error during web scraping: {result.stderr}"}), 500

        results = json.loads(result.stdout)
        if not results:
            logging.warning("No results found")
            return jsonify({"detail": "No results found"}), 404

        best_result = max(results, key=lambda x: TextBlob(x['description']).sentiment.polarity)
        for result in results:
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

class WebScrapingEnv:
    def __init__(self):
        self.state = 0
        self.episode_ended = False
        self.search_query = ""
        
    def reset(self):
        self.state = 0
        self.episode_ended = False
        return np.array([self.state], dtype=np.float32)

    def step(self, action):
        if self.episode_ended:
            return self.reset(), 0, self.episode_ended, {}
        
        if action == 0:
            try:
                input_text = "Provide input based on the environment state or context"
                inputs = tokenizer(input_text, return_tensors='tf', padding=True, truncation=True)
                outputs = model(inputs)
                self.search_query = tokenizer.decode(outputs.logits[0], skip_special_tokens=True)
                self.state = 1
                reward = 0
            except Exception as e:
                self.episode_ended = True
                return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended, {}

        elif action == 1:
            try:
                search_url = f"https://www.google.com/search?q={self.search_query}"
                headers = {"User-Agent": random.choice(headers_list)}

                result = subprocess.run(
                    ["python3", "-c", SPIDER_SCRIPT, search_url, json.dumps(headers)],
                    capture_output=True, text=True
                )

                if result.returncode != 0:
                    logging.error(f"Error during web scraping: {result.stderr}")
                    self.episode_ended = True
                    return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended

                results = json.loads(result.stdout)
                best_result = max(results, key=lambda x: TextBlob(x['description']).sentiment.polarity) if results else None

                if best_result:
                    reward = TextBlob(best_result['description']).sentiment.polarity
                else:
                    reward = -1.0

                feedback = feedback_store.get("feedback", None)
                if feedback is not None:
                    reward += feedback
                    feedback_store["feedback"] = None

                self.episode_ended = True
                return np.array([self.state], dtype=np.float32), reward, self.episode_ended, {}
            except Exception as e:
                self.episode_ended = True
                return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended, {}

        return np.array([self.state], dtype=np.float32), reward, self.episode_ended, {}

# Define the Q-network
class QNetwork(nn.Module):
    def __init__(self):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(1, 24)
        self.fc2 = nn.Linear(24, 24)
        self.fc3 = nn.Linear(24, 2)  # 2 actions: generate query, web scrape

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

# Initialize environment, Q-network, optimizer, and replay memory
env = WebScrapingEnv()
q_network = QNetwork()
optimizer = optim.Adam(q_network.parameters(), lr=1e-3)
memory = deque(maxlen=2000)

def select_action(state, epsilon):
    if random.random() < epsilon:
        return random.randint(0, 1)
    else:
        with torch.no_grad():
            return q_network(torch.tensor(state, dtype=torch.float32)).argmax().item()

def optimize_model():
    if len(memory) < 32:
        return
    batch = random.sample(memory, 32)
    states, actions, rewards, next_states, dones = zip(*batch)

    states_np = np.array(states)
    states = torch.tensor(states_np, dtype=torch.float32)
    actions = torch.tensor(actions, dtype=torch.int64).unsqueeze(1)
    rewards = torch.tensor(rewards, dtype=torch.float32)
    next_states = torch.tensor(next_states, dtype=torch.float32)
    dones = torch.tensor(dones, dtype=torch.bool)

    state_action_values = q_network(states).gather(1, actions)
    next_state_values = q_network(next_states).max(1)[0]
    expected_state_action_values = rewards + (0.99 * next_state_values * ~dones)

    loss = nn.MSELoss()(state_action_values, expected_state_action_values.unsqueeze(1))
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

def rl_loop():
    epsilon = 1.0
    num_episodes = 1000
    for episode in range(num_episodes):
        state = env.reset()
        total_reward = 0
        while not env.episode_ended:
            action = select_action(state, epsilon)
            next_state, reward, done, _ = env.step(action)
            memory.append((state, action, reward, next_state, done))
            optimize_model()
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
