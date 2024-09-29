import asyncio
import logging
import os
import time
import traceback
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.traceback import install as install_rich_traceback
from rich.progress import Progress
from rich.logging import RichHandler
from components.model_manager import ModelManager
from components.data_processing import fetch_and_process_results
from components.enhanced_answer import enhanced_answer_generation
from components.fallback_answer import fallback_pipeline
from components.combined_answer import combined_answer_generation
from components.offline_answer import offline_mode
from components.utils import (
    print_result, cache_result, get_cached_result, check_internet_connection,
    format_processing_time, get_user_preferences, apply_user_preferences,
    performance_monitor, handle_errors, log_error
)
from components.safety import SafetyChecker  # Import the SafetyChecker

# Load environment variables
load_dotenv()

# Configure logging
install_rich_traceback(show_locals=True)
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("rich")

# Initialize Rich console
console = Console()

@handle_errors
async def main():
    api_key = os.getenv('GOOGLE_API_KEY')
    cx = os.getenv('GOOGLE_CX')
    
    if not api_key or not cx:
        console.print("[bold red]Error:[/bold red] Google API key or Custom Search Engine ID not found in environment variables.")
        return
    
    console.print(Panel.fit("Welcome to the Enhanced ML Answering System!", style="bold green"))
    
    # Get user preferences
    preferences = get_user_preferences()
    apply_user_preferences(preferences)
    
    with console.status("[bold blue]Checking internet connection...[/bold blue]"):
        internet_connected = await check_internet_connection()
    
    if not internet_connected:
        console.print("[bold yellow]No internet connection detected. Switching to offline mode.[/bold yellow]")
        choice = "4"
        mode = "power"
    else:
        table = Table(title="Options")
        table.add_column("Choice", style="cyan", no_wrap=True)
        table.add_column("Description", style="magenta")
        table.add_row("1", "Use combined pipeline (default)")
        table.add_row("2", "Use main pipeline only")
        table.add_row("3", "Use fallback pipeline only")
        table.add_row("4", "Use offline mode")
        console.print(table)
        
        choice = Prompt.ask("Enter your choice", choices=["1", "2", "3", "4"], default="1")
        mode = Prompt.ask("Enter mode", choices=["power", "performance"], default="power")
    
    logger.info(f"Starting Enhanced ML Answering System with choice: {choice} and mode: {mode}")
    
    # Initialize SafetyChecker
    safety_checker = SafetyChecker(mode=mode)
    await safety_checker.initialize()
    
    history = []
    
    # Start performance monitoring in the background
    monitor_task = asyncio.create_task(performance_monitor())
    
    try:
        while True:
            user_query = Prompt.ask("\nEnter your question (type 'quit' to exit, 'history' to view past queries)", default="quit")
            
            if user_query.lower() == 'quit':
                console.print("[bold green]Thank you for using the Enhanced ML Answering System![/bold green]")
                break
            elif user_query.lower() == 'history':
                if history:
                    history_table = Table(title="Query History")
                    history_table.add_column("No.", style="cyan", no_wrap=True)
                    history_table.add_column("Query", style="magenta")
                    for i, query in enumerate(history, 1):
                        history_table.add_row(str(i), query)
                    console.print(history_table)
                else:
                    console.print("[italic]No queries in history yet.[/italic]")
                continue
            
            start_time = time.time()
            
            try:
                logger.info(f"Processing query: {user_query}")
                
                # Check safety of the query
                processed_query, is_safe, jailbreak_score, indirect_score = await safety_checker.process_prompt(user_query)
                
                if not is_safe:
                    console.print("[bold red]Warning:[/bold red] The query was flagged as potentially unsafe.")
                    console.print(f"Jailbreak score: {jailbreak_score:.4f}")
                    console.print(f"Indirect score: {indirect_score:.4f}")
                    console.print("Please rephrase your query and try again.")
                    continue
                
                # Check cache first
                cached_result = await get_cached_result(processed_query)
                if cached_result:
                    use_cache = Prompt.ask("Cached result found. Do you want to use it?", choices=["y", "n"], default="y")
                    if use_cache == 'y':
                        print_result(cached_result, processed_query, console)
                        continue
                
                with Progress() as progress:
                    task = progress.add_task("[cyan]Processing query...", total=100)
                    
                    if choice in ["1", "2"] and internet_connected:
                        try:
                            progress.update(task, advance=30, description="[cyan]Fetching results...")
                            raw_context, processed_context, sources = await fetch_and_process_results(processed_query, api_key, cx)
                            logger.info(f"Fetched and processed results. Number of sources: {len(sources)}")
                        except Exception as fetch_error:
                            log_error("Error fetching and processing results", fetch_error)
                            console.print("[bold yellow]Warning:[/bold yellow] Failed to fetch online results. Falling back to offline mode.")
                            raw_context, processed_context, sources = "", "", []
                            choice = "4"  # Switch to offline mode
                    else:
                        raw_context, processed_context, sources = "", "", []
                    
                    progress.update(task, advance=30, description="[cyan]Generating answer...")
                    
                    try:
                        if choice == "1":
                            result = await combined_answer_generation(processed_query, raw_context, processed_context, mode)
                        elif choice == "2":
                            result = await enhanced_answer_generation(processed_query, raw_context, processed_context, mode)
                        elif choice == "3":
                            result = await fallback_pipeline(processed_query, mode)
                        elif choice == "4":
                            result = await offline_mode(processed_query, mode)
                        else:
                            logger.warning(f"Invalid choice '{choice}'. Using default (combined pipeline).")
                            result = await combined_answer_generation(processed_query, raw_context, processed_context, mode)
                    except Exception as answer_error:
                        log_error(f"Error in answer generation (choice: {choice})", answer_error)
                        console.print("[bold yellow]Warning:[/bold yellow] Primary answer generation failed. Attempting fallback method.")
                        try:
                            result = await fallback_pipeline(processed_query, mode)
                        except Exception as fallback_error:
                            log_error("Error in fallback pipeline", fallback_error)
                            raise RuntimeError("Both primary and fallback answer generation methods failed.")
                    
                    progress.update(task, advance=40, description="[cyan]Finalizing result...")
                
                if 'sources' not in result:
                    result['sources'] = sources
                
                end_time = time.time()
                processing_time = end_time - start_time
                result['processing_time'] = processing_time
                
                logger.info("Answer generated successfully")
                print_result(result, processed_query, console)
                
                # Cache the result
                try:
                    await cache_result(processed_query, result)
                    logger.info("Result cached")
                except Exception as cache_error:
                    log_error("Error caching result", cache_error)
                    console.print("[bold yellow]Warning:[/bold yellow] Failed to cache the result.")
                
                # Add query to history
                history.append(processed_query)
                
                # Ask for feedback
                feedback = Prompt.ask("Was this answer helpful?", choices=["y", "n"], default="y")
                if feedback == 'n':
                    console.print("[italic]We're sorry the answer wasn't helpful. Your feedback helps us improve.[/italic]")
                    improvement = Prompt.ask("How can we improve? (Enter your suggestion or press Enter to skip)")
                    if improvement:
                        logger.info(f"User feedback for query '{processed_query}': {improvement}")
                
            except Exception as e:
                logger.error(f"An error occurred while processing the query: {str(e)}", exc_info=True)
                console.print("[bold red]Error:[/bold red] An unexpected error occurred while processing your query.")
                console.print("Please try again or rephrase your question. If the problem persists, try a different mode or pipeline.")
                console.print(f"Error details: {str(e)}")
    
    except KeyboardInterrupt:
        console.print("\n[bold yellow]Program interrupted by user. Exiting...[/bold yellow]")
    except Exception as e:
        logger.critical(f"Critical error in main loop: {str(e)}", exc_info=True)
        console.print("[bold red]Critical Error:[/bold red] The program encountered an unexpected error and needs to exit.")
        console.print(f"Error details: {str(e)}")
    finally:
        # Cancel the performance monitoring task when the main loop exits
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass

if __name__ == "__main__":
    asyncio.run(main())