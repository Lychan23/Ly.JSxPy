from elasticsearch import Elasticsearch
from scrapy.exceptions import DropItem
from itemadapter import ItemAdapter

class ElasticsearchPipeline:
    def __init__(self, es_servers, index, doc_type, uniq_key):
        self.es = Elasticsearch(hosts=es_servers)
        self.index = index
        self.doc_type = doc_type
        self.uniq_key = uniq_key

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            es_servers=crawler.settings.get('ELASTICSEARCH_SERVERS'),
            index=crawler.settings.get('ELASTICSEARCH_INDEX'),
            doc_type=crawler.settings.get('ELASTICSEARCH_TYPE'),
            uniq_key=crawler.settings.get('ELASTICSEARCH_UNIQ_KEY'),
        )

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        try:
            self.es.index(index=self.index, doc_type=self.doc_type, id=adapter[self.uniq_key], body=dict(adapter))
        except Exception as e:
            raise DropItem(f"Failed to index item: {e}")
        return item
