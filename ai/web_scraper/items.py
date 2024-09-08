import scrapy

class WebScraperItem(scrapy.Item):
    title = scrapy.Field()
    description = scrapy.Field()
    url = scrapy.Field()