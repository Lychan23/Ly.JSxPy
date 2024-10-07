import asyncio
import gc
import aiohttp
import time
import os
from dotenv import load_dotenv
import logging
from typing import List, Dict, Tuple, Optional, Any
from collections import Counter
import ssl
import torch
from transformers import pipeline
from crawl4ai import AsyncWebCrawler
from spacy.lang.en.stop_words import STOP_WORDS
import spacy
from sentence_transformers import SentenceTransformer
from nltk.tokenize import sent_tokenize
import re
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from rich.traceback import install as install_rich_traceback
from rich.logging import RichHandler
from rich.console import Console
from cachetools import TTLCache, LRUCache
from aiolimiter import AsyncLimiter
from .data_utility import Config

load_dotenv()

install_rich_traceback(show_locals=True)
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("rich")
console = Console()

class DataProcessor:
    def __init__(self) -> None:
        logger.info("Initializing DataProcessor")
        
        # Load configuration
        self.config = Config()  # Create an instance of the Config class
        self.device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.summarizer: Any = pipeline("summarization", model="google/flan-t5-large", device=self.device)
        self.nlp: spacy.language.Language = spacy.load("en_core_web_md")
        self.nlp.add_pipe("sentencizer")
        self.sentence_model: SentenceTransformer = SentenceTransformer('all-MiniLM-L6-v2')
        self.sentence_model.to(self.device)

        # Use default parameters from the config
        self.chunk_size: int = self.config.default_chunk_size
        self.max_summary_tokens: int = self.config.default_max_summary_tokens
        self.num_results: int = self.config.default_num_results
        
        self.ssl_context: ssl.SSLContext = self._create_ssl_context()
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache: TTLCache = TTLCache(maxsize=1000, ttl=3600)  # Increased cache size
        self.rate_limiter: AsyncLimiter = AsyncLimiter(10, 1)
        self.local_cache: LRUCache = LRUCache(maxsize=100)  # New local cache

        # Use the cleaned text pattern from data_utility.py
        self.clean_text_pattern: re.Pattern = re.compile(r'http[s]?://\S+|\S+@\S+|[^\w\s.,!?-]|\s+')

    def _create_ssl_context(self) -> ssl.SSLContext:
        logger.debug("Creating SSL context")
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        return ssl_context

    async def initialize_session(self) -> None:
        logger.debug("Initializing aiohttp session")
        if self.session is None:
            self.session = aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=self.ssl_context))

    async def close_session(self) -> None:
        logger.debug("Closing aiohttp session")
        if self.session:
            await self.session.close()
            self.session = None

    @staticmethod
    def _get_cache_key(func_name: str, *args: Any, **kwargs: Any) -> str:
        return f"{func_name}:{hash(str(args) + str(kwargs))}"

    async def google_search(self, query: str, api_key: str, cx: str, num_results: int = 5) -> Dict[str, Any]:
        cache_key = self._get_cache_key("google_search", query, num_results)
        if cache_key in self.cache:
            logger.info(f"Cache hit for Google search query: {query}")
            return self.cache[cache_key]

        logger.info(f"Performing Google search for query: {query}")
        url = "https://www.googleapis.com/customsearch/v1"
        params = {'q': query, 'key': api_key, 'cx': cx, 'num': num_results}
        
        await self.initialize_session()
        try:
            async with self.rate_limiter:
                async with self.session.get(url, params=params, raise_for_status=True) as response:
                    result = await response.json()
                    self.cache[cache_key] = result
                    return result
        except aiohttp.ClientError as e:
            logger.exception(f"Network error during Google Search API request: {str(e)}")
            raise
        except Exception as e:
            logger.exception(f"Unexpected error during Google Search API request: {str(e)}")
            raise

    def get_top_results(self, search_results: Dict[str, Any]) -> List[Dict[str, str]]:
        logger.info("Getting top results from search results")
        if 'items' not in search_results:
            logger.warning("No items found in search results")
            return []
        return [{'title': item.get('title', ''), 'link': item.get('link', ''), 'snippet': item.get('snippet', '')} 
                for item in search_results.get('items', [])]

    async def scrape_website(self, url: str) -> Tuple[str, List[str]]:
        logger.info(f"Scraping website: {url}")
        cache_key = self._get_cache_key("scrape_website", url)
        if cache_key in self.local_cache:
            logger.info(f"Cache hit for scraping website: {url}")
            return self.local_cache[cache_key]

        try:
            async with AsyncWebCrawler(verbose=True) as crawler:
                result = await crawler.arun(url=url)
                text_content = result.markdown
                
                clean_text = await self.clean_text(text_content)
                sentences = sent_tokenize(clean_text)
                
                self.local_cache[cache_key] = (clean_text, sentences)
                return clean_text, sentences
        except Exception as e:
            logger.exception(f"Unexpected error while scraping {url}: {str(e)}")
            raise

    async def clean_text(self, text: str) -> str:
        logger.debug("Cleaning text asynchronously")
        clean_text = await asyncio.to_thread(self.clean_text_pattern.sub, ' ', text)
        return clean_text.strip()

    async def chunk_text(self, sentences: List[str]) -> List[str]:
        logger.debug(f"Chunking {len(sentences)} sentences")
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
        
        logger.debug(f"Created {len(chunks)} chunks")
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

        loop = asyncio.get_running_loop()
        with ThreadPoolExecutor() as pool:
            summarize_func = partial(self._summarize_chunk)
            summaries = await asyncio.gather(*[loop.run_in_executor(pool, summarize_func, chunk) for chunk in preprocessed_chunks])

        logger.info(f"Summarization complete. Generated {len(summaries)} summaries.")
        return summaries

    def _summarize_chunk(self, chunk: str) -> str:
        if not chunk.strip():
            logger.warning("Skipping empty chunk")
            return ""

        if len(chunk.split()) < 50:
            return chunk

        try:
            doc = self.nlp(chunk)
            word_frequencies = Counter(token.text.lower() for token in doc if token.is_alpha and token.text.lower() not in STOP_WORDS)
            max_frequency = max(word_frequencies.values())
            word_frequencies = {word: freq / max_frequency for word, freq in word_frequencies.items()}

            sentence_scores = {}
            for sent in doc.sents:
                for word in sent:
                    if word.text.lower() in word_frequencies:
                        if sent not in sentence_scores:
                            sentence_scores[sent] = word_frequencies[word.text.lower()]
                        else:
                            sentence_scores[sent] += word_frequencies[word.text.lower()]

            num_sentences = 3
            summarized_sentences = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]
            summary = ' '.join([sent.text for sent in summarized_sentences])
            return summary if summary else chunk[:self.max_summary_tokens]

        except Exception as e:
            logger.exception(f"Error summarizing chunk: {str(e)}")
            return chunk[:self.max_summary_tokens]

    async def final_summarize(self, text: str, max_new_tokens: int = 50) -> str:
        logger.info("Performing final summarization with T5")
        try:
            max_input_length = 512
            chunks = [text[i:i + max_input_length] for i in range(0, len(text), max_input_length)]
            
            summaries = []
            for chunk in chunks:
                summary = self.summarizer(
                    chunk, 
                    max_new_tokens=max_new_tokens,
                    do_sample=False
                )[0]['summary_text']
                summaries.append(summary)

                gc.collect()

            final_summary = ' '.join(summaries)
            gc.collect()

            return final_summary

        except Exception as e:
            logger.exception(f"Error in final summarization: {str(e)}")
            return text[:max_new_tokens]

    @torch.no_grad()
    def compute_embeddings(self, texts: List[str]) -> torch.Tensor:
        logger.debug(f"Computing embeddings for {len(texts)} texts")
        return self.sentence_model.encode(texts, convert_to_tensor=True, show_progress_bar=False)

    def rank_chunks(self, query: str, chunks: List[str]) -> List[Tuple[str, float]]:
        logger.info("Ranking chunks")
        if not chunks:
            logger.warning("No chunks to rank")
            return []
        
        query_embedding = self.compute_embeddings([query])[0]
        chunk_embeddings = self.compute_embeddings(chunks)
        
        similarities = torch.matmul(chunk_embeddings, query_embedding)
        
        ranked_chunks = list(zip(chunks, similarities.cpu().numpy()))
        ranked_chunks.sort(key=lambda x: x[1], reverse=True)
        
        return ranked_chunks

    async def process_result(self, result: Dict[str, str], query: str) -> Tuple[Optional[str], List[str], str]:
        logger.info(f"Processing result: {result.get('link', '')}")
        try:
            raw_text, sentences = await self.scrape_website(result.get('link', ''))
            if not sentences:
                logger.warning(f"No sentences extracted from {result.get('link', '')}")
                return None, [], result.get('link', '')

            chunks = await self.chunk_text(sentences)
            
            if not chunks:
                logger.warning(f"No valid chunks created from {result.get('link', '')}")
                return raw_text, [], result.get('link', '')
            
            summarized_chunks = await self.summarize_chunks(chunks)
            ranked_chunks = self.rank_chunks(query, summarized_chunks)

            top_chunks = [chunk for chunk, score in ranked_chunks[:min(len(ranked_chunks), 3)]]

            return raw_text, top_chunks, result.get('link', '')
        except Exception as e:
            logger.exception(f"Error processing result {result.get('link', '')}: {e}")
            return None, [], result.get('link', '')

    async def fetch_and_process_results(self, processed_query: str, api_key: str, cx: str) -> Tuple[str, str, List[str]]:
        logger.info(f"Fetching and processing results for query: {processed_query}")
        
        try:
            search_results = await self.google_search(processed_query, api_key, cx)
            top_results = self.get_top_results(search_results)
            
            tasks = [self.process_result(result, processed_query) for result in top_results]
            results = await asyncio.gather(*tasks)
            
            raw_texts = [raw for raw, _, _ in results if raw]
            processed_chunks = [chunk for _, chunks, _ in results for chunk in chunks if chunks]
            sources = [url for _, _, url in results if url]
            
            combined_raw_text = " ".join(raw_texts)
            
            if not processed_chunks:
                logger.warning("No processed chunks available for final ranking")
                return combined_raw_text, "", sources
            
            final_ranked_chunks = self.rank_chunks(processed_query, processed_chunks)
            top_final_chunks = [chunk for chunk, _ in final_ranked_chunks[:min(len(final_ranked_chunks), 5)]]
            
            processed_context1 = " ".join(top_final_chunks)
            
            processed_context = await self.final_summarize(processed_context1, max_new_tokens=self.max_summary_tokens)
            
            logger.info("Processing complete")
            logger.info(f"Raw text length: {len(combined_raw_text)} characters")
            logger.info(f"Processed context length: {len(processed_context1)} characters")
            logger.info(f"Final summary length: {len(processed_context)} characters")
            logger.info(f"Number of sources: {len(sources)}")
            
            gc.collect()
            
            return combined_raw_text, processed_context, sources
        except Exception as e:
            logger.exception(f"Error in fetch_and_process_results: {e}")
            raise

    async def __aenter__(self):
        await self.initialize_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close_session()

class BenchmarkProcessor(DataProcessor):
    def __init__(self, chunk_size: int = 1024, max_summary_tokens: int = 50, num_results: int = 5) -> None:
        super().__init__()
        self.chunk_size = chunk_size
        self.max_summary_tokens = max_summary_tokens
        self.num_results = num_results

    async def run_benchmark(self, query: str) -> Tuple[float, int, int, List[str]]:
        start_time = time.time()
        api_key = os.getenv("GOOGLE_API_KEY")
        cx = os.getenv("GOOGLE_CX")
        
        if not api_key or not cx:
            logger.error("Missing GOOGLE_API_KEY or GOOGLE_CX in the .env file.")
            return 0.0, 0, 0, []

        async with self as processor:
            raw_text, processed_context, sources = await processor.fetch_and_process_results(query, api_key, cx)

        end_time = time.time()
        processing_time = end_time - start_time

        logger.info(f"\nBenchmark Results:")
        logger.info(f"Query: {query}")
        logger.info(f"Processing Time: {processing_time:.2f} seconds")
        logger.info(f"Raw Text Length: {len(raw_text)} characters")
        logger.info(f"Processed Summary Length: {len(processed_context)} characters")
        logger.info(f"Sources: {sources}")

        return processing_time, len(raw_text), len(processed_context), sources

async def main_benchmark() -> None:
    query = "what is machine learning"

    # Set parameters for fine-tuning
    chunk_sizes = [512, 768, 1024]  # Different chunk sizes to test
    max_summary_tokens = [30, 50, 70]  # Different summarization lengths
    num_results = [3, 5, 7]  # Google search results to process

    # Run benchmark for each combination of hyperparameters
    results = []
    for chunk_size in chunk_sizes:
        for max_tokens in max_summary_tokens:
            for num_result in num_results:
                processor = BenchmarkProcessor(chunk_size=chunk_size, max_summary_tokens=max_tokens, num_results=num_result)
                processing_time, raw_len, summary_len, sources = await processor.run_benchmark(query)

                results.append({
                    "chunk_size": chunk_size,
                    "max_summary_tokens": max_tokens,
                    "num_results": num_result,
                    "processing_time": processing_time,
                    "raw_text_length": raw_len,
                    "summary_length": summary_len,
                    "sources": sources
                })

    # Print out results for fine-tuning analysis
    for result in results:
        logger.info(f"\nChunk Size: {result['chunk_size']}, Max Tokens: {result['max_summary_tokens']}, Num Results: {result['num_results']}")
        logger.info(f"Processing Time: {result['processing_time']:.2f}s, Raw Text Length: {result['raw_text_length']}, Summary Length: {result['summary_length']}")
        logger.info(f"Sources: {result['sources']}")

if __name__ == "__main__":
    asyncio.run(main_benchmark())