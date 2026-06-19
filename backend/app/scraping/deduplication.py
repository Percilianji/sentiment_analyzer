import hashlib
from urllib.parse import urlparse, parse_qs, unquote

from app.database.models import Post


class DeduplicationService:

    # ----------------------------
    # URL CLEANING (VERY IMPORTANT)
    # ----------------------------
    @staticmethod
    def clean_url(url: str):
        if not url:
            return None

        # Fix Google / SerpAPI redirect links
        if "/goto?url=" in url:
            try:
                parsed = urlparse(url)
                real_url = parse_qs(parsed.query).get("url", [None])[0]
                if real_url:
                    url = unquote(real_url)
            except:
                pass

        # Remove tracking parameters
        url = url.split("?")[0]

        return url.strip()

    # ----------------------------
    # CONTENT NORMALIZATION
    # ----------------------------
    @staticmethod
    def normalize_text(text: str):
        if not text:
            return None

        return " ".join(text.lower().split())

    # ----------------------------
    # HASH GENERATION
    # ----------------------------
    @staticmethod
    def hash_content(content: str):
        if not content:
            return None

        normalized = DeduplicationService.normalize_text(content)

        return hashlib.md5(
            normalized.encode("utf-8")
        ).hexdigest()

    # ----------------------------
    # URL EXISTS CHECK
    # ----------------------------
    @staticmethod
    def url_exists(url: str):
        return Post.query.filter_by(url=url).first() is not None

    # ----------------------------
    # HASH EXISTS CHECK
    # ----------------------------
    @staticmethod
    def hash_exists(content_hash: str):
        return Post.query.filter_by(content_hash=content_hash).first() is not None

    # ----------------------------
    # FINAL DECISION
    # ----------------------------
    @staticmethod
    def is_duplicate(url: str, content_hash: str):

        if DeduplicationService.url_exists(url):
            return True

        if DeduplicationService.hash_exists(content_hash):
            return True

        return False