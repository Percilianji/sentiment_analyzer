import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
  
  
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SERPAPI_KEY = os.getenv("SERPAPI_KEY")
    APIFY_TOKEN = os.getenv("APIFY_TOKEN")
    APIFY_GOOGLE_REVIEWS_ACTOR_ID = os.getenv("APIFY_GOOGLE_REVIEWS_ACTOR_ID")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() != "false"
