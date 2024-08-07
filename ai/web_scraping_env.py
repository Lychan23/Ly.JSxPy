# ai/web_scraping_env.py

import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import numpy as np
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification
import spacy
import random
import subprocess
import json
import logging

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
        
    def reset(self):
        self.state = 0
        self.episode_ended = False
        return np.array([self.state], dtype=np.float32)

    def step(self, action, tokenizer, model, feedback_store):
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

                if result.returncode != 0:
                    logging.error(f"Error during web scraping: {result.stderr}")
                    self.episode_ended = True
                    return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended, {}

                if result.stdout.strip() == "":
                    logging.error(f"No output from subprocess: {result.stderr}")
                    return np.array([self.state], dtype=np.float32), -1.0, True, {}

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
                logging.error(f"Error in step action 1: {e}")
                self.episode_ended = True
                return np.array([self.state], dtype=np.float32), -1.0, self.episode_ended, {}

        return np.array([self.state], dtype=np.float32), reward, self.episode_ended, {}
