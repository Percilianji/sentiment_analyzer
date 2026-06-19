from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.universities.service import UniversityService
from app.auth.decorators import admin_required

universities_bp = Blueprint("universities", __name__)


@universities_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_university():
    data = request.get_json()

    uni = UniversityService.create(
        name=data["name"],
        keywords=data.get("keywords", "")
    )

    return jsonify({
        "id": uni.id,
        "message": "University created"
    })


@universities_bp.route("/", methods=["GET"])
@jwt_required()
def get_universities():
    universities = UniversityService.get_all()

    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "keywords": u.keywords,
            "active": u.active,
            "sentiment_index": u.sentiment_index
        }
        for u in universities
    ])


@universities_bp.route("/active", methods=["GET"])
@jwt_required()
def get_active_universities():
    universities = UniversityService.get_active()

    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "keywords": u.keywords
        }
        for u in universities
    ])


@universities_bp.route("/<int:uni_id>", methods=["GET"])
@jwt_required()
def get_university(uni_id):
    uni = UniversityService.get_by_id(uni_id)

    if not uni:
        return jsonify({"message": "University not found"}), 404

    return jsonify({
        "id": uni.id,
        "name": uni.name,
        "keywords": uni.keywords,
        "active": uni.active,
        "sentiment_index": uni.sentiment_index
    })


@universities_bp.route("/<int:uni_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_university(uni_id):
    data = request.get_json()

    uni = UniversityService.update(uni_id, data)

    if not uni:
        return jsonify({"message": "University not found"}), 404

    return jsonify({"message": "Updated successfully"})


@universities_bp.route("/<int:uni_id>/toggle", methods=["PATCH"])
@jwt_required()
@admin_required
def toggle_university(uni_id):
    uni = UniversityService.toggle_status(uni_id)

    if not uni:
        return jsonify({"message": "University not found"}), 404

    return jsonify({
        "id": uni.id,
        "active": uni.active
    })


@universities_bp.route("/<int:uni_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_university(uni_id):
    uni = UniversityService.delete(uni_id)

    if not uni:
        return jsonify({"message": "University not found"}), 404

    return jsonify({
        "id": uni.id,
        "active": uni.active,
        "message": "University deactivated"
    })
