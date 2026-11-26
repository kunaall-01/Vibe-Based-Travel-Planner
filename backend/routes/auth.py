import json
import secrets
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import fetch_one, execute_query

auth_bp = Blueprint("auth", __name__)


def _serialize_user(row):
    if not row:
        return None
    vibes = []
    raw_vibes = row.get("favorite_vibes") or "[]"
    try:
        vibes = json.loads(raw_vibes) if isinstance(raw_vibes, str) else list(raw_vibes)
    except Exception:
        vibes = []
    return {
        "user_id": row["user_id"],
        "name": row["full_name"],
        "email": row["email"],
        "phone": row.get("phone") or "",
        "city": row.get("city") or "",
        "bio": row.get("bio") or "",
        "avatar_url": row.get("avatar_url") or "",
        "role": row.get("role") or "traveler",
        "vibes": vibes,
    }


def get_current_user():
    """Verify Bearer token against the SQLite sessions table."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None
    row = fetch_one(
        """
        SELECT u.*
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.token = ?
        """,
        (token,),
    )
    return _serialize_user(row)


@auth_bp.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    city = (data.get("city") or "").strip()
    password = data.get("password") or ""

    if len(name) < 2:
        return jsonify({"status": "error", "message": "Please enter your full name"}), 400
    if not email or "@" not in email:
        return jsonify({"status": "error", "message": "Please enter a valid email address"}), 400
    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    existing = fetch_one("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)", (email,))
    if existing:
        return jsonify({"status": "error", "message": "An account with this email already exists. Please log in."}), 409

    pw_hash = generate_password_hash(password, method="pbkdf2:sha256")
    uid = execute_query(
        "INSERT INTO users (full_name, email, password_hash, phone, city, favorite_vibes) VALUES (?, ?, ?, ?, ?, ?)",
        (name, email, pw_hash, phone, city, "[]"),
    )

    token = secrets.token_urlsafe(32)
    execute_query("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, uid))

    user_row = fetch_one("SELECT * FROM users WHERE user_id = ?", (uid,))
    return jsonify({
        "status": "success",
        "user": _serialize_user(user_row),
        "token": token,
    }), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    user = fetch_one("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
    if not user:
        return jsonify({
            "status": "error",
            "message": "No account found with this email. Please create an account first."
        }), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({
            "status": "error",
            "message": "Incorrect password. Please try again."
        }), 401

    token = secrets.token_urlsafe(32)
    execute_query("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user["user_id"]))

    return jsonify({
        "status": "success",
        "user": _serialize_user(user),
        "token": token,
    })


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        if token:
            execute_query("DELETE FROM sessions WHERE token = ?", (token,))
    return jsonify({"status": "success"})
