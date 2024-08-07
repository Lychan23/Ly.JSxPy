import scrapy
import json
import os
import sys

# Set up the path
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(script_dir, '..', '..'))
sys.path.append(parent_dir)

try:
    from items import WebScraperItem
    print("Module 'items' found and imported successfully.")
except ModuleNotFoundError:
    print("Module 'items' not found.")

class MultiSpider(scrapy.Spider):
    name = 'multi_spider'

    def __init__(self, *args, **kwargs):
        super(MultiSpider, self).__init__(*args, **kwargs)
        self.start_urls = json.loads(kwargs.get('urls'))
        self.headers = json.loads(kwargs.get('headers'))

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url, headers=self.headers, callback=self.parse)

    def parse(self, response):
        for paragraph in response.css('p'):
            item = WebScraperItem()
            item['url'] = response.url
            item['type'] = 'paragraph'
            item['content'] = paragraph.get()
            yield item
