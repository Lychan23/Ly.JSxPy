<<<<<<< HEAD
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
=======
# multi_spider.py

import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

class GoogleSpider(scrapy.Spider):
    name = "google_spider"
    start_urls = [
        'https://www.google.com/search?q={}'.format(search_query),
    ]

    def __init__(self, search_query, *args, **kwargs):
        super(GoogleSpider, self).__init__(*args, **kwargs)
        self.search_query = search_query

    def parse(self, response):
        for item in response.css('div.g'):
            yield {
                'title': item.css('h3.r::text').get(),
                'description': item.css('span.st::text').get(),
                'url': item.css('a::attr(href)').get(),
            }

class BingSpider(scrapy.Spider):
    name = "bing_spider"
    start_urls = [
        'https://www.bing.com/search?q={}'.format(search_query),
    ]

    def __init__(self, search_query, *args, **kwargs):
        super(BingSpider, self).__init__(*args, **kwargs)
        self.search_query = search_query

    def parse(self, response):
        for item in response.css('li.b_algo'):
            yield {
                'title': item.css('h2::text').get(),
                'description': item.css('p::text').get(),
                'url': item.css('a::attr(href)').get(),
            }

class YahooSpider(scrapy.Spider):
    name = "yahoo_spider"
    start_urls = [
        'https://search.yahoo.com/search?p={}'.format(search_query),
    ]

    def __init__(self, search_query, *args, **kwargs):
        super(YahooSpider, self).__init__(*args, **kwargs)
        self.search_query = search_query

    def parse(self, response):
        for item in response.css('li.sr'):
            yield {
                'title': item.css('h3.title::text').get(),
                'description': item.css('p.description::text').get(),
                'url': item.css('a::attr(href)').get(),
            }

def run_spiders(search_query):
    process = CrawlerProcess(get_project_settings())
    process.crawl(GoogleSpider, search_query=search_query)
    process.crawl(BingSpider, search_query=search_query)
    process.crawl(YahooSpider, search_query=search_query)
    process.start()
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
