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
