from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import os

from app.database.models import University
from app.scraping.apify_service import ApifyService
from app.scraping.search_service import SearchService
from app.scraping.orchestrator import SearchOrchestrator

scraping_bp = Blueprint("scraping", __name__)


@scraping_bp.route("/search/<int:university_id>", methods=["GET"])
@jwt_required()
def search_university(university_id):

    university = University.query.get_or_404(university_id)

    query = f"{university.name} {university.keywords}"

    results = SearchService.search(query)

    return jsonify(results)


# NEW ENDPOINT FOR PHASE 8
@scraping_bp.route("/run-full", methods=["GET"])
@jwt_required()
def run_full():

    result = SearchOrchestrator.run_and_store()

    return jsonify(result)


@scraping_bp.route("/apify/google-reviews/<int:university_id>", methods=["POST"])
@jwt_required()
def scrape_google_reviews(university_id):

    if os.getenv("APIFY_GOOGLE_REVIEWS_DISABLED", "false").lower() == "true":
        return jsonify({"message": "Google Reviews scraping is temporarily disabled"}), 403

    data = request.get_json() or {}

    try:
        result = ApifyService.run_google_reviews(
            university_id=university_id,
            actor_id=data.get("actor_id"),
            place_id=data.get("place_id"),
            place_url=data.get("place_url"),
            place_query=data.get("place_query"),
            max_reviews=data.get("max_reviews", 50),
            run_input=data.get("run_input"),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)


@scraping_bp.route("/apify/google-reviews/run-active", methods=["POST"])
@jwt_required()
def scrape_active_google_reviews():

    if os.getenv("APIFY_GOOGLE_REVIEWS_DISABLED", "false").lower() == "true":
        return jsonify({"message": "Google Reviews scraping is temporarily disabled"}), 403

    data = request.get_json() or {}

    try:
        result = ApifyService.run_active_google_reviews(
            max_reviews=data.get("max_reviews", 50),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)


@scraping_bp.route("/apify/social/<platform>/<int:university_id>", methods=["POST"])
@scraping_bp.route("/apify/twitter/<int:university_id>", defaults={"platform": "twitter"}, methods=["POST"])
@scraping_bp.route("/apify/x/<int:university_id>", defaults={"platform": "twitter"}, methods=["POST"])
@scraping_bp.route("/apify/facebook/<int:university_id>", defaults={"platform": "facebook"}, methods=["POST"])
@scraping_bp.route("/apify/facebook-posts/<int:university_id>", defaults={"platform": "facebook_posts"}, methods=["POST"])
@scraping_bp.route("/apify/threads/<int:university_id>", defaults={"platform": "threads"}, methods=["POST"])
@scraping_bp.route("/apify/linkedin/<int:university_id>", defaults={"platform": "linkedin"}, methods=["POST"])
@jwt_required()
def scrape_social_media(platform, university_id):

    data = request.get_json() or {}

    try:
        result = ApifyService.run_social_media(
            university_id=university_id,
            platform=platform,
            actor_id=data.get("actor_id"),
            run_input=data.get("run_input"),
            save_limit=data.get("save_limit"),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)


@scraping_bp.route("/apify/social/<platform>/run-active", methods=["POST"])
@scraping_bp.route("/apify/twitter/run-active", defaults={"platform": "twitter"}, methods=["POST"])
@scraping_bp.route("/apify/x/run-active", defaults={"platform": "twitter"}, methods=["POST"])
@scraping_bp.route("/apify/facebook/run-active", defaults={"platform": "facebook"}, methods=["POST"])
@scraping_bp.route("/apify/facebook-posts/run-active", defaults={"platform": "facebook_posts"}, methods=["POST"])
@scraping_bp.route("/apify/threads/run-active", defaults={"platform": "threads"}, methods=["POST"])
@scraping_bp.route("/apify/linkedin/run-active", defaults={"platform": "linkedin"}, methods=["POST"])
@jwt_required()
def scrape_active_social_media(platform):

    data = request.get_json() or {}

    try:
        result = ApifyService.run_active_social_media(
            platform=platform,
            max_items=data.get("max_items", 50),
            run_input_template=data.get("run_input_template"),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)
