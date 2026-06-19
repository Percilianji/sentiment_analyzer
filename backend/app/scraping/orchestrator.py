from app.database.models import University
from app.scraping.search_service import SearchService
from app.scraping.query_builder import QueryBuilder
from app.scraping.scraper import ScraperService


class SearchOrchestrator:

    @staticmethod
    def run_and_store():

        universities = University.query.filter_by(
            active=True
        ).all()

        summary = {}

        for uni in universities:

            try:

                # Build search queries
                queries = QueryBuilder.build(uni)

                all_urls = []

                # Search
                for q in queries:

                    results = SearchService.search(q)

                    if not results or isinstance(results, dict):
                        continue

                    all_urls.extend(results)

                # Remove duplicates
                unique_urls = {}

                for r in all_urls:
                    url = r.get("url")

                    if url:
                        unique_urls[url] = r

                clean_urls = list(unique_urls.values())

                # Scrape + Save
                saved_posts = ScraperService.process_urls(
                    uni,
                    clean_urls
                )

                summary[uni.name] = {
                    "urls_found": len(clean_urls),
                    "posts_saved": len(saved_posts)
                }

            except Exception as e:

                print(f"[ERROR] {uni.name}: {e}")

                summary[uni.name] = {
                    "error": str(e)
                }

        return summary
