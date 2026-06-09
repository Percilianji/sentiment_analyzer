from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth.service import AuthService
from app.database.models import User
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required


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

