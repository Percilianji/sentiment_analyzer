from app.database.models import University
from app.scraping.search_service import SearchService


class ScrapingPipeline:

    @staticmethod
    def run_active_universities(limit=10):

        universities = University.query.filter_by(active=True).all()

        all_results = {}

        for university in universities:

            query = f"{university.name} {university.keywords}"

            results = SearchService.search(query, limit=limit)

            all_results[university.name] = results

            print("\n---")
            print(university.name)
            print(results)

        return all_results