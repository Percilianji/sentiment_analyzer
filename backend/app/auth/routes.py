from flask import Blueprint, request, jsonify
from datetime import datetime

from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth.service import AuthService
from app.auth.invites import hash_setup_token
from app.auth.utils import hash_password
from app.database.database import db
from app.database.models import User


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = AuthService.authenticate_user(data["email"], data["password"])

    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(
    identity=str(user.id),
    additional_claims={
        "role": user.role
    }
)

    return jsonify({
        "access_token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role
        }
    })


@auth_bp.route("/setup-password", methods=["POST"])
def setup_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    token = (data.get("token") or "").strip()
    password = data.get("password") or ""

    if not email or not token or not password:
        return jsonify({"message": "Email, setup token, and password are required"}), 400

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    user = User.query.filter_by(email=email).first()

    if (
        not user
        or not user.password_setup_token_hash
        or user.password_setup_token_hash != hash_setup_token(token)
        or not user.password_setup_expires_at
        or user.password_setup_expires_at < datetime.utcnow()
    ):
        return jsonify({"message": "Password setup link is invalid or expired"}), 400

    user.password_hash = hash_password(password)
    user.password_setup_token_hash = None
    user.password_setup_expires_at = None
    user.password_set_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Password set successfully"})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    })
    
@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected_route():
    return {"message": "You are authenticated"}

