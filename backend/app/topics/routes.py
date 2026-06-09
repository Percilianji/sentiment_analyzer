from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.topics.service import TopicService
from app.auth.decorators import admin_required

topics_bp = Blueprint("topics", __name__)

@topics_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_topic():

    data = request.get_json()

    topic = TopicService.create(
        name=data["name"],
        keywords=data["keywords"]
    )

    return jsonify({
        "id": topic.id,
        "message": "Topic created"
    }), 201
    
@topics_bp.route("/", methods=["GET"])
def get_topics():

    topics = TopicService.get_all()

    return jsonify([
        {
            "id": t.id,
            "name": t.name,
            "keywords": t.keywords
        }
        for t in topics
    ])
    
@topics_bp.route("/<int:topic_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_topic(topic_id):

    data = request.get_json()

    topic = TopicService.update(topic_id, data)

    if not topic:
        return jsonify({"message": "Topic not found"}), 404

    return jsonify({"message": "Topic updated"})

@topics_bp.route("/<int:topic_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_topic(topic_id):

    deleted = TopicService.delete(topic_id)

    if not deleted:
        return jsonify({"message": "Topic not found"}), 404

    return jsonify({"message": "Topic deleted"})