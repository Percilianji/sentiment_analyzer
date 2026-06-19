from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.nlp.service import NLPService
from app.nlp.sentiment import process_all_sentiments
from app.nlp.summarizer import SummarizerService
from app.nlp.pipeline import NLPPipeline

nlp_bp = Blueprint("nlp", __name__)


@nlp_bp.route("/clean", methods=["GET"])
@jwt_required()
def clean_all():

    reprocess = request.args.get("reprocess", "false").lower() in ("1", "true", "yes")
    count = NLPService.process_all_posts() if reprocess else NLPService.process_unprocessed_posts()

    return jsonify({
        "message": "Text preprocessing complete",
        "processed_posts": count,
        "reprocess": reprocess
    })


@nlp_bp.route("/topics", methods=["GET"])
@jwt_required()
def classify_topics():

    count = NLPService.process_all_topics()

    return jsonify({
        "message": "Topic classification complete",
        "processed_posts": count
    })
    


@nlp_bp.route("/sentiment", methods=["GET"])
@nlp_bp.route("/sentiments", methods=["GET"])
@jwt_required()
def classify_sentiment():

    use_xlm = request.args.get("use_xlm", "true").lower() not in ("0", "false", "no")

    try:
        count = process_all_sentiments(use_xlm=use_xlm)
    except Exception as exc:
        return jsonify({
            "message": str(exc),
            "use_xlm": use_xlm
        }), 500 if use_xlm else 400

    return jsonify({
        "message": "Sentiment analysis complete",
        "use_xlm": use_xlm,
        "processed_posts": count
    })


@nlp_bp.route("/summarise/<int:university_id>", methods=["POST"])
@nlp_bp.route("/summarize/<int:university_id>", methods=["POST"])
@jwt_required()
def summarise_university(university_id):

    data = request.get_json() or {}

    try:
        result = SummarizerService.run_summarisation(
            university_id,
            limit=data.get("limit", 10),
            regenerate=data.get("regenerate", False),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)


@nlp_bp.route("/summarise/run-active", methods=["POST"])
@nlp_bp.route("/summarize/run-active", methods=["POST"])
@jwt_required()
def summarise_active_universities():

    data = request.get_json() or {}

    try:
        result = SummarizerService.run_active_summarisation(
            limit=data.get("limit", 10),
            regenerate=data.get("regenerate", False),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)


@nlp_bp.route("/pipeline/run-active", methods=["POST"])
@jwt_required()
def run_active_pipeline():

    data = request.get_json() or {}

    try:
        result = NLPPipeline.run(
            reprocess=data.get("reprocess", False),
            use_xlm=data.get("use_xlm", True),
            summary_limit=data.get("summary_limit", 20),
            regenerate_summaries=data.get("regenerate_summaries", False),
            run_web_scrape=data.get("run_web_scrape", False),
            apify_platforms=data.get("apify_platforms", []),
            apify_max_items=data.get("apify_max_items", 20),
            run_google_reviews=data.get("run_google_reviews", False),
            google_max_reviews=data.get("google_max_reviews", 20),
        )
    except Exception as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify(result)
    
    
