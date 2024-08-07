import scrapy

class WebScraperItem(scrapy.Item):
    url = scrapy.Field()
    type = scrapy.Field()
    content = scrapy.Field()
