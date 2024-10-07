import asyncio
import logging
import traceback
import psutil  # For memory checking
from functools import wraps
from asyncio.exceptions import TimeoutError
from rich.console import Console
from rich.panel import Panel
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

def handle_errors(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            # Run the original function
            return await func(*args, **kwargs)
        except TimeoutError as e:
            logger.error("TimeoutError: Operation took too long")
            console.print(Panel("[bold red]Error: The operation took too long and timed out.[/bold red]", style="red"))
            console.print("[bold yellow]Tip:[/bold yellow] Try again later or use offline mode if the issue persists.")
        except MemoryError as e:
            logger.error("MemoryError: System ran out of memory", exc_info=True)
            memory_info = psutil.virtual_memory()
            console.print(Panel(f"[bold red]Error: System ran out of memory. Available: {memory_info.available / (1024 ** 3):.2f} GB[/bold red]", style="red"))
            console.print("[bold yellow]Tip:[/bold yellow] Consider reducing the data load or increasing system memory.")
        except asyncio.CancelledError:
            logger.warning("Async task was cancelled")
            console.print("[italic yellow]Operation cancelled.[/italic yellow]")
        except Exception as e:
            # General exception handling with traceback
            error_message = "".join(traceback.format_exception(type(e), e, e.__traceback__))
            logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
            console.print(Panel(f"[bold red]Unhandled Error: {str(e)}[/bold red]", style="red"))
            console.print("[bold yellow]Error details:[/bold yellow]")
            console.print(error_message)
        finally:
            # Add a final block if you need to clean up or log additional information
            logger.info("Exiting the wrapped function")

    return wrapper
