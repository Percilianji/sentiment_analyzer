import os
import requests
from app.database.models import University


class SearchService:

    SERPAPI_URL = "https://serpapi.com/search"

    @staticmethod
    def search_university(university, limit=10):
        query = f"{university.name} {university.keywords}"
        return SearchService.search(query, limit)

    @staticmethod
    def search(query, limit=10):

        api_key = os.getenv("SERPAPI_KEY")

        if not api_key:
            raise Exception("SERPAPI_KEY is not configured in .env")

        params = {
            "q": query,
            "api_key": api_key,
            "engine": "google",
            "num": limit
        }

        try:
            response = requests.get(
                SearchService.SERPAPI_URL,
                params=params,
                timeout=(10, 30)
            )

            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise Exception(f"SerpApi error: {data['error']}")

            results = []

            for result in data.get("organic_results", [])[:limit]:
                results.append({
                    "title": result.get("title"),
                    "url": result.get("link"),
                    "snippet": result.get("snippet")
                })

            return results

        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

        except Exception as e:
            raise Exception(f"SearchService failed: {str(e)}")
