import json
from flask import Blueprint, request, jsonify
from backend.database import fetch_one, execute_query
from backend.routes.auth import get_current_user, _serialize_user

user_bp = Blueprint("user", __name__)


@user_bp.route("/user/profile", methods=["GET"])
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401
    return jsonify({"status": "success", "user": user})


@user_bp.route("/user/profile", methods=["POST", "PUT"])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    full_name = (data.get("name") if data.get("name") is not None else user["name"]).strip()
    email = (data.get("email") if data.get("email") is not None else user["email"]).strip().lower()
    phone = (data.get("phone") if data.get("phone") is not None else user["phone"]).strip()
    city = (data.get("city") if data.get("city") is not None else user["city"]).strip()
    bio = (data.get("bio") if data.get("bio") is not None else user["bio"]).strip()
    avatar_url = (data.get("avatar_url") if data.get("avatar_url") is not None else user["avatar_url"]).strip()
    vibes = data.get("vibes") if data.get("vibes") is not None else user["vibes"]

    if len(full_name) < 2:
        return jsonify({"status": "error", "message": "Full name must be at least 2 characters"}), 400
    if not email or "@" not in email:
        return jsonify({"status": "error", "message": "Valid email is required"}), 400

    # Ensure email isn't taken by another user
    clash = fetch_one(
        "SELECT user_id FROM users WHERE LOWER(email) = LOWER(?) AND user_id <> ?",
        (email, user["user_id"]),
    )
    if clash:
        return jsonify({"status": "error", "message": "That email is already in use by another account"}), 409

    vibes_json = json.dumps(list(vibes) if isinstance(vibes, list) else [])

    execute_query(
        """
        UPDATE users
        SET full_name = ?, email = ?, phone = ?, city = ?, bio = ?, avatar_url = ?, favorite_vibes = ?
        WHERE user_id = ?
        """,
        (full_name, email, phone, city, bio, avatar_url, vibes_json, user["user_id"]),
    )

    updated = fetch_one("SELECT * FROM users WHERE user_id = ?", (user["user_id"],))
    return jsonify({
        "status": "success",
        "message": "Profile saved to database",
        "user": _serialize_user(updated),
    })
