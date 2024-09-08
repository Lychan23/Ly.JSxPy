import os
import sys
import time
import random
import logging
import subprocess
import json
from flask import Flask, request, jsonify
from collections import deque
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from textblob import TextBlob
import spacy
import torch
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
nlp = spacy.load("en_core_web_md")

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

# Define the WebScrapingEnv class
class WebScrapingEnv:
    def __init__(self):
        self.search_query = ""
        self.headers_list = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3", 
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
            "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
        ]
        
        # Initialize DistilGPT-2 model and tokenizer
        self.tokenizer = GPT2Tokenizer.from_pretrained(
            os.path.join(script_dir, "models/distilgpt2"),
            legacy=False
        )
        self.model = GPT2LMHeadModel.from_pretrained(
            os.path.join(script_dir, "models/distilgpt2")
        )

    def generate_query(self, input_text):
        try:
            inputs = self.tokenizer.encode(input_text, return_tensors='pt')
            outputs = self.model.generate(inputs, max_length=50, num_beams=5, early_stopping=True)
            return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        except Exception as e:
            logging.error(f"Error generating query: {e}")
            return ""

# Initialize the environment and model
env = WebScrapingEnv()

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
        search_query = env.generate_query(query_text)
        
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

# Start the server
def run_server():
    app.run(host="0.0.0.0", port=8000)

if __name__ == "__main__":
    # Start the Flask server
    run_server()
