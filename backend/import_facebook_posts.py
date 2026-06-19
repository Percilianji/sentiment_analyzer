import argparse
import json
from datetime import datetime

from app.main import app
from app.database.database import db
from app.database.models import Post, University
from app.nlp.service import NLPService
from app.scraping.deduplication import DeduplicationService


IMPORTANT_TERMS = [
    "pro-chancellor",
    "presidential decree",
    "inauguration",
    "laboratory",
    "computers",
    "infrastructure",
    "registration",
    "fees",
    "tuition",
    "hostel",
    "strike",
    "protest",
    "safety",
    "attack",
    "students",
    "faculty",
    "college",
    "technology",
    "engineering",
    "appointment",
    "announcement",
]


def parse_time(value):
    if not value:
        return datetime.utcnow()

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return datetime.utcnow()


def post_text(item):
    return (item.get("text") or item.get("message") or item.get("content") or "").strip()


def post_author(item):
    user = item.get("user") or {}

    if isinstance(user, dict):
        return user.get("name")

    return item.get("pageName")


def is_relevant_to_university(text, university):
    text_lower = text.lower()
    terms = [university.name.lower()]

    keywords = university.keywords or ""
    terms.extend(k.strip().lower() for k in keywords.split(",") if k.strip())

    if "university of buea" in university.name.lower():
        terms.extend(["ub", "ubuea", "buea"])

    return any(term and term in text_lower for term in terms)


def is_important(item, text):
    text_lower = text.lower()

    if any(term in text_lower for term in IMPORTANT_TERMS):
        return True

    engagement = (
        int(item.get("comments") or 0)
        + int(item.get("shares") or 0)
        + int(item.get("likes") or 0)
        + int(item.get("reactionLikeCount") or 0)
    )

    return engagement >= 20


def import_facebook_posts(path, university_id, limit=None):
    with open(path, "r", encoding="utf-8") as file:
        items = json.load(file)

    university = University.query.get(university_id)

    if not university:
        raise RuntimeError(f"University not found: {university_id}")

    saved = 0
    cleaned_saved = 0
    skipped_empty = 0
    skipped_irrelevant = 0
    skipped_unimportant = 0
    skipped_duplicate = 0

    for item in items:
        if limit is not None and saved >= limit:
            break

        content = post_text(item)

        if not content:
            skipped_empty += 1
            continue

        if not is_relevant_to_university(content, university):
            skipped_irrelevant += 1
            continue

        if not is_important(item, content):
            skipped_unimportant += 1
            continue

        content_hash = DeduplicationService.hash_content(content)

        if DeduplicationService.hash_exists(content_hash):
            skipped_duplicate += 1
            continue

        post = Post(
            university_id=university.id,
            content=content,
            author=post_author(item),
            source="apify_facebook_posts",
            url=DeduplicationService.clean_url(item.get("url") or item.get("facebookUrl")),
            source_type="social",
            post_date=parse_time(item.get("time")),
            content_hash=content_hash,
        )

        db.session.add(post)
        db.session.flush()

        if NLPService.process_post(post.id):
            cleaned_saved += 1

        saved += 1

    db.session.commit()

    return {
        "university": university.name,
        "items_found": len(items),
        "posts_saved": saved,
        "cleaned_saved": cleaned_saved,
        "skipped_empty": skipped_empty,
        "skipped_irrelevant": skipped_irrelevant,
        "skipped_unimportant": skipped_unimportant,
        "skipped_duplicate": skipped_duplicate,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--university-id", type=int, required=True)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    with app.app_context():
        result = import_facebook_posts(args.path, args.university_id, args.limit)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
