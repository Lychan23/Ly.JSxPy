from elasticsearch import Elasticsearch, helpers

class ElasticSearchClient:
    def __init__(self, hosts=None):
        # Initialize the Elasticsearch client
        self.es = Elasticsearch(hosts or ["http://localhost:9200"])

    def create_index(self, index_name, mappings=None):
        # Create an index with optional mappings if it doesn't exist
        if not self.es.indices.exists(index=index_name):
            self.es.indices.create(index=index_name, body=mappings or {})

    def index_documents(self, index_name, documents):
        # Bulk index documents into the specified index
        actions = [
            {
                "_index": index_name,
                "_source": doc,
            }
            for doc in documents
        ]
        helpers.bulk(self.es, actions)

    def search(self, index_name, query, size=10):
        # Search for documents in the specified index
        search_body = {
            "query": {
                "match": {
                    "content": query
                }
            }
        }
        response = self.es.search(index=index_name, body=search_body, size=size)
        return response["hits"]["hits"]
