from elasticsearch import Elasticsearch

def create_index(es, index_name):
    if not es.indices.exists(index=index_name):
        es.indices.create(index=index_name, body={
            "mappings": {
                "properties": {
                    "url": {"type": "keyword"},
                    "title": {"type": "text"},
                    "content": {"type": "text"},
                    # Add more fields here
                }
            }
        })

if __name__ == "__main__":
    es = Elasticsearch(['http://localhost:9200'])
    create_index(es, 'scrapy-index')
