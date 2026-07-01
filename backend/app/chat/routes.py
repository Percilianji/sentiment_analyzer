from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.chat.service import answer_chat


chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/", methods=["POST"])
@jwt_required()
def chat():
    data = request.get_json() or {}
    message = data.get("message", "")

    return jsonify(answer_chat(message))
