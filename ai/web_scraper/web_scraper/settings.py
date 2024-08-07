# Scrapy settings for web_scraper project

BOT_NAME = "web_scraper"

SPIDER_MODULES = ["web_scraper.spiders"]
NEWSPIDER_MODULE = "web_scraper.spiders"

ROBOTSTXT_OBEY = True

# Elasticsearch settings
ELASTICSEARCH_SERVERS = ['http://localhost:9200']
ELASTICSEARCH_INDEX = 'scrapy-index'
ELASTICSEARCH_TYPE = '_doc'
ELASTICSEARCH_UNIQ_KEY = 'url'

# Configure item pipelines
ITEM_PIPELINES = {
    'web_scraper.pipelines.ElasticsearchPipeline': 100,
}

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
