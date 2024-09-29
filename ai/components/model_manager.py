import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForQuestionAnswering, AutoModelForCausalLM, pipeline, AutoModelForSequenceClassification
import os
import logging
from sentence_transformers import SentenceTransformer
from rich.traceback import install as install_rich_traceback
from rich.logging import RichHandler
from rich.console import Console

install_rich_traceback(show_locals=True)
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("rich")

console = Console()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

global_models = {}

class ModelManager:
    @staticmethod
    async def get_model(model_name: str, mode: str = "power"):
        if mode not in ["power", "performance"]:
            raise ValueError("Mode must be either 'power' or 'performance'")

        if model_name not in global_models:
            if model_name == "flan-t5":
                model_size = "large" if mode == "power" else "small"
                global_models[model_name] = {
                    "model": AutoModelForSeq2SeqLM.from_pretrained(f"google/flan-t5-{model_size}").to(device),
                    "tokenizer": AutoTokenizer.from_pretrained(f"google/flan-t5-{model_size}")
                }
            elif model_name == "roberta-qa":
                model_name = "deepset/roberta-base-squad2" if mode == "power" else "distilroberta-base"
                global_models[model_name] = {
                    "model": AutoModelForQuestionAnswering.from_pretrained(model_name).to(device),
                    "tokenizer": AutoTokenizer.from_pretrained(model_name)
                }
            elif model_name == "sentence-transformer":
                model_name = 'paraphrase-mpnet-base-v2' if mode == "power" else 'paraphrase-MiniLM-L6-v2'
                global_models[model_name] = SentenceTransformer(model_name).to(device)
            elif model_name == "bart-cnn":
                model_name = "facebook/bart-large-cnn" if mode == "power" else "facebook/bart-base"
                global_models[model_name] = {
                    "model": AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device),
                    "tokenizer": AutoTokenizer.from_pretrained(model_name)
                }
            elif model_name == "bart-summarization":
                model_name = "facebook/bart-large-xsum" if mode == "power" else "facebook/bart-base-xsum"
                global_models[model_name] = {
                    "model": AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device),
                    "tokenizer": AutoTokenizer.from_pretrained(model_name)
                }
            elif model_name == "sentiment-analysis":
                model_name = "facebook/bart-large-mnli" if mode == "power" else "distilbert-base-uncased-finetuned-sst-2-english"
                global_models[model_name] = pipeline("sentiment-analysis", model=model_name, device=0 if torch.cuda.is_available() else -1)
            elif model_name == "follow-up-questions":
                model_name = "bigscience/bloom-560m" if mode == "power" else "bigscience/bloom-350m"
                global_models[model_name] = {
                    "model": AutoModelForCausalLM.from_pretrained(model_name).to(device),
                    "tokenizer": AutoTokenizer.from_pretrained(model_name)
                }
            elif model_name == "prompt-guard": 
                model_name = "meta-llama/Prompt-Guard-86M" if mode == "power" else "meta-llama/Prompt-Guard-86M" # Update with the correct model name
                global_models[model_name] = {
                    "model": AutoModelForSequenceClassification.from_pretrained(model_name).to(device),
                    "tokenizer": AutoTokenizer.from_pretrained(model_name)
                }
            
        return global_models[model_name]
    
    @staticmethod
    async def check_model_downloaded(model_name: str, mode: str):
        """Checks if the model and tokenizer are downloaded and cached locally. Downloads if not."""
        model_cache_dir = os.path.expanduser("~/.cache/huggingface/hub")

        # Set model paths based on model name and mode
        if model_name == "flan-t5":
            model_size = "large" if mode == "power" else "small"
            model_path = f"google/flan-t5-{model_size}"
        elif model_name == "roberta-qa":
            model_path = "deepset/roberta-base-squad2" if mode == "power" else "distilroberta-base"
        elif model_name == "sentence-transformer":
            model_path = 'paraphrase-mpnet-base-v2' if mode == "power" else 'paraphrase-MiniLM-L6-v2'
        elif model_name == "bart-cnn":
            model_path = "facebook/bart-large-cnn" if mode == "power" else "facebook/bart-base"
        elif model_name == "bart-summarization":
            model_path = "facebook/bart-large-xsum" if mode == "power" else "facebook/bart-base-xsum"
        elif model_name == "sentiment-analysis":
            model_path = "facebook/bart-large-mnli" if mode == "power" else "distilbert-base-uncased-finetuned-sst-2-english"
        elif model_name == "follow-up-questions":
            model_path = "bigscience/bloom-560m" if mode == "power" else "bigscience/bloom-350m"
        elif model_name == "prompt-guard":
            model_path = "meta-llama/Prompt-Guard-86M" if mode == "power" else "meta-llama/Prompt-Guard-86M"
        else:
            raise ValueError(f"Unsupported model name: {model_name}")

        # Check if the model exists in the cache directory
        model_cached = os.path.exists(os.path.join(model_cache_dir, model_path))
        
        if not model_cached:
            logger.info(f"Model {model_path} not found locally. Downloading...")
            
            # Trigger the download by calling from_pretrained
            AutoTokenizer.from_pretrained(model_path)
            AutoModelForSeq2SeqLM.from_pretrained(model_path)

        logger.info(f"Model {model_path} is ready for use.")