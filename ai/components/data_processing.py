# File: data_processor.py

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import logging
from typing import List, Dict, Tuple
import ssl
import torch
from transformers import pipeline
import spacy
import numpy as np
from sentence_transformers import SentenceTransformer
import nltk
from nltk.tokenize import sent_tokenize
import re
from rich.console import Console
from rich.logging import RichHandler
from rich.progress import Progress
from rich.traceback import install as install_rich_traceback

# Download required NLTK data
nltk.download('punkt', quiet=True)

# Configure logging with Rich
install_rich_traceback(show_locals=True)
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("rich")

# Create Rich console
console = Console()

# SSL context setup
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

class DataProcessor:
    def __init__(self):
        logger.info("Initializing DataProcessor")
        self.device = 0 if torch.cuda.is_available() else -1
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=self.device)
        self.nlp = spacy.load("en_core_web_sm")
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunk_size = 1024
        self.max_summary_length = 150

    async def google_search(self, query: str, api_key: str, cx: str, num_results: int = 10) -> Dict:
        logger.info(f"Performing Google search for query: {query}")
        url = "https://www.googleapis.com/customsearch/v1"
        params = {'q': query, 'key': api_key, 'cx': cx, 'num': num_results}
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, params=params, ssl=ssl_context) as response:
                    response.raise_for_status()
                    return await response.json()
            except aiohttp.ClientError as e:
                logger.exception(f"Network error during Google Search API request: {str(e)}")
                return {}
            except Exception as e:
                logger.exception(f"Unexpected error during Google Search API request: {str(e)}")
                return {}

    def get_top_results(self, search_results: Dict) -> List[Dict]:
        logger.info("Getting top results from search results")
        if 'items' not in search_results:
            logger.warning("No items found in search results")
            return []
        return [{'title': item.get('title', ''), 'link': item.get('link', ''), 'snippet': item.get('snippet', '')} 
                for item in search_results.get('items', [])]

    async def scrape_website(self, url: str) -> Tuple[str, List[str]]:
        logger.info(f"Scraping website: {url}")
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, timeout=30, ssl=ssl_context) as response:
                    response.raise_for_status()
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
                        element.decompose()

                    main_content = soup.find('main') or soup.find('article') or soup.body
                    paragraphs = main_content.find_all('p') if main_content else []
                    text_content = ' '.join([p.get_text() for p in paragraphs]) if paragraphs else soup.get_text()
                    
                    clean_text = self.clean_text(text_content)
                    sentences = sent_tokenize(clean_text)
                    
                    return clean_text, sentences
            except aiohttp.ClientError as e:
                logger.exception(f"Network error while scraping {url}: {str(e)}")
                return "", []
            except Exception as e:
                logger.exception(f"Unexpected error while scraping {url}: {str(e)}")
                return "", []

    def clean_text(self, text: str) -> str:
        logger.info("Cleaning text")
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'http[s]?://\S+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        return text

    def chunk_text(self, sentences: List[str]) -> List[str]:
        logger.info("Chunking text")
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence.split())
            
            if current_length + sentence_length > self.chunk_size:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                current_chunk = [sentence]
                current_length = sentence_length
            else:
                current_chunk.append(sentence)
                current_length += sentence_length
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks

    def preprocess_chunks(self, chunks: List[str], min_chunk_length: int = 100, min_chunk_threshold: int = 10) -> List[str]:
        logger.info(f"Preprocessing {len(chunks)} chunks")
        processed_chunks = []
        current_chunk = ""
        
        for chunk in chunks:
            if len(chunk.split()) < min_chunk_threshold:
                logger.warning(f"Discarding short chunk: '{chunk}'")
                continue
            
            if len(current_chunk) + len(chunk) < min_chunk_length:
                current_chunk += " " + chunk
            else:
                if current_chunk:
                    processed_chunks.append(current_chunk.strip())
                current_chunk = chunk
        
        if current_chunk:
            processed_chunks.append(current_chunk.strip())
        
        logger.info(f"Preprocessed into {len(processed_chunks)} chunks")
        return processed_chunks

    async def summarize_chunks(self, chunks: List[str]) -> List[str]:
        logger.info("Preprocessing chunks for summarization")
        preprocessed_chunks = self.preprocess_chunks(chunks)
        logger.info(f"Summarizing {len(preprocessed_chunks)} preprocessed chunks")

        summaries = []
        
        for i, chunk in enumerate(preprocessed_chunks):
            if i % 5 == 0:
                logger.info(f"Summarizing chunk {i+1}/{len(preprocessed_chunks)}")
            
            # Check if the chunk is valid and has enough content
            if not chunk.strip():
                logger.warning(f"Skipping empty chunk at index {i}")
                continue

            if len(chunk.split()) < 50:  # If the chunk is too small, skip summarization
                summaries.append(chunk)
            else:
                try:
                    # Ensure that the chunk isn't too large for the summarizer
                    chunk_length = len(chunk.split())
                    if chunk_length > 512:  # Summarization models typically handle 512 tokens or fewer
                        logger.warning(f"Chunk {i} is too large with {chunk_length} tokens, truncating.")
                        chunk = " ".join(chunk.split()[:512])  # Truncate the chunk if too large

                    # Call the summarizer
                    summary_result = self.summarizer(chunk, 
                                                    max_length=self.max_summary_length,
                                                    min_length=30,
                                                    do_sample=False)

                    # Ensure we got a valid response
                    if isinstance(summary_result, list) and summary_result:
                        summary = summary_result[0].get('summary_text', '')
                        summaries.append(summary if summary else chunk[:self.max_summary_length])
                    else:
                        logger.warning(f"Empty or invalid summarization result for chunk {i}")
                        summaries.append(chunk[:self.max_summary_length])

                except Exception as e:
                    logger.exception(f"Error summarizing chunk {i}: {str(e)}")
                    summaries.append(chunk[:self.max_summary_length])

        logger.info(f"Summarization complete. Generated {len(summaries)} summaries.")
        return summaries

    def compute_embeddings(self, texts: List[str]) -> np.ndarray:
        logger.info("Computing embeddings")
        return self.sentence_model.encode(texts)

    def rank_chunks(self, query: str, chunks: List[str]) -> List[Tuple[str, float]]:
        logger.info("Ranking chunks")
        if not chunks:
            logger.warning("No chunks to rank")
            return []
        
        query_embedding = self.sentence_model.encode([query])[0]
        chunk_embeddings = self.sentence_model.encode(chunks)
        
        similarities = np.dot(chunk_embeddings, query_embedding)
        
        ranked_chunks = [(chunk, score) for chunk, score in zip(chunks, similarities)]
        ranked_chunks.sort(key=lambda x: x[1], reverse=True)
        
        return ranked_chunks

    async def process_result(self, result: Dict, query: str) -> Tuple[str, List[str], str]:
        logger.info(f"Processing result: {result.get('link', '')}")
        try:
            raw_text, sentences = await self.scrape_website(result.get('link', ''))
            if not sentences:
                logger.warning(f"No sentences extracted from {result.get('link', '')}")
                return "", [], result.get('link', '')

            chunks = self.chunk_text(sentences)
            
            if not chunks:
                logger.warning(f"No valid chunks created from {result.get('link', '')}")
                return raw_text, [], result.get('link', '')
            
            summarized_chunks = await self.summarize_chunks(chunks)
            ranked_chunks = self.rank_chunks(query, summarized_chunks)

            # Make sure we do not index out of bounds
            top_chunks = [chunk for chunk, score in ranked_chunks[:min(len(ranked_chunks), 3)]]

            return raw_text, top_chunks, result.get('link', '')
        except Exception as e:
            logger.exception(f"Error processing result {result.get('link', '')}: {e}")
            return "", [], result.get('link', '')

async def fetch_and_process_results(query: str, api_key: str, cx: str) -> Tuple[str, str, List[str]]:
    logger.info(f"Fetching and processing results for query: {query}")
    processor = DataProcessor()
    
    search_results = await processor.google_search(query, api_key, cx)
    top_results = processor.get_top_results(search_results)
    
    tasks = [processor.process_result(result, query) for result in top_results]
    results = await asyncio.gather(*tasks)
    
    raw_texts = [raw for raw, _, _ in results if raw]
    processed_chunks = [chunk for _, chunks, _ in results for chunk in chunks if chunks]
    sources = [url for _, _, url in results if url]
    
    combined_raw_text = " ".join(raw_texts)
    
    if not processed_chunks:
        logger.warning("No processed chunks available for final ranking")
        return combined_raw_text, "", sources
    
    final_ranked_chunks = processor.rank_chunks(query, processed_chunks)
    top_final_chunks = [chunk for chunk, _ in final_ranked_chunks[:min(len(final_ranked_chunks), 5)]]
    
    processed_context = " ".join(top_final_chunks)
    
    logger.info("Processing complete")
    logger.info(f"Raw text length: {len(combined_raw_text)} characters")
    logger.info(f"Processed context length: {len(processed_context)} characters")
    logger.info(f"Number of sources: {len(sources)}")
    
    return combined_raw_text, processed_context, sources
