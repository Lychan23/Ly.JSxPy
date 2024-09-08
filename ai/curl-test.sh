#!/bin/sh

# Test the web scraping API with an example query
echo "Testing /api/webscrape endpoint..."
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"input": "What is the capital of France?"}' \
  http://localhost:8000/api/webscrape

echo "\n"

# Test the Elasticsearch search API with a query
echo "Testing /api/search endpoint..."
curl -X GET \
  -G \
  --data-urlencode "query=capital of France" \
  http://localhost:8000/api/search

echo "\n"

# Test the feedback API by submitting feedback
echo "Testing /api/feedback endpoint..."
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"feedback": 1.0}' \
  http://localhost:8000/api/feedback

echo "\n"

# Test the Elasticsearch search API again to see if feedback impacts results
echo "Testing /api/search endpoint after feedback..."
curl -X GET \
  -G \
  --data-urlencode "query=capital of France" \
  http://localhost:8000/api/search

echo "\n"
