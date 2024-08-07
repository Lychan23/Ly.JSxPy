from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from multi_spider import MultiSpider  # Make sure this is the correct import path for your spider
import json	

def test_spider():
    process = CrawlerProcess(settings=get_project_settings())
    
    # Replace these with actual URLs and headers for testing
    test_urls = json.dumps(["http://example.com"])
    test_headers = json.dumps({"User-Agent": "Mozilla/5.0"})

    process.crawl(MultiSpider, urls=test_urls, headers=test_headers)
    process.start()

if __name__ == "__main__":
    test_spider()
