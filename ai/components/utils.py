import asyncio
import aiohttp
import socket
import json
import aiofiles
import ssl
from typing import Dict, Optional, List
import time
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress
from rich.prompt import Prompt
from rich.theme import Theme
from functools import lru_cache
import psutil
import hashlib
import logging  # Add this import for logging
import traceback  # Add this import for handling stack traces
from rich.logging import RichHandler
from rich.traceback import install as install_rich_traceback

install_rich_traceback(show_locals=True)

# Set up logging with rich integration
logging.basicConfig(
    level=logging.INFO,  # Set the logging level
    format="%(message)s",  # Format the logging output
    datefmt="[%X]",  # Format time display in logs
    handlers=[RichHandler(rich_tracebacks=True)]  # Use RichHandler for rich-formatted logs
)

# Create a logger instance
logger = logging.getLogger("rich")

# Rich console
console = Console()

# SSL context setup
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

async def check_internet_connection(host="8.8.8.8", port=53, timeout=3) -> bool:
    """
    Check if the machine has internet access by trying to connect to a DNS server.
    """
    try:
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True
    except OSError:
        return False

async def cache_result(query: str, result: Dict):
    """Cache the result for a given query."""
    cache_file = "query_cache.json"
    try:
        async with aiofiles.open(cache_file, mode='r') as f:
            contents = await f.read()
            cache = json.loads(contents) if contents else {}
    except FileNotFoundError:
        cache = {}

    # Convert the result dict to a JSON string
    result_str = json.dumps(result, sort_keys=True)
    
    # Create a hash of the result string
    result_hash = hashlib.md5(result_str.encode()).hexdigest()

    # Store the hash and the result separately
    cache[query] = {
        'hash': result_hash,
        'result': result
    }

    async with aiofiles.open(cache_file, mode='w') as f:
        await f.write(json.dumps(cache, indent=2))

async def get_cached_result(query: str) -> Optional[Dict]:
    """Retrieve a cached result for a given query."""
    cache_file = "query_cache.json"
    try:
        async with aiofiles.open(cache_file, mode='r') as f:
            cache = json.loads(await f.read())
            if query in cache:
                return cache[query]['result']
    except FileNotFoundError:
        return None
    return None

async def log_user_feedback(query: str, feedback: str):
    """Log user feedback for a given query."""
    feedback_file = "user_feedback.json"
    try:
        async with aiofiles.open(feedback_file, mode='r+') as f:
            contents = await f.read()
            feedback_log = json.loads(contents) if contents else {}
    except FileNotFoundError:
        feedback_log = {}

    feedback_log[query] = feedback

    async with aiofiles.open(feedback_file, mode='w') as f:
        await f.write(json.dumps(feedback_log, indent=2))

def format_processing_time(seconds: float) -> str:
    """Format processing time in a human-readable format."""
    if seconds < 1:
        return f"{seconds*1000:.0f} milliseconds"
    elif seconds < 60:
        return f"{seconds:.2f} seconds"
    else:
        minutes, seconds = divmod(seconds, 60)
        return f"{int(minutes)} minutes and {seconds:.2f} seconds"

async def get_query_history() -> List[str]:
    """Retrieve the query history from a file."""
    history_file = "query_history.json"
    try:
        async with aiofiles.open(history_file, mode='r') as f:
            history = json.loads(await f.read())
            return history
    except FileNotFoundError:
        return []

def print_result(result: Dict, query: str, console: Console):
    console.print("\n")  # Add some spacing before the output
    
    console.print(Panel(f"[bold cyan]Query:[/bold cyan] {query}", expand=False))
    
    console.print(Panel(f"[bold green]Context Summary:[/bold green]\n{result.get('context_summary', 'N/A')}", expand=False))
    
    console.print(Panel(f"[bold green]Extractive Answer:[/bold green]\n{result.get('extractive_answer', 'N/A')}", expand=False))
    
    console.print(Panel(f"[bold green]Abstractive Answer:[/bold green]\n{result.get('abstractive_answer', 'N/A')}", expand=False))
    
    console.print(Panel(f"[bold green]Summary:[/bold green]\n{result.get('summary', 'N/A')}", expand=False))
    
    scores_table = Table(title="Scores", show_header=True, header_style="bold magenta")
    scores_table.add_column("Metric", style="cyan")
    scores_table.add_column("Score", style="green")
    scores_table.add_row("Sentiment Score", f"{result.get('sentiment_score', 'N/A'):.2f}")
    scores_table.add_row("Confidence Score", f"{result.get('confidence_score', 'N/A'):.2f}%")
    console.print(scores_table)
    
    if result.get('follow_up_questions'):
        follow_up_table = Table(title="Follow-up Questions", show_header=True, header_style="bold magenta")
        follow_up_table.add_column("No.", style="cyan", justify="right")
        follow_up_table.add_column("Question", style="green")
        for i, question in enumerate(result['follow_up_questions'], 1):
            follow_up_table.add_row(str(i), question)
        console.print(follow_up_table)
    
    if result.get('sources'):
        sources_table = Table(title="Sources", show_header=True, header_style="bold magenta")
        sources_table.add_column("Source", style="cyan")
        for source in set(result['sources']):  # Use set to remove duplicates
            sources_table.add_row(source)
        console.print(sources_table)
    
    if 'processing_time' in result:
        console.print(f"[bold blue]Processing Time:[/bold blue] {format_processing_time(result['processing_time'])}")
    
    console.print("\n")  # Add some spacing after the output

async def add_to_query_history(query: str):
    """Add a query to the query history file."""
    history_file = "query_history.json"
    history = await get_query_history()
    history.append(query)
    async with aiofiles.open(history_file, mode='w') as f:
        await f.write(json.dumps(history))

def get_user_preferences():
    """Get user preferences for CLI customization."""
    console = Console()
    console.print("Let's customize your CLI experience!")
    
    theme = Prompt.ask("Choose a theme", choices=["light", "dark"], default="dark")
    font_size = Prompt.ask("Choose a font size", choices=["small", "medium", "large"], default="medium")
    language = Prompt.ask("Choose a language", choices=["English", "Spanish", "French"], default="English")
    
    return {"theme": theme, "font_size": font_size, "language": language}

def apply_user_preferences(preferences: Dict):
    """Apply user preferences to the CLI."""
    # Define the themes
    light_theme = Theme({
        "primary": "black",
        "accent": "white",
    })
    
    dark_theme = Theme({
        "primary": "white",
        "accent": "black",
    })

    # Select the theme based on user preferences
    selected_theme = dark_theme if preferences['theme'] == "dark" else light_theme
    
    # Initialize the console with the selected theme
    console = Console(theme=selected_theme)

    font_sizes = {
        "small": "dim",
        "medium": "normal",
        "large": "bold"
    }

    console.print(f"[{font_sizes[preferences['font_size']]}]Applied theme: {preferences['theme']}")
    console.print(f"[{font_sizes[preferences['font_size']]}]Applied font size: {preferences['font_size']}")
    console.print(f"[{font_sizes[preferences['font_size']]}]Applied language: {preferences['language']}")


async def performance_monitor():
    """Monitor system performance and provide real-time updates."""
    console = Console()
    
    while True:
        # Get CPU usage as a percentage
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Get memory usage
        memory = psutil.virtual_memory()
        memory_usage = memory.used / (1024 * 1024)  # Convert to MB
        
        # Get disk usage
        disk = psutil.disk_usage('/')
        disk_usage = disk.percent
        
        # Print the metrics
        console.print(f"CPU Usage: {cpu_usage:.1f}%")
        console.print(f"Memory Usage: {memory_usage:.0f} MB / {memory.total / (1024 * 1024):.0f} MB ({memory.percent:.1f}%)")
        console.print(f"Disk Usage: {disk_usage:.1f}%")
        console.print("---")
        
        await asyncio.sleep(5)  # Update every 5 seconds

# Error handling decorator
def handle_errors(func):
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {str(e)}")
            console.print("Please try again or contact support if the issue persists.")
            log_error("An error occurred", e)  # Log the error
    return wrapper

def log_error(message: str, error: Exception):
    """
    Log an error message along with the full stack trace.
    
    :param message: A descriptive error message
    :param error: The exception object
    """
    logger.error(f"{message}: {str(error)}")
    logger.error("Full traceback:")
    logger.error(traceback.format_exc())  # Log the full stack trace