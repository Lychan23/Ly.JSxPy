import os
import sys
import time
import random
import logging
import threading
import subprocess
import json
from flask import Flask, request, jsonify
from collections import deque
from transformers import T5Tokenizer, T5ForConditionalGeneration
import numpy as np
from textblob import TextBlob
import spacy
import torch.optim as optim
import torch
import torch.nn as nn
from elasticsearch import Elasticsearch

# Import the Elasticsearch client
from web_scraper.elastic_search import ElasticSearchClient

# Enable logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("logs.txt"),
                        logging.StreamHandler()
                    ])

# Add the real path of the ai directory to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

# Flask app initialization
app = Flask(__name__)

# Store feedback for use in environment
feedback_store = {"feedback": None}

# Load the spaCy model for English NLP
nlp = spacy.load("en_core_web_sm")

def understand_query(query):
    """
    Process a query string and extract named entities.

    Args:
        query (str): The query string to process.

    Returns:
        list of tuples: A list of tuples where each tuple contains the entity text and its label.
    """
    doc = nlp(query)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    return entities

# Define the QNetwork, select_action, and optimize_model functions directly in this file
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

def select_action(state, epsilon, q_network):
    if np.random.rand() < epsilon:
        return int(np.random.randint(2))  # Random action for exploration
    else:
        with torch.no_grad():
            state_tensor = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
            return int(q_network(state_tensor).argmax().item())  # Choose best action

def optimize_model(memory, q_network, optimizer):
    if len(memory) < 32:
        return

    batch = random.sample(memory, 32)
    states, actions, rewards, next_states, dones = zip(*batch)

    # Convert to tensors with correct dimensions
    states = torch.tensor(np.array(states), dtype=torch.float32).unsqueeze(1)  # [batch_size, 1]
    actions = torch.tensor(actions, dtype=torch.int64).view(-1, 1)  # [batch_size, 1]
    rewards = torch.tensor(rewards, dtype=torch.float32)  # [batch_size]
    next_states = torch.tensor(np.array(next_states), dtype=torch.float32).unsqueeze(1)  # [batch_size, 1]
    dones = torch.tensor(dones, dtype=torch.bool)  # [batch_size]

    # Ensure the correct dimensions for gathering
    state_action_values = torch.index_select(q_network(states), 1, actions.flatten())

    # Compute V(s_{t+1}) for all next states
    next_state_values = q_network(next_states).max(1)[0].detach()

    # Compute the expected Q values
    expected_state_action_values = rewards + (0.99 * next_state_values * (~dones))

    # Compute loss
    loss = nn.MSELoss()(state_action_values, expected_state_action_values.unsqueeze(1))

    # Optimize the model
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

# Define the WebScrapingEnv class
class WebScrapingEnv:
    def __init__(self):
        self.state = 0
        self.episode_ended = False
        self.search_query = ""
        self.headers_list = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3", 
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
            "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
        ]
        
        # Initialize T5 model and tokenizer
        self.tokenizer = T5Tokenizer.from_pretrained(
            os.path.join(script_dir, "models/t5-small"),
            legacy=False
        )
        self.model = T5ForConditionalGeneration.from_pretrained(
            os.path.join(script_dir, "models/t5-small")
        )

    def reset(self):
        self.state = 0
        self.episode_ended = False
        return np.array([self.state], dtype=np.float32)

    def step(self, action, feedback_store):
        if self.episode_ended:
            return self.reset(), 0, self.episode_ended, {}

        if action == 0:
            try:
                input_text = "Provide input based on the environment state or context"
                inputs = self.tokenizer.encode("translate English to English: " + input_text, return_tensors='pt')
                outputs = self.model.generate(inputs, max_length=50, num_beams=5, early_stopping=True)
                self.search_query = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                self.state = 1
                reward = 0
            except Exception as e:
                logging.error(f"Error in step action 0: {e}")
                self.episode_ended = True
                return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended, {}

        elif action == 1:
            try:
                search_url = f"https://www.google.com/search?q={self.search_query}"
                headers = {"User-Agent": random.choice(self.headers_list)}
                result = subprocess.run(
                    ["python3", "run_scrapy.py", search_url, json.dumps(headers)],
                    capture_output=True, text=True
                )

                logging.debug(f"Subprocess stdout: {result.stdout}")
                logging.debug(f"Subprocess stderr: {result.stderr}")

                if not result.stdout.strip():
                    logging.error("Empty or invalid JSON output from subprocess")
                    return np.array([self.state], dtype=np.float32), -1.0, True, {}

                try:
                    results = json.loads(result.stdout)
                except json.JSONDecodeError as e:
                    logging.error(f"Error decoding JSON: {e}")
                    return np.array([self.state], dtype=np.float32), -1.0, True, {}

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
                logging.error(f"Error in step action 1: {e}")
                self.episode_ended = True
                return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended, {}

        return np.array([self.state], dtype=np.float32), reward, self.episode_ended, {}

# Initialize the RL environment and model
env = WebScrapingEnv()
q_network = QNetwork()
optimizer = optim.Adam(q_network.parameters(), lr=1e-3)
memory = deque(maxlen=2000)

# Initialize Elasticsearch client
es_client = ElasticSearchClient()

@app.route("/api/webscrape", methods=["POST"])
def webscrape():
    data = request.json
    if not data or 'input' not in data:
        logging.error("No input provided")
        return jsonify({"detail": "No input provided"}), 400

    input_text = data['input']
    logging.debug(f"Received input: {input_text}")

    try:
        understood_query = understand_query(input_text)
        logging.debug(f"Understood query: {understood_query}")

        if not understood_query:
            logging.error("Understood query is empty or invalid.")
            return jsonify({"detail": "Understood query is empty or invalid."}), 400

        query_text = " ".join([entity[0] for entity in understood_query])
        inputs = env.tokenizer.encode("translate English to English: " + query_text, return_tensors='pt')
        
        # Generate the output
        with torch.no_grad():
            outputs = env.model.generate(inputs, max_length=50, num_beams=5, early_stopping=True)
        
        search_query = env.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        if not search_query.strip():
            logging.error("Generated search query is empty.")
            return jsonify({"detail": "Generated search query is empty."}), 400

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
                ["scrapy", "runspider", os.path.join(script_dir, "web_scraper/multi_spider.py"), "-a", f"urls={json.dumps(search_urls)}", "-a", f"headers={json.dumps(headers)}"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                logging.error(f"Error during web scraping: {stderr}")
                return jsonify({"detail": f"Error during web scraping: {stderr}"}), 500
            try:
                results = json.loads(stdout.strip())
            except json.JSONDecodeError as e:
                logging.error(f"Error decoding JSON: {e}")
                return jsonify({"detail": "Error during web scraping: Invalid JSON output."}), 500

            all_results = results.get('results', [])

            if not all_results:
                logging.warning("No results found from any source")
                return jsonify({"detail": "No results found"}), 404

            # Index all results into Elasticsearch
            es_client.index_documents(index_name="web_scraping", documents=all_results)

            best_result = max(all_results, key=lambda x: TextBlob(x['content']).sentiment.polarity)
            return jsonify({"best_result": best_result})
        except Exception as e:
            logging.error(f"Error during web scraping: {e}")
            return jsonify({"detail": f"Error during web scraping: {e}"}), 500
    except Exception as e:
        logging.error(f"Error generating search query: {e}")
        return jsonify({"detail": f"Error generating search query: {e}"}), 500

@app.route("/api/search", methods=["GET"])
def search_elasticsearch():
    query = request.args.get('query')
    if not query:
        return jsonify({"detail": "No query provided"}), 400

    try:
        results = es_client.search(index_name="web_scraping", query=query)
        return jsonify({"results": results})
    except Exception as e:
        logging.error(f"Error during search: {e}")
        return jsonify({"detail": f"Error during search: {e}"}), 500

@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.json
    if 'feedback' not in data:
        return jsonify({"detail": "No feedback provided"}), 400
    feedback_store["feedback"] = data['feedback']
    return jsonify({"message": "Feedback received"})

# RL loop
request_made = False

def rl_loop():
    epsilon = 1.0
    num_episodes = 1000
    for episode in range(num_episodes):
        state = env.reset()
        total_reward = 0
        while not env.episode_ended:
            action = select_action(state, epsilon, q_network)
            next_state, reward, done, _ = env.step(int(action), feedback_store)
            memory.append((state, action, reward, next_state, done))
            optimize_model(memory, q_network, optimizer)
            state = next_state
            total_reward += reward
            if done:
                logging.info(f"Episode {episode} finished with total reward: {total_reward}")
        epsilon = max(0.01, epsilon * 0.995)

# Start the server in a separate thread
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
