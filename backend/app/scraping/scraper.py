from datetime import datetime
import re
import requests
from bs4 import BeautifulSoup
from app.database.database import db
from app.database.models import Post
from app.scraping.deduplication import DeduplicationService


GENERIC_UNIVERSITY_TERMS = {
    "university",
    "college",
    "institute",
    "school",
    "students",
    "student",
    "campus",
    "reviews",
    "review",
    "ranking",
    "rankings",
    "experience",
    "opinions",
    "complaints",
    "problems",
    "issues",
    "news",
    "latest",
    "updates",
}


def extract_content_parts(soup):
    """
    Returns list of structured content blocks.
    Each block = {source_type, text}
    """

    parts = []

    article = soup.find("article")
    if article:
        parts.append({
            "source_type": "article",
            "text": article.get_text(separator=" ", strip=True)
        })

    comments = soup.find_all(
        "div",
        class_=["comment", "comments", "comment-section"]
    )
    for comment in comments:
        text = comment.get_text(separator=" ", strip=True)
        if text:
            parts.append({
                "source_type": "comments",
                "text": text
            })

    if not parts:
        full_text = soup.get_text(separator=" ", strip=True)
        parts.append({
            "source_type": "full_page",
            "text": full_text
        })

    return parts


def normalize_for_match(text):
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def build_identity_terms(university):
    terms = []

    if university.name:
        terms.append(university.name)

    keywords = university.keywords or ""
    terms.extend(k.strip() for k in keywords.split(",") if k.strip())

    cleaned_terms = []
    for term in terms:
        normalized = normalize_for_match(term)
        if len(normalized) < 3:
            continue

        if normalized in GENERIC_UNIVERSITY_TERMS:
            continue

        cleaned_terms.append(normalized)

    return list(dict.fromkeys(cleaned_terms))


def is_relevant_to_university(university, content, url="", title="", snippet=""):
    identity_terms = build_identity_terms(university)

    if not identity_terms:
        return True

    haystack = normalize_for_match(" ".join([
        content or "",
        url or "",
        title or "",
        snippet or "",
    ]))

    for term in identity_terms:
        if re.search(rf"\b{re.escape(term)}\b", haystack):
            return True

    return False


class ScraperService:

    @staticmethod
    def extract_content(url):

        try:
            headers = {"User-Agent": "Mozilla/5.0"}

            response = requests.get(
                url,
                headers=headers,
                timeout=15
            )

            if response.status_code != 200:
                return []

            content_type = response.headers.get("Content-Type", "").lower()
            if "pdf" in content_type or url.lower().endswith(".pdf"):
                return []

            if "request unsuccessful" in response.text.lower() and "incapsula" in response.text.lower():
                return []

            soup = BeautifulSoup(response.text, "lxml")

            for tag in soup(["script", "style", "noscript"]):
                tag.decompose()

            return extract_content_parts(soup)

        except Exception as e:
            print(f"Scraping error: {e}")
            return []

    @staticmethod
    def save_post(university, content, url, source_type="full_page", title="", snippet=""):

        if not content:
            return None

        if not is_relevant_to_university(university, content, url, title, snippet):
            return None

        # --------------------------
        # DEDUP PIPELINE (PHASE 9)
        # --------------------------
        clean_url = DeduplicationService.clean_url(url)
        content_hash = DeduplicationService.hash_content(content)

        if DeduplicationService.hash_exists(content_hash):
            return None

        post = Post(
            university_id=university.id,
            content=content,
            url=clean_url,
            source_type=source_type,
            post_date=datetime.utcnow(),
            content_hash=content_hash
        )

        try:
            db.session.add(post)
            db.session.commit()
            return post

        except Exception as e:
            db.session.rollback()
            print(f"DB error: {e}")
            return None

    @staticmethod
    def process_urls(university, urls):

        saved_posts = []
        seen_urls = set()

        for item in urls:

            url = item.get("url")
            title = item.get("title") or ""
            snippet = item.get("snippet") or ""

            if not url:
                continue

            # --------------------------
            # PRE-SCRAPE DEDUP (IMPORTANT)
            # --------------------------
            clean_url = DeduplicationService.clean_url(url)

            if clean_url in seen_urls:
                continue

            seen_urls.add(clean_url)

            parts = ScraperService.extract_content(clean_url)

            for part in parts:
                content = part["text"]
                source_type = part["source_type"]

                post = ScraperService.save_post(
                    university,
                    content,
                    clean_url,
                    source_type,
                    title,
                    snippet
                )

                if post:
                   saved_posts.append(post.id)

    # TRIGGER NLP IMMEDIATELY
                   from app.nlp.service import NLPService
                   NLPService.process_post(post.id)

        return saved_posts
