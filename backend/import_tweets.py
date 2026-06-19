import argparse
import json
from datetime import datetime

from app.main import app
from app.database.database import db
from app.database.models import Post, University
from app.nlp.preprocessing import TextPreprocessor
from app.nlp.service import NLPService
from app.scraping.deduplication import DeduplicationService


def parse_twitter_date(value):
    if not value:
        return datetime.utcnow()

    try:
        return datetime.strptime(value, "%a %b %d %H:%M:%S %z %Y").replace(tzinfo=None)
    except ValueError:
        return datetime.utcnow()


def tweet_text(item):
    return (item.get("fullText") or item.get("text") or "").strip()


def tweet_author(item):
    author = item.get("author") or {}

    if isinstance(author, dict):
        return author.get("userName") or author.get("name")

    return None


def tweet_url(item):
    return item.get("url") or item.get("twitterUrl") or "apify://twitter"


def relevance_terms(university):
    terms = [university.name]

    keywords = university.keywords or ""
    terms.extend(k.strip() for k in keywords.split(",") if k.strip())

    name_lower = university.name.lower()

    if "university of buea" in name_lower:
        terms.extend([
            "university of buea",
            "buea university",
            "ub buea",
            "ub students",
        ])

    if "catholic" in name_lower or "cuib" in name_lower:
        terms.extend([
            "cuib",
            "cuib buea",
            "cuib campus",
            "catholic university institute of buea",
            "catholic university of buea",
            "catholic university buea",
        ])

    return [
        term.lower()
        for term in dict.fromkeys(terms)
        if term and len(term.strip()) >= 3
    ]


def is_relevant_to_university(text, university):
    text_lower = text.lower()
    return any(term in text_lower for term in relevance_terms(university))


def import_tweets(path, university_id, limit=None):
    with open(path, "r", encoding="utf-8") as file:
        items = json.load(file)

    university = University.query.get(university_id)

    if not university:
        raise RuntimeError(f"University not found: {university_id}")

    saved = 0
    skipped_irrelevant = 0
    skipped_not_opinion = 0
    skipped_duplicate = 0
    skipped_empty = 0
    cleaned_saved = 0

    for item in items:
        if limit is not None and saved >= limit:
            break

        content = tweet_text(item)

        if not content:
            skipped_empty += 1
            continue

        if not is_relevant_to_university(content, university):
            skipped_irrelevant += 1
            continue

        if not TextPreprocessor.contains_opinion(content):
            skipped_not_opinion += 1
            continue

        content_hash = DeduplicationService.hash_content(content)

        if DeduplicationService.hash_exists(content_hash):
            skipped_duplicate += 1
            continue

        post = Post(
            university_id=university.id,
            content=content,
            author=tweet_author(item),
            source="apify_twitter",
            url=DeduplicationService.clean_url(tweet_url(item)),
            source_type="social",
            post_date=parse_twitter_date(item.get("createdAt")),
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
        "skipped_not_opinion": skipped_not_opinion,
        "skipped_duplicate": skipped_duplicate,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--university-id", type=int, required=True)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    with app.app_context():
        result = import_tweets(args.path, args.university_id, args.limit)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
