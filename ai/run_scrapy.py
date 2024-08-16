import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from web_scraper.multi_spider import GoogleSpider

if __name__ == "__main__":
    search_query = sys.argv[1]  # Retrieve search query from the command line arguments
    
    process = CrawlerProcess(get_project_settings())
    process.crawl(GoogleSpider, search_query=search_query)  # Pass search_query to the spider
    process.start()