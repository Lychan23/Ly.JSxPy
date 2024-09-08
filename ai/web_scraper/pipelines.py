import json

class ElasticsearchPipeline:
    def __init__(self, es_uri, es_index):
        self.es_uri = es_uri
        self.es_index = es_index

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            es_uri=crawler.settings.get('ES_URI'),
            es_index=crawler.settings.get('ES_INDEX')
        )

    def process_item(self, item, spider):
        data = dict(item)
        self.es.index(index=self.es_index, body=data)
        return item