from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.users.service import UserService
from app.auth.decorators import admin_required

users_bp = Blueprint("users", __name__)


@users_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_user():
    data = request.get_json()

    user = UserService.create_user(
        name=data["name"],
        email=data["email"],
        password=data["password"],
        role=data["role"]
    )

    return jsonify({
        "id": user.id,
        "message": "User created"
    })


@users_bp.route("/", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    users = UserService.get_all_users()

    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role
        }
        for u in users
    ])


@users_bp.route("/<int:user_id>/role", methods=["PUT"])
@jwt_required()
@admin_required
def update_role(user_id):
    data = request.get_json()

    user = UserService.update_role(user_id, data["role"])

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({"message": "Role updated"})


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    result = UserService.delete_user(user_id)

    if not result:
        return jsonify({"message": "User not found"}), 404

    return jsonify({"message": "User deleted"})