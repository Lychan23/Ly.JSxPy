# create_index.py
from elastic_search import ElasticSearchClient

def create_index():
    # Create an instance of ElasticSearchClient
    es_client = ElasticSearchClient()

    # Define your index name and mappings (optional)
    index_name = "web_scraper_index"
    mappings = {
        "mappings": {
            "properties": {
                "title": {"type": "text"},
                "description": {"type": "text"},
                "url": {"type": "keyword"}
            }
        }
    }

    # Create the index
    es_client.create_index(index_name, mappings)
    print(f"Index '{index_name}' created.")

if __name__ == "__main__":
    create_index()
