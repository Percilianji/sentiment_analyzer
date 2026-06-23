from datetime import datetime, timedelta
import hashlib
import secrets
from urllib.parse import urlencode

from flask import current_app


TOKEN_BYTES = 32
SETUP_TOKEN_TTL_HOURS = 24


def create_setup_token():
    token = secrets.token_urlsafe(TOKEN_BYTES)
    token_hash = hash_setup_token(token)
    expires_at = datetime.utcnow() + timedelta(hours=SETUP_TOKEN_TTL_HOURS)

    return token, token_hash, expires_at


def hash_setup_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_setup_link(token, email):
    frontend_url = current_app.config.get("FRONTEND_URL") or "http://localhost:5173"
    query = urlencode({"token": token, "email": email})

    return f"{frontend_url.rstrip('/')}/setup-password?{query}"
