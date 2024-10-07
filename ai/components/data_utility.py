import os
from dotenv import load_dotenv

class Config:
    """Class to manage application configurations."""
    
    def __init__(self):
        load_dotenv()
        
        # API configurations
        self.google_api_key: str = os.getenv("GOOGLE_API_KEY")
        self.google_cx: str = os.getenv("GOOGLE_CX")

        # Processing parameters
        self.chunk_sizes: list = [512, 768, 1024]
        self.max_summary_tokens: list = [30, 50, 70]
        self.num_results: list = [3, 5, 7]

        # Other application parameters
        self.default_chunk_size: int = 1024
        self.default_max_summary_tokens: int = 50
        self.default_num_results: int = 5

    def get_google_config(self):
        """Returns Google API configurations."""
        return {
            "api_key": self.google_api_key,
            "cx": self.google_cx
        }

    def get_processing_parameters(self):
        """Returns processing parameters."""
        return {
            "chunk_sizes": self.chunk_sizes,
            "max_summary_tokens": self.max_summary_tokens,
            "num_results": self.num_results
        }

    def display_config(self):
        """Prints the current configuration settings."""
        print("Current Configuration:")
        print(f"Google API Key: {self.google_api_key}")
        print(f"Google CX: {self.google_cx}")
        print(f"Chunk Sizes: {self.chunk_sizes}")
        print(f"Max Summary Tokens: {self.max_summary_tokens}")
        print(f"Num Results: {self.num_results}")

# Example usage of the Config class
if __name__ == "__main__":
    config = Config()
    config.display_config()
