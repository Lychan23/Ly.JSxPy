import asyncio
import logging
import os
import time
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from rich.logging import RichHandler
from rich.console import Console
from rich.text import Text
from components.data_processing import DataProcessor
from components.enhanced_answer import enhanced_answer_generation
from components.utils import log_error, print_result
from components.safety import SafetyChecker

# Load environment variables
load_dotenv()

# Initialize Rich Console
console = Console()

# Set up custom logging handler to change colors
class CustomRichHandler(RichHandler):
    def emit(self, record):
        message = self.format(record)
        if record.levelname == "WARNING":
            message = Text(message, style="bold yellow")  # Change color for WARNING
        elif record.levelname == "ERROR":
            message = Text(message, style="bold red")     # Change color for ERROR
        elif record.levelname == "CRITICAL":
            message = Text(message, style="bold red")     # Change color for CRITICAL
        else:
            message = Text(message, style="white")         # Default color
        
        console.print(message)

# Configure logging
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
)
logger = logging.getLogger("rich")
logger.setLevel(logging.INFO)
handler = CustomRichHandler(rich_tracebacks=True)
logger.addHandler(handler)

# Initialize Flask app
app = Flask(__name__)

# Initialize components globally
data_processor = DataProcessor()
safety_checker = SafetyChecker(mode="power")  # Enforcing power mode

# Load GOOGLE_API_KEY and GOOGLE_CX from environment variables
api_key = os.getenv('GOOGLE_API_KEY')
cx = os.getenv('GOOGLE_CX')

if not api_key or not cx:
    logger.warning("Google API key or CX is not set. Make sure they are present in the .env file.")

# Function to initialize safety_checker
async def init_safety_checker():
    await safety_checker.initialize()

# Start the safety checker initialization in the background
loop = asyncio.get_event_loop()
loop.run_until_complete(init_safety_checker())

@app.route('/query', methods=['POST'])
def query():
    user_query = request.json.get('query')

    # Ensure query is in the correct format
    if not user_query:
        return jsonify({"error": "Query format should be: {'query': 'your_query_here'}"}), 400

    start_time = time.time()

    try:
        logger.info(f"Processing query: {user_query}")

        # Check safety of the query
        processed_query, is_safe, jailbreak_score, indirect_score = loop.run_until_complete(safety_checker.process_prompt(user_query))

        if not is_safe:
            return jsonify({
                "warning": "The query was flagged as potentially unsafe.",
                "jailbreak_score": jailbreak_score,
                "indirect_score": indirect_score
            }), 400

        # Process the query using the enhanced_answer_generation in power mode
        raw_context, processed_context, sources = loop.run_until_complete(
            data_processor.fetch_and_process_results(processed_query, api_key, cx)
        )
        result = loop.run_until_complete(
            enhanced_answer_generation(processed_query, raw_context, processed_context, mode="power")
        )

        end_time = time.time()
        processing_time = end_time - start_time

        result['processing_time'] = processing_time
        logger.info("Answer generated successfully")

        # Use print_result to format the output
        formatted_result = print_result(result, processed_query)

        return jsonify(formatted_result), 200

    except Exception as e:
        logger.error(f"An error occurred while processing the query: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred while processing your query."}), 500

if __name__ == "__main__":
    app.run(port=int(os.getenv('FLASK_PORT', 5000)))  # Change port as needed
