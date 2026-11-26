import json
import os
import queue
import threading
import uuid
from flask import Blueprint, request, jsonify, Response, stream_with_context, send_from_directory
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user, _serialize_user

realtime_bp = Blueprint("realtime", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Thread-safe SSE pub/sub broker: maps user_id (or 'wall') -> set of Queue
_lock = threading.Lock()
_user_queues = {}  # user_id -> set[Queue]
_global_queues = set()  # set[Queue]


def publish_to_user(user_id, event_type, payload):
    msg = json.dumps({"type": event_type, "payload": payload})
    with _lock:
        targets = list(_user_queues.get(int(user_id), ()))
    for q in targets:
        try:
            q.put_nowait(msg)
        except Exception:
            pass


def publish_global(event_type, payload):
    msg = json.dumps({"type": event_type, "payload": payload})
    with _lock:
        targets = list(_global_queues)
    for q in targets:
        try:
            q.put_nowait(msg)
        except Exception:
            pass


def _user_from_query_or_header():
    user = get_current_user()
    if user:
        return user
    token = request.args.get("token", "").strip()
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


@realtime_bp.route("/realtime/stream", methods=["GET"])
def realtime_stream():
    user = _user_from_query_or_header()
    uid = user["user_id"] if user else None
    q = queue.Queue(maxsize=100)

    with _lock:
        _global_queues.add(q)
        if uid is not None:
            _user_queues.setdefault(uid, set()).add(q)

    def generate():
        try:
            yield f"data: {json.dumps({'type': 'connected', 'user_id': uid})}\n\n"
            while True:
                try:
                    msg = q.get(timeout=18)
                    yield f"data: {msg}\n\n"
                except queue.Empty:
                    yield ": keepalive\n\n"
        finally:
            with _lock:
                _global_queues.discard(q)
                if uid is not None and uid in _user_queues:
                    _user_queues[uid].discard(q)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------- REAL-TIME 1:1 CHAT ----------------
@realtime_bp.route("/chat/<int:peer_id>", methods=["GET"])
def get_chat_messages(peer_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401
    uid = user["user_id"]
    rows = fetch_all(
        """
        SELECT m.message_id as id, m.sender_id, m.receiver_id, m.text, m.msg_type, m.created_at,
               u.full_name as sender_name
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.message_id ASC
        """,
        (uid, peer_id, peer_id, uid),
    )
    peer = fetch_one("SELECT user_id as id, full_name as name, city, avatar_url as img, role FROM users WHERE user_id = ?", (peer_id,))
    return jsonify({"status": "success", "peer": peer, "messages": rows})


@realtime_bp.route("/chat/<int:peer_id>", methods=["POST"])
def send_chat_message(peer_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    msg_type = data.get("msg_type") or "text"
    if not text:
        return jsonify({"status": "error", "message": "Message cannot be empty"}), 400

    mid = execute_query(
        "INSERT INTO chat_messages (sender_id, receiver_id, text, msg_type) VALUES (?, ?, ?, ?)",
        (user["user_id"], peer_id, text, msg_type),
    )
    msg = {
        "id": mid,
        "sender_id": user["user_id"],
        "receiver_id": peer_id,
        "sender_name": user["name"],
        "sender_avatar": user.get("avatar_url") or "",
        "text": text,
        "msg_type": msg_type,
    }
    publish_to_user(peer_id, "chat_message", msg)
    publish_to_user(user["user_id"], "chat_message", msg)
    return jsonify({"status": "success", "message": msg}), 201


@realtime_bp.route("/chat/conversations", methods=["GET"])
def list_conversations():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401
    uid = user["user_id"]
    rows = fetch_all(
        """
        SELECT u.user_id as id, u.full_name as name, u.city as place, u.avatar_url as img, u.role,
               MAX(m.message_id) as last_msg_id
        FROM chat_messages m
        JOIN users u ON u.user_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
        WHERE m.sender_id = ? OR m.receiver_id = ?
        GROUP BY u.user_id
        ORDER BY last_msg_id DESC
        """,
        (uid, uid, uid),
    )
    return jsonify({"status": "success", "conversations": rows})


# ---------------- REAL-TIME WEBRTC VIDEO / AUDIO SIGNALING ----------------
@realtime_bp.route("/realtime/signal", methods=["POST"])
def send_call_signal():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    target_id = data.get("target_id")
    signal_type = data.get("signal_type")  # ring, offer, answer, ice, hangup, decline
    payload = data.get("payload") or {}
    call_mode = data.get("call_mode") or "video"  # video | audio

    if not target_id or not signal_type:
        return jsonify({"status": "error", "message": "target_id and signal_type required"}), 400

    publish_to_user(int(target_id), "call_signal", {
        "from_id": user["user_id"],
        "from_name": user["name"],
        "from_avatar": user.get("avatar_url") or "",
        "signal_type": signal_type,
        "call_mode": call_mode,
        "payload": payload,
    })
    return jsonify({"status": "success"})


# ---------------- REAL-TIME VIDEO WALL ----------------
@realtime_bp.route("/video-wall", methods=["GET"])
def list_video_wall():
    user = get_current_user()
    uid = user["user_id"] if user else None
    dest = (request.args.get("destination") or "").strip()

    if dest and dest.lower() != "all":
        posts = fetch_all(
            "SELECT * FROM video_wall_posts WHERE LOWER(destination) LIKE LOWER(?) ORDER BY post_id DESC",
            (f"%{dest}%",),
        )
    else:
        posts = fetch_all("SELECT * FROM video_wall_posts ORDER BY post_id DESC")

    liked_ids = set()
    if uid:
        for r in fetch_all("SELECT post_id FROM video_wall_likes WHERE user_id = ?", (uid,)):
            liked_ids.add(r["post_id"])

    for p in posts:
        p["liked_by_me"] = p["post_id"] in liked_ids

    return jsonify({"status": "success", "posts": posts})


@realtime_bp.route("/video-wall", methods=["POST"])
def create_video_post():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to post on the Video Wall"}), 401

    video_url = ""
    poster_url = ""
    if request.content_type and "multipart/form-data" in request.content_type:
        destination = (request.form.get("destination") or "Manali").strip()
        vibe = (request.form.get("vibe") or "mountain").strip()
        caption = (request.form.get("caption") or "").strip()
        poster_url = (request.form.get("poster_url") or "").strip()
        file = request.files.get("video")
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1].lower() or ".webm"
            if ext not in (".mp4", ".webm", ".mov", ".m4v", ".ogg"):
                ext = ".webm"
            fname = f"reel_{uuid.uuid4().hex[:10]}{ext}"
            file.save(os.path.join(UPLOAD_DIR, fname))
            video_url = f"/api/media/{fname}"
    else:
        data = request.get_json(silent=True) or {}
        destination = (data.get("destination") or "Manali").strip()
        vibe = (data.get("vibe") or "mountain").strip()
        caption = (data.get("caption") or "").strip()
        video_url = (data.get("video_url") or "").strip()
        poster_url = (data.get("poster_url") or "").strip()

    if not caption:
        return jsonify({"status": "error", "message": "Please add a caption for your travel moment"}), 400

    if not poster_url:
        dest_row = fetch_one("SELECT image_url FROM destinations WHERE LOWER(name) = LOWER(?)", (destination,))
        poster_url = dest_row["image_url"] if dest_row else "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=75"

    pid = execute_query(
        """
        INSERT INTO video_wall_posts (user_id, author_name, author_avatar, destination, vibe, caption, video_url, poster_url, likes_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        """,
        (
            user["user_id"],
            user["name"],
            user.get("avatar_url") or "https://i.pravatar.cc/200?img=20",
            destination,
            vibe,
            caption,
            video_url,
            poster_url,
        ),
    )
    post = fetch_one("SELECT * FROM video_wall_posts WHERE post_id = ?", (pid,))
    post["liked_by_me"] = False
    publish_global("video_wall_post", post)
    return jsonify({"status": "success", "post": post}), 201


@realtime_bp.route("/video-wall/<int:post_id>/like", methods=["POST"])
def toggle_video_like(post_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to like videos"}), 401

    existing = fetch_one(
        "SELECT 1 FROM video_wall_likes WHERE post_id = ? AND user_id = ?",
        (post_id, user["user_id"]),
    )
    if existing:
        execute_query("DELETE FROM video_wall_likes WHERE post_id = ? AND user_id = ?", (post_id, user["user_id"]))
        execute_query("UPDATE video_wall_posts SET likes_count = MAX(0, likes_count - 1) WHERE post_id = ?", (post_id,))
        liked = False
    else:
        execute_query("INSERT INTO video_wall_likes (post_id, user_id) VALUES (?, ?)", (post_id, user["user_id"]))
        execute_query("UPDATE video_wall_posts SET likes_count = likes_count + 1 WHERE post_id = ?", (post_id,))
        liked = True

    row = fetch_one("SELECT likes_count FROM video_wall_posts WHERE post_id = ?", (post_id,))
    likes_count = row["likes_count"] if row else 0
    publish_global("video_wall_like", {"post_id": post_id, "likes_count": likes_count})
    return jsonify({"status": "success", "liked": liked, "likes_count": likes_count})


@realtime_bp.route("/media/<path:filename>", methods=["GET"])
def serve_media(filename):
    return send_from_directory(UPLOAD_DIR, filename)
