
import sys
import json
import os
from scrapy.crawler import CrawlerProcess
from web_scraper.web_scraper.spiders.multi_spider import MultiSpider

# Ensure the project root directory is in sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps([]))
        sys.exit(1)

    search_url = sys.argv[1]
    headers = sys.argv[2]

    process = CrawlerProcess()
    process.crawl(MultiSpider, urls=json.dumps([search_url]), headers=headers)
    process.start()
