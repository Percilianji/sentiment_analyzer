import requests
import os

SEARXNG_URL = os.getenv("SEARXNG_URL")


class SearXNGService:

    @staticmethod
    def search(query, limit=10):

        params = {
            "q": query,
            "format": "json"
        }

        response = requests.get(
            SEARXNG_URL,
            params=params,
            timeout=20,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        )

        response.raise_for_status()

        if "application/json" not in response.headers.get("Content-Type", ""):
            raise Exception("SearXNG blocked JSON or returned HTML instead.")

        data = response.json()

        results = []

        for result in data.get("results", [])[:limit]:
            results.append({
                "title": result.get("title"),
                "url": result.get("url"),
                "snippet": result.get("content")
            })

        return results