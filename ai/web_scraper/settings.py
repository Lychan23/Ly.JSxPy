<<<<<<< HEAD
[

]
=======
BOT_NAME = 'web_scraper'

SPIDER_MODULES = ['web_scraper']
NEWSPIDER_MODULE = 'web_scraper'

ES_URI = 'http://localhost:9200'
ES_INDEX = 'web_scraper_index'

ITEM_PIPELINES = {
    'web_scraper.pipelines.ElasticsearchPipeline': 300
}
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
