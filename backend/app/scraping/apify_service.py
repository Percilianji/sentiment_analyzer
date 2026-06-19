from datetime import datetime
import os
from urllib.parse import quote_plus, urlparse, parse_qs
from dotenv import load_dotenv

from app.database.database import db
from app.database.models import Post, University
from app.nlp.service import NLPService
from app.scraping.deduplication import DeduplicationService

load_dotenv()


class ApifyService:

    @staticmethod
    def client():
        token = os.getenv("APIFY_TOKEN")

        if not token:
            raise RuntimeError("APIFY_TOKEN is not configured in .env")

        try:
            from apify_client import ApifyClient
        except ImportError as exc:
            raise RuntimeError(
                "apify-client is not installed. Install it with: pip install apify-client"
            ) from exc

        return ApifyClient(token)

    @staticmethod
    def normalize_google_maps_url(url):
        if not url:
            return None

        parsed = urlparse(url)

        if "/maps/place" in parsed.path or "/maps/search" in parsed.path:
            return url

        query = parse_qs(parsed.query)
        search_text = query.get("q", [None])[0]

        if "google." in parsed.netloc and parsed.path == "/maps" and search_text:
            return f"https://www.google.com/maps/search/{quote_plus(search_text)}"

        return url

    @staticmethod
    def google_maps_place_url(place_id=None, place_url=None, place_query=None):
        if place_url:
            return ApifyService.normalize_google_maps_url(place_url)

        if place_query:
            return f"https://www.google.com/maps/search/{quote_plus(place_query)}"

        if place_id:
            return f"https://www.google.com/maps/place/?q=place_id:{place_id}"

        return None

    @staticmethod
    def get_run_value(actor_run, *keys):
        if isinstance(actor_run, dict):
            for key in keys:
                value = actor_run.get(key)
                if value is not None:
                    return value
            return None

        if hasattr(actor_run, "model_dump"):
            data = actor_run.model_dump()
            for key in keys:
                value = data.get(key)
                if value is not None:
                    return value

        for key in keys:
            value = getattr(actor_run, key, None)
            if value is not None:
                return value

        return None

    @staticmethod
    def extract_review_text(item):
        fields = (
            "text",
            "reviewText",
            "review",
            "comment",
            "content",
            "description",
        )

        for field in fields:
            value = item.get(field)
            if isinstance(value, str) and value.strip():
                return value.strip()

        return ""

    @staticmethod
    def extract_social_text(item):
        fields = (
            "text",
            "fullText",
            "tweetText",
            "postText",
            "caption",
            "message",
            "comment",
            "content",
            "description",
            "body",
            "title",
        )

        for field in fields:
            value = item.get(field)
            if isinstance(value, str) and value.strip():
                return value.strip()

        return ""

    @staticmethod
    def extract_author(item):
        for field in (
            "name",
            "authorName",
            "reviewerName",
            "userName",
            "username",
            "handle",
            "profileName",
        ):
            value = item.get(field)
            if isinstance(value, str) and value.strip():
                return value.strip()

        for field in ("author", "user", "owner"):
            value = item.get(field)
            if isinstance(value, dict):
                for nested_field in ("name", "username", "handle"):
                    nested_value = value.get(nested_field)
                    if isinstance(nested_value, str) and nested_value.strip():
                        return nested_value.strip()

        return None

    @staticmethod
    def extract_url(item, fallback_url):
        for field in (
            "reviewUrl",
            "url",
            "placeUrl",
            "postUrl",
            "tweetUrl",
            "link",
            "permalink",
        ):
            value = item.get(field)
            if isinstance(value, str) and value.strip():
                return value.strip()

        return fallback_url

    @staticmethod
    def actor_default_env_key(platform):
        return {
            "twitter": "APIFY_TWITTER_ACTOR_ID",
            "facebook": "APIFY_FACEBOOK_ACTOR_ID",
            "facebook_posts": "APIFY_FACEBOOK_POSTS_ACTOR_ID",
            "threads": "APIFY_THREADS_ACTOR_ID",
            "linkedin": "APIFY_LINKEDIN_ACTOR_ID",
        }.get(platform)

    @staticmethod
    def run_actor(actor_id, actor_input):
        client = ApifyService.client()
        actor_run = client.actor(actor_id).call(run_input=actor_input)
        status = ApifyService.get_run_value(actor_run, "status")
        dataset_id = ApifyService.get_run_value(
            actor_run,
            "defaultDatasetId",
            "default_dataset_id",
        )

        if status and status != "SUCCEEDED":
            raise RuntimeError(f"Apify actor did not succeed. Status: {status}")

        if not dataset_id:
            raise RuntimeError("Apify actor finished without a default dataset")

        return dataset_id, client.dataset(dataset_id).list_items().items

    @staticmethod
    def save_social_items(university, platform, items, fallback_url=None, save_limit=None):
        saved = 0
        skipped_empty = 0
        skipped_duplicate = 0

        for item in items:
            if save_limit is not None and saved >= save_limit:
                break

            content = ApifyService.extract_social_text(item)

            if not content:
                skipped_empty += 1
                continue

            content_hash = DeduplicationService.hash_content(content)

            if DeduplicationService.hash_exists(content_hash):
                skipped_duplicate += 1
                continue

            url = ApifyService.extract_url(item, fallback_url or f"apify://{platform}")

            post = Post(
                university_id=university.id,
                content=content,
                author=ApifyService.extract_author(item),
                source=f"apify_{platform}",
                url=DeduplicationService.clean_url(url),
                source_type="social",
                post_date=datetime.utcnow(),
                content_hash=content_hash,
            )

            db.session.add(post)
            db.session.flush()
            NLPService.process_post(post.id)
            saved += 1

        db.session.commit()

        return {
            "posts_saved": saved,
            "skipped_empty": skipped_empty,
            "skipped_duplicate": skipped_duplicate,
        }

    @staticmethod
    def run_social_media(university_id, platform, actor_id=None, run_input=None, save_limit=None):
        allowed_platforms = {"twitter", "facebook", "facebook_posts", "threads", "linkedin"}

        if platform not in allowed_platforms:
            raise RuntimeError(f"Unsupported platform: {platform}")

        university = University.query.get(university_id)

        if not university:
            raise RuntimeError("University not found")

        env_key = ApifyService.actor_default_env_key(platform)
        actor_id = actor_id or os.getenv(env_key)

        if not actor_id:
            raise RuntimeError(
                f"Apify actor_id is required. Send actor_id in the request body "
                f"or set {env_key} in .env"
            )

        if not run_input:
            raise RuntimeError(
                "run_input is required because Apify social media actor schemas differ"
            )

        dataset_id, items = ApifyService.run_actor(actor_id, run_input)
        saved_summary = ApifyService.save_social_items(
            university,
            platform,
            items,
            save_limit=save_limit,
        )

        return {
            "university": university.name,
            "platform": platform,
            "actor_id": actor_id,
            "dataset_id": dataset_id,
            "items_found": len(items),
            **saved_summary,
        }

    @staticmethod
    def social_search_terms(university):
        terms = [university.name]

        keywords = university.keywords or ""
        terms.extend(k.strip() for k in keywords.split(",") if k.strip())

        return list(dict.fromkeys(terms))

    @staticmethod
    def default_social_run_input(university, platform, max_items=50):
        terms = ApifyService.social_search_terms(university)

        if platform == "twitter":
            university_name = university.name.strip()
            opinion_terms = [
                f'"{university_name}" experience',
                f'"{university_name}" review',
                f'"{university_name}" students',
                f'"{university_name}" administration',
                f'"{university_name}" hostel',
                f'"{university_name}" lecturers',
                f'"{university_name}" registration',
                f'"{university_name}" fees',
            ]

            for term in terms:
                if term != university_name:
                    opinion_terms.append(f'"{term}" students')
                    opinion_terms.append(f'"{term}" complaints')

            return {
                "source_mode": "search",
                "search_query": " OR ".join(dict.fromkeys(opinion_terms)),
                "max_items": max(100, max_items),
                "search_sort": "Latest",
            }

        return {
            "searchTerms": terms,
            "queries": terms,
            "maxItems": max_items,
            "maxResults": max_items,
        }

    @staticmethod
    def run_active_social_media(platform, max_items=50, run_input_template=None):
        universities = University.query.filter_by(active=True).all()
        summary = {}

        for university in universities:
            try:
                run_input = run_input_template or ApifyService.default_social_run_input(
                    university,
                    platform,
                    max_items,
                )

                summary[university.name] = ApifyService.run_social_media(
                    university_id=university.id,
                    platform=platform,
                    run_input=run_input,
                    save_limit=max_items,
                )
            except Exception as exc:
                summary[university.name] = {
                    "error": str(exc)
                }

        return summary

    @staticmethod
    def build_default_input(place_url, max_reviews):
        return {
            "startUrls": [{"url": place_url}],
            "maxReviews": max_reviews,
            "reviewsLimit": max_reviews,
            "language": "en",
        }

    @staticmethod
    def default_place_query(university):
        name = university.name.strip()

        if "cameroon" in name.lower():
            return name

        return f"{name} Cameroon"

    @staticmethod
    def run_google_reviews(
        university_id,
        actor_id=None,
        place_id=None,
        place_url=None,
        place_query=None,
        max_reviews=50,
        run_input=None,
    ):
        university = University.query.get(university_id)

        if not university:
            raise RuntimeError("University not found")

        actor_id = actor_id or os.getenv("APIFY_GOOGLE_REVIEWS_ACTOR_ID")

        if not actor_id:
            raise RuntimeError(
                "Apify actor_id is required. Send it in the request body or set "
                "APIFY_GOOGLE_REVIEWS_ACTOR_ID in .env"
            )

        resolved_place_url = ApifyService.google_maps_place_url(
            place_id=place_id,
            place_url=place_url,
            place_query=place_query,
        )

        if not resolved_place_url and not run_input:
            raise RuntimeError(
                "Send either place_query, place_url, place_id, or a custom run_input"
            )

        actor_input = run_input or ApifyService.build_default_input(
            resolved_place_url,
            max_reviews,
        )

        client = ApifyService.client()
        actor_run = client.actor(actor_id).call(run_input=actor_input)
        status = ApifyService.get_run_value(actor_run, "status")
        dataset_id = ApifyService.get_run_value(
            actor_run,
            "defaultDatasetId",
            "default_dataset_id",
        )

        if status and status != "SUCCEEDED":
            raise RuntimeError(f"Apify actor did not succeed. Status: {status}")

        if not dataset_id:
            raise RuntimeError("Apify actor finished without a default dataset")

        items = client.dataset(dataset_id).list_items().items
        saved = 0
        skipped_empty = 0
        skipped_duplicate = 0

        for item in items:
            content = ApifyService.extract_review_text(item)

            if not content:
                skipped_empty += 1
                continue

            content_hash = DeduplicationService.hash_content(content)

            if DeduplicationService.hash_exists(content_hash):
                skipped_duplicate += 1
                continue

            url = ApifyService.extract_url(item, resolved_place_url)

            post = Post(
                university_id=university.id,
                content=content,
                author=ApifyService.extract_author(item),
                source="apify_google_reviews",
                url=DeduplicationService.clean_url(url),
                source_type="review",
                post_date=datetime.utcnow(),
                content_hash=content_hash,
            )

            db.session.add(post)
            db.session.flush()
            NLPService.process_post(post.id)
            saved += 1

        db.session.commit()

        return {
            "university": university.name,
            "actor_id": actor_id,
            "dataset_id": dataset_id,
            "reviews_found": len(items),
            "posts_saved": saved,
            "skipped_empty": skipped_empty,
            "skipped_duplicate": skipped_duplicate,
        }

    @staticmethod
    def run_active_google_reviews(max_reviews=50):
        universities = University.query.filter_by(active=True).all()
        summary = {}

        for university in universities:
            try:
                summary[university.name] = ApifyService.run_google_reviews(
                    university_id=university.id,
                    place_query=ApifyService.default_place_query(university),
                    max_reviews=max_reviews,
                )
            except Exception as exc:
                summary[university.name] = {
                    "error": str(exc)
                }

        return summary
