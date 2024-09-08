import unittest
from scrapy.http import HtmlResponse, Request
from scrapy.crawler import CrawlerRunner
from twisted.internet import reactor
from twisted.internet.defer import inlineCallbacks
from scrapy.utils.project import get_project_settings
from scrapy import signals
from scrapy.signalmanager import dispatcher
from multi_spider import GoogleSpider, BingSpider, YahooSpider

class TestMultiSpider(unittest.TestCase):

    def setUp(self):
        self.items = []
        dispatcher.connect(self._item_scraped, signal=signals.item_scraped)

    def _item_scraped(self, item, response, spider):
        self.items.append(item)

    def fake_response(self, url, body, request=None):
        request = request or Request(url=url)
        response = HtmlResponse(url=url, request=request, body=body, encoding='utf-8')
        return response

    def test_google_spider(self):
        google_spider = GoogleSpider(search_query="Elasticsearch")
        response = self.fake_response('https://www.google.com/search?q=Elasticsearch', b'''
            <html>
            <body>
                <div class="g">
                    <h3 class="r">Google Search Result 1</h3>
                    <span class="st">Description 1</span>
                    <a href="http://example.com/1">Link 1</a>
                </div>
            </body>
            </html>
        ''')
        results = list(google_spider.parse(response))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Google Search Result 1')
        self.assertEqual(results[0]['description'], 'Description 1')
        self.assertEqual(results[0]['url'], 'http://example.com/1')

    def test_bing_spider(self):
        bing_spider = BingSpider(search_query="Elasticsearch")
        response = self.fake_response('https://www.bing.com/search?q=Elasticsearch', b'''
            <html>
            <body>
                <li class="b_algo">
                    <h2>Bing Search Result 1</h2>
                    <p>Description 1</p>
                    <a href="http://example.com/1">Link 1</a>
                </li>
            </body>
            </html>
        ''')
        results = list(bing_spider.parse(response))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Bing Search Result 1')
        self.assertEqual(results[0]['description'], 'Description 1')
        self.assertEqual(results[0]['url'], 'http://example.com/1')

    def test_yahoo_spider(self):
        yahoo_spider = YahooSpider(search_query="Elasticsearch")
        response = self.fake_response('https://search.yahoo.com/search?p=Elasticsearch', b'''
            <html>
            <body>
                <li class="sr">
                    <h3 class="title">Yahoo Search Result 1</h3>
                    <p class="description">Description 1</p>
                    <a href="http://example.com/1">Link 1</a>
                </li>
            </body>
            </html>
        ''')
        results = list(yahoo_spider.parse(response))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Yahoo Search Result 1')
        self.assertEqual(results[0]['description'], 'Description 1')
        self.assertEqual(results[0]['url'], 'http://example.com/1')

    @inlineCallbacks
    def test_run_spiders(self):
        settings = get_project_settings()
        runner = CrawlerRunner(settings)
        search_query = "Elasticsearch"

        yield runner.crawl(GoogleSpider, search_query=search_query)
        yield runner.crawl(BingSpider, search_query=search_query)
        yield runner.crawl(YahooSpider, search_query=search_query)

        # Print the results after running the spiders
        print("Scraped Items:")
        for item in self.items:
            print(item)
        
        self.assertGreater(len(self.items), 0, "No items scraped")

        reactor.stop()

if __name__ == '__main__':
    unittest.main()
