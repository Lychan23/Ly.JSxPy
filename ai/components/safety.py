import torch
from torch.nn.functional import softmax
import logging
from .model_manager import ModelManager
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

class SafetyChecker:
    def __init__(self, mode="power", temperature=1.0):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.mode = mode
        self.temperature = temperature
        self.model = None
        self.tokenizer = None

    async def initialize(self):
        logger.info(f"Initializing Prompt-Guard model using ModelManager")
        try:
            model_data = await ModelManager.get_model("prompt-guard", self.mode)
            self.model = model_data["model"]
            self.tokenizer = model_data["tokenizer"]
            logger.info("Prompt-Guard model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Prompt-Guard model: {str(e)}")
            raise

    def get_class_probabilities(self, text):
        inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        logits = outputs.logits
        scaled_logits = logits / self.temperature
        probabilities = softmax(scaled_logits, dim=-1)
        return probabilities

    def get_safety_scores(self, text):
        probabilities = self.get_class_probabilities(text)
        # Assuming the model outputs probabilities for [entailment, neutral, contradiction]
        # We'll use the contradiction probability as the jailbreak score
        # and the entailment probability as the indirect injection score
        jailbreak_score = probabilities[0, 2].item()
        indirect_score = probabilities[0, 0].item()
        return jailbreak_score, indirect_score

    async def check_safety(self, prompt, jailbreak_threshold=0.5, indirect_threshold=0.5):
        if not self.model or not self.tokenizer:
            await self.initialize()

        logger.info(f"Checking safety for prompt: {prompt}")
        try:
            jailbreak_score, indirect_score = self.get_safety_scores(prompt)
            
            is_safe = (jailbreak_score < jailbreak_threshold) and (indirect_score < indirect_threshold)
            
            logger.info(f"Safety check result: {'Safe' if is_safe else 'Unsafe'}")
            logger.info(f"Jailbreak score: {jailbreak_score:.4f}")
            logger.info(f"Indirect injection score: {indirect_score:.4f}")
            
            return is_safe, jailbreak_score, indirect_score
        except Exception as e:
            logger.error(f"Error during safety check: {str(e)}")
            return False, 1.0, 1.0

    async def process_prompt(self, prompt, jailbreak_threshold=0.5, indirect_threshold=0.5):
        is_safe, jailbreak_score, indirect_score = await self.check_safety(prompt, jailbreak_threshold, indirect_threshold)
        if is_safe:
            return prompt, True, jailbreak_score, indirect_score
        else:
            return "I'm sorry, but I can't process that request as it may be unsafe.", False, jailbreak_score, indirect_score