import os

from apscheduler.schedulers.background import BackgroundScheduler
from app.scraping.orchestrator import SearchOrchestrator
from app.scraping.apify_service import ApifyService


def run_with_app_context(app, func, *args, **kwargs):
    with app.app_context():
        return func(*args, **kwargs)


def start_scheduler(app):

    scheduler = BackgroundScheduler()

    scheduler.add_job(
        func=run_with_app_context,
        trigger="interval",
        minutes=30,
        args=[app, SearchOrchestrator.run_and_store],
    )

    if os.getenv("APIFY_GOOGLE_REVIEWS_ENABLED", "false").lower() == "true":
        scheduler.add_job(
            func=run_with_app_context,
            trigger="cron",
            hour=int(os.getenv("APIFY_GOOGLE_REVIEWS_HOUR", "2")),
            args=[app, ApifyService.run_active_google_reviews],
            kwargs={"max_reviews": int(os.getenv("APIFY_GOOGLE_REVIEWS_MAX_REVIEWS", "50"))},
        )

    scheduler.start()

    print("Scheduler started...")
