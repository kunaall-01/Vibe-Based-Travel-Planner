import json
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user
from backend.routes.realtime import publish_to_user, publish_global

connect_bp = Blueprint("connect", __name__)


@connect_bp.route("/connect", methods=["GET"])
def get_connect_data():
    user = get_current_user()
    uid = user["user_id"] if user else None

    buddies = fetch_all("""
        SELECT u.user_id as id, u.full_name as name, u.city as place, u.bio,
               u.avatar_url as img, tbp.interests, tbp.preferred_vibe
        FROM travel_buddy_profiles tbp
        JOIN users u ON tbp.user_id = u.user_id
        WHERE u.role = 'traveler' AND tbp.is_open_to_connect = 1
        ORDER BY u.user_id ASC
    """)
    for b in buddies:
        b["tags"] = [t.strip() for t in (b.pop("interests", "") or "").split(",") if t.strip()][:4]

    # Also include newly signed-up travelers who aren't in travel_buddy_profiles yet
    extra_travelers = fetch_all("""
        SELECT u.user_id as id, u.full_name as name, COALESCE(NULLIF(u.city,''), 'India') as place,
               COALESCE(NULLIF(u.bio,''), 'Wayfarer traveler open to exploring together.') as bio,
               COALESCE(NULLIF(u.avatar_url,''), 'https://i.pravatar.cc/200?img=20') as img,
               u.favorite_vibes
        FROM users u
        WHERE u.role = 'traveler'
          AND u.user_id NOT IN (SELECT user_id FROM travel_buddy_profiles)
        ORDER BY u.user_id DESC
    """)
    for et in extra_travelers:
        tags = []
        try:
            tags = json.loads(et.pop("favorite_vibes") or "[]")
        except Exception:
            tags = []
        et["tags"] = tags if tags else ["Traveler", "Open to Connect"]
        buddies.append(et)

    locals_ = fetch_all("""
        SELECT u.user_id as id, u.full_name as name,
               COALESCE(NULLIF(lc.city,''), NULLIF(u.city,''), 'India') as place,
               COALESCE(NULLIF(lc.bio,''), u.bio) as bio,
               COALESCE(NULLIF(lc.avatar_url,''), NULLIF(u.avatar_url,''), 'https://i.pravatar.cc/200?img=32') as img,
               lc.community_name, lc.specialty, lc.languages, lc.availability, lc.offer_type,
               COALESCE(lc.verified, 1) as verified, u.favorite_vibes
        FROM users u
        LEFT JOIN local_communities lc ON lc.user_id = u.user_id
        WHERE u.role = 'local_guide'
        ORDER BY u.user_id DESC
    """)
    for l in locals_:
        custom_tags = []
        try:
            parsed = json.loads(l.pop("favorite_vibes") or "[]")
            if isinstance(parsed, list) and parsed:
                custom_tags = parsed
        except Exception:
            pass
        tags = custom_tags or ([l.get("specialty")] if l.get("specialty") else [])
        if l.get("offer_type") and l["offer_type"] not in tags:
            tags.append(l["offer_type"])
        l["tags"] = [t for t in tags if t][:4] or ["Local Guide", l.get("place") or "India"]

    groups = fetch_all("""
        SELECT ga.group_activity_id as id, ga.title as name,
               COALESCE(NULLIF(ga.place_label, ''), d.name || ' · ' || ga.activity_date) as place,
               ga.description as raw_bio,
               COALESCE(NULLIF(ga.image_url, ''), d.image_url) as img,
               ga.tags as raw_tags,
               ga.max_participants,
               (SELECT COUNT(*) FROM group_activity_participants WHERE group_activity_id = ga.group_activity_id) as joined
        FROM group_activities ga
        JOIN destinations d ON ga.destination_id = d.destination_id
        ORDER BY ga.group_activity_id ASC
    """)
    for g in groups:
        g["bio"] = g.pop("raw_bio") or ""
        g["spots_text"] = f"{g['joined']} of {g['max_participants']} spots taken"
        g["tags"] = [t.strip() for t in (g.pop("raw_tags", "") or "").split(",") if t.strip()][:4]
        g.pop("max_participants", None)
        g.pop("joined", None)

    requested = {}
    connections = {}
    incoming = []
    outgoing = []

    if uid:
        reqs = fetch_all("""
            SELECT cr.*, s.full_name as sender_name, s.avatar_url as sender_img, s.city as sender_city,
                   r.full_name as receiver_name, r.avatar_url as receiver_img, r.city as receiver_city
            FROM connection_requests cr
            JOIN users s ON cr.sender_id = s.user_id
            JOIN users r ON cr.receiver_id = r.user_id
            WHERE cr.sender_id = ? OR cr.receiver_id = ?
            ORDER BY cr.request_id DESC
        """, (uid, uid))

        for r in reqs:
            other_id = r["receiver_id"] if r["sender_id"] == uid else r["sender_id"]
            if r["status"] == "Accepted":
                connections[other_id] = True
            if r["sender_id"] == uid:
                requested[f"Buddies-{r['receiver_id']}"] = r["status"]
                requested[f"Locals-{r['receiver_id']}"] = r["status"]
                outgoing.append(r)
            else:
                incoming.append(r)

        joined_groups = fetch_all("SELECT group_activity_id FROM group_activity_participants WHERE user_id = ?", (uid,))
        for jg in joined_groups:
            requested[f"Groups-{jg['group_activity_id']}"] = "Joined"

    return jsonify({
        "Buddies": buddies,
        "Locals": locals_,
        "Groups": groups,
        "requested": requested,
        "connections": connections,
        "incoming_requests": incoming,
        "outgoing_requests": outgoing,
    })


@connect_bp.route("/connect/request", methods=["POST"])
def send_request():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to connect"}), 401

    data = request.get_json(silent=True) or {}
    target_id = data.get("id")
    tab = data.get("tab", "Buddies")
    message = (data.get("message") or "Hey! Would love to connect for this trip.").strip()
    destination = (data.get("destination") or "").strip()
    preferred_date = (data.get("preferred_date") or "").strip()
    request_type = "local" if tab == "Locals" or data.get("request_type") == "local" else "buddy"

    if not target_id:
        return jsonify({"status": "error", "message": "Target ID is required"}), 400

    uid = user["user_id"]
    if tab == "Groups":
        existing = fetch_one(
            "SELECT 1 FROM group_activity_participants WHERE group_activity_id = ? AND user_id = ?",
            (target_id, uid),
        )
        if existing:
            execute_query("DELETE FROM group_activity_participants WHERE group_activity_id = ? AND user_id = ?", (target_id, uid))
            return jsonify({"status": "success", "active": False, "state": None, "message": "Left group activity"})
        else:
            execute_query("INSERT OR IGNORE INTO group_activity_participants (group_activity_id, user_id) VALUES (?, ?)", (target_id, uid))
            return jsonify({"status": "success", "active": True, "state": "Joined", "message": "Joined group activity"})

    target_int = int(target_id)
    if target_int == uid:
        return jsonify({"status": "error", "message": "You cannot send a request to yourself"}), 400

    existing = fetch_one(
        "SELECT request_id, status FROM connection_requests WHERE sender_id = ? AND receiver_id = ?",
        (uid, target_int),
    )
    if existing and not data.get("force_update"):
        execute_query("DELETE FROM connection_requests WHERE request_id = ?", (existing["request_id"],))
        return jsonify({"status": "success", "active": False, "state": None, "message": "Request withdrawn"})

    if existing:
        execute_query(
            "UPDATE connection_requests SET status = 'Pending', message = ?, request_type = ?, destination = ?, preferred_date = ? WHERE request_id = ?",
            (message, request_type, destination, preferred_date, existing["request_id"]),
        )
        req_id = existing["request_id"]
    else:
        req_id = execute_query(
            """
            INSERT INTO connection_requests (sender_id, receiver_id, status, message, request_type, destination, preferred_date)
            VALUES (?, ?, 'Pending', ?, ?, ?, ?)
            """,
            (uid, target_int, message, request_type, destination, preferred_date),
        )

    req_row = fetch_one("""
        SELECT cr.*, s.full_name as sender_name, s.avatar_url as sender_img, s.city as sender_city
        FROM connection_requests cr
        JOIN users s ON cr.sender_id = s.user_id
        WHERE cr.request_id = ?
    """, (req_id,))
    publish_to_user(target_int, "connection_request", req_row)

    return jsonify({
        "status": "success",
        "active": True,
        "state": "Pending",
        "request": req_row,
        "message": "Local request sent!" if request_type == "local" else "Connection request sent!",
    })


@connect_bp.route("/connect/request/<int:req_id>", methods=["PATCH"])
def respond_to_request(req_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    decision = data.get("status")
    if decision not in ("Accepted", "Rejected"):
        return jsonify({"status": "error", "message": "Status must be Accepted or Rejected"}), 400

    req_row = fetch_one("SELECT * FROM connection_requests WHERE request_id = ? AND receiver_id = ?", (req_id, user["user_id"]))
    if not req_row:
        return jsonify({"status": "error", "message": "Request not found"}), 404

    execute_query("UPDATE connection_requests SET status = ? WHERE request_id = ?", (decision, req_id))
    publish_to_user(req_row["sender_id"], "request_response", {
        "request_id": req_id,
        "status": decision,
        "responder_id": user["user_id"],
        "responder_name": user["name"],
    })
    return jsonify({"status": "success", "message": f"Request {decision.lower()}"})


@connect_bp.route("/connect/local-register", methods=["POST"])
def register_local_community():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to register as a local community"}), 401

    data = request.get_json(silent=True) or {}
    community_name = (data.get("community_name") or "").strip()
    city = (data.get("city") or "").strip()
    specialty = (data.get("specialty") or "").strip()
    languages = (data.get("languages") or "English, Hindi").strip()
    availability = (data.get("availability") or "Weekends & Mornings").strip()
    offer_type = (data.get("offer_type") or "Free Community Meetup").strip()
    bio = (data.get("bio") or "").strip()
    avatar_url = (data.get("avatar_url") or user.get("avatar_url") or "https://i.pravatar.cc/200?img=32").strip()

    if len(community_name) < 2 or not city or not specialty:
        return jsonify({"status": "error", "message": "Community name, city, and specialty are required"}), 400

    uid = user["user_id"]
    execute_query(
        "UPDATE users SET role = 'local_guide', city = ?, bio = ?, avatar_url = ? WHERE user_id = ?",
        (city, bio, avatar_url, uid),
    )

    existing = fetch_one("SELECT community_id FROM local_communities WHERE user_id = ?", (uid,))
    if existing:
        execute_query(
            """
            UPDATE local_communities
            SET community_name = ?, city = ?, specialty = ?, languages = ?,
                availability = ?, offer_type = ?, bio = ?, avatar_url = ?
            WHERE user_id = ?
            """,
            (community_name, city, specialty, languages, availability, offer_type, bio, avatar_url, uid),
        )
    else:
        execute_query(
            """
            INSERT INTO local_communities (user_id, community_name, city, specialty, languages, availability, offer_type, bio, avatar_url, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (uid, community_name, city, specialty, languages, availability, offer_type, bio, avatar_url),
        )

    profile = fetch_one("SELECT * FROM local_communities WHERE user_id = ?", (uid,))
    publish_global("local_community_registered", profile)
    return jsonify({
        "status": "success",
        "message": "Registered as a Local Community! Travellers can now discover and connect with you.",
        "community": profile,
    }), 201


@connect_bp.route("/connect/local-dashboard", methods=["GET"])
def local_host_dashboard():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    uid = user["user_id"]
    community = fetch_one("SELECT * FROM local_communities WHERE user_id = ?", (uid,))
    requests_in = fetch_all("""
        SELECT cr.*, s.full_name as traveller_name, s.email as traveller_email,
               s.city as traveller_city, s.avatar_url as traveller_img
        FROM connection_requests cr
        JOIN users s ON cr.sender_id = s.user_id
        WHERE cr.receiver_id = ?
        ORDER BY cr.request_id DESC
    """, (uid,))
    return jsonify({"status": "success", "community": community, "requests": requests_in})


@connect_bp.route("/connect/<category>/<int:item_id>", methods=["PUT"])
def update_connect_item(category, item_id):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    place = (data.get("place") or "").strip()
    bio = (data.get("bio") or "").strip()
    img = (data.get("img") or "").strip()
    tags = data.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    if not name:
        return jsonify({"status": "error", "message": "Name is required"}), 400

    if category == "Buddies":
        execute_query(
            "UPDATE users SET full_name = ?, city = ?, bio = ?, avatar_url = ? WHERE user_id = ?",
            (name, place, bio, img, item_id),
        )
        interests_str = ", ".join(tags)
        existing_prof = fetch_one("SELECT profile_id FROM travel_buddy_profiles WHERE user_id = ?", (item_id,))
        if existing_prof:
            execute_query("UPDATE travel_buddy_profiles SET interests = ? WHERE user_id = ?", (interests_str, item_id))
        else:
            execute_query("INSERT INTO travel_buddy_profiles (user_id, interests) VALUES (?, ?)", (item_id, interests_str))
    elif category == "Locals":
        execute_query(
            "UPDATE users SET full_name = ?, city = ?, bio = ?, avatar_url = ?, favorite_vibes = ? WHERE user_id = ?",
            (name, place, bio, img, json.dumps(tags), item_id),
        )
        lc = fetch_one("SELECT community_id FROM local_communities WHERE user_id = ?", (item_id,))
        if lc:
            execute_query("UPDATE local_communities SET city = ?, bio = ?, avatar_url = ? WHERE user_id = ?", (place, bio, img, item_id))
    elif category == "Groups":
        execute_query(
            "UPDATE group_activities SET title = ?, place_label = ?, description = ?, image_url = ?, tags = ? WHERE group_activity_id = ?",
            (name, place, bio, img, ", ".join(tags), item_id),
        )
    else:
        return jsonify({"status": "error", "message": "Invalid category"}), 400

    return jsonify({"status": "success", "message": "Updated in database"})


@connect_bp.route("/connect/<category>", methods=["POST"])
def create_connect_item(category):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    place = (data.get("place") or "").strip()
    bio = (data.get("bio") or "").strip()
    img = (data.get("img") or "").strip() or "https://i.pravatar.cc/200?img=20"
    tags = data.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    if not name:
        return jsonify({"status": "error", "message": "Name is required"}), 400

    user = get_current_user()
    host_id = user["user_id"] if user else 1

    if category in ("Buddies", "Locals"):
        role = "traveler" if category == "Buddies" else "local_guide"
        email = f"{name.lower().replace(' ', '.')}.{uuid.uuid4().hex[:4]}@community.wayfarer"
        uid = execute_query(
            "INSERT INTO users (full_name, email, password_hash, city, role, bio, avatar_url, favorite_vibes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (name, email, generate_password_hash("community", method="pbkdf2:sha256"), place, role, bio, img, json.dumps(tags)),
        )
        if category == "Buddies":
            execute_query(
                "INSERT INTO travel_buddy_profiles (user_id, interests, is_open_to_connect) VALUES (?, ?, 1)",
                (uid, ", ".join(tags)),
            )
        else:
            execute_query(
                "INSERT INTO local_communities (user_id, community_name, city, specialty, bio, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
                (uid, name, place or "India", tags[0] if tags else "Local Guide", bio, img),
            )
        return jsonify({"status": "success", "id": uid}), 201
    elif category == "Groups":
        dest = fetch_one("SELECT destination_id FROM destinations LIMIT 1")
        dest_id = dest["destination_id"] if dest else 1
        gid = execute_query(
            "INSERT INTO group_activities (destination_id, host_user_id, title, place_label, description, activity_date, time_slot, max_participants, tags, image_url) VALUES (?, ?, ?, ?, ?, ?, 'Morning', 10, ?, ?)",
            (dest_id, host_id, name, place or "India · Upcoming", bio, "2026-12-22", ", ".join(tags), img),
        )
        return jsonify({"status": "success", "id": gid}), 201

    return jsonify({"status": "error", "message": "Invalid category"}), 400
