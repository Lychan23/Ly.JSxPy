import os
import requests
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Fetch the GOOGLE_CX and GOOGLE_API_KEY from environment variables
GOOGLE_CX = os.getenv('GOOGLE_CX')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
SEARCH_URL = "https://www.googleapis.com/customsearch/v1"

# Domains we consider to be more privacy-focused or less biased
PRIVACY_FOCUSED_DOMAINS = ['.org', '.edu', '.gov', 'duckduckgo.com']

# Function to perform a search query using Google Custom Search API
def search_pse(query, num_results=10):
    if not GOOGLE_CX or not GOOGLE_API_KEY:
        raise ValueError("Google CX or API Key not found in environment variables")

    params = {
        'q': query,
        'cx': GOOGLE_CX,
        'key': GOOGLE_API_KEY,
        'num': num_results
    }
    response = requests.get(SEARCH_URL, params=params)
    if response.status_code == 200:
        results = response.json().get('items', [])
        return results
    else:
        raise Exception(f"Error occurred: {response.status_code}, {response.text}")

# Function to rank and filter results based on privacy-focused domains and bias
def filter_and_rank_results(results):
    ranked_results = []

    for result in results:
        link = result.get('link')
        title = result.get('title')
        snippet = result.get('snippet')
        domain = get_domain_from_url(link)

        # Boost ranking for privacy-focused or less biased domains
        rank_score = 0
        if any(domain.endswith(suffix) for suffix in PRIVACY_FOCUSED_DOMAINS):
            rank_score += 10  # Boost for privacy-focused domains
        else:
            rank_score += 1  # Standard rank for other domains

        ranked_results.append({
            'title': title,
            'snippet': snippet,
            'link': link,
            'rank_score': rank_score
        })

    # Sort the results based on the rank_score in descending order
    ranked_results.sort(key=lambda x: x['rank_score'], reverse=True)
    return ranked_results

# Utility function to extract the domain from a URL
def get_domain_from_url(url):
    return url.split('/')[2] if '//' in url else url

# Function to print search results
def display_results(results):
    if not results:
        print("No results found.")
    for index, result in enumerate(results, start=1):
        title = result.get('title')
        snippet = result.get('snippet')
        link = result.get('link')
        print(f"{index}. {title}\n   {snippet}\n   {link}\n")

# Example Usage
if __name__ == "__main__":
    query = input("Enter search query: ")
    try:
        search_results = search_pse(query)
        ranked_results = filter_and_rank_results(search_results)
        display_results(ranked_results)
    except Exception as e:
        print(f"Error: {e}")
