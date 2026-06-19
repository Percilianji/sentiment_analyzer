from app.nlp.service import NLPService
from app.nlp.sentiment import process_all_sentiments
from app.nlp.summarizer import SummarizerService
from app.scraping.apify_service import ApifyService
from app.scraping.orchestrator import SearchOrchestrator


class NLPPipeline:

    @staticmethod
    def run(
        reprocess=False,
        use_xlm=True,
        summary_limit=20,
        regenerate_summaries=False,
        run_web_scrape=False,
        apify_platforms=None,
        apify_max_items=20,
        run_google_reviews=False,
        google_max_reviews=20,
    ):
        scraping_result = {}

        if run_web_scrape:
            scraping_result["web"] = SearchOrchestrator.run_and_store()

        if run_google_reviews:
            scraping_result["google_reviews"] = ApifyService.run_active_google_reviews(
                max_reviews=google_max_reviews,
            )

        for platform in apify_platforms or []:
            scraping_result[platform] = ApifyService.run_active_social_media(
                platform=platform,
                max_items=apify_max_items,
            )

        cleaned_count = (
            NLPService.process_all_posts()
            if reprocess
            else NLPService.process_unprocessed_posts()
        )
        topic_count = NLPService.process_all_topics()
        sentiment_count = process_all_sentiments(use_xlm=use_xlm)
        summary_result = SummarizerService.run_active_summarisation(
            limit=summary_limit,
            regenerate=regenerate_summaries,
        )

        return {
            "cleaned_posts": cleaned_count,
            "topic_posts": topic_count,
            "sentiment_posts": sentiment_count,
            "use_xlm": use_xlm,
            "summary_limit": summary_limit,
            "regenerate_summaries": regenerate_summaries,
            "scraping": scraping_result,
            "summaries": summary_result,
        }
