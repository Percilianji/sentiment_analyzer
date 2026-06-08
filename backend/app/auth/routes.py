from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth.service import AuthService
from app.database.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = AuthService.authenticate_user(data["email"], data["password"])

    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity={
        "id": user.id,
        "role": user.role
    })

    return jsonify({
        "access_token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role
        }
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    return jsonify({
        "user": identity
    })