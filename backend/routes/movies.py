import json
import uuid
from flask import Blueprint, request, jsonify
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user
from backend.services.movie_generator import (
    generate_movie_identity,
    serialize_movie_row,
    serialize_memory_row,
)

movies_bp = Blueprint("movies", __name__)


def _save_movie_for_itinerary(itinerary_id, user_id, movie_payload, trip_status="Upcoming"):
    slug_base = (movie_payload.get("destination") or "trip").lower().replace(" ", "-")
    slug = f"{slug_base}-{uuid.uuid4().hex[:6]}"

    existing = fetch_one("SELECT movie_id, share_slug FROM trip_movies WHERE itinerary_id = ?", (itinerary_id,))
    if existing:
        execute_query(
            """
            UPDATE trip_movies
            SET movie_title = ?, tagline = ?, synopsis = ?, genre = ?, mood = ?,
                soundtrack_mood = ?, color_palette = ?, cover_image = ?,
                story_arc = ?, chapter_titles = ?, trip_status = ?
            WHERE itinerary_id = ?
            """,
            (
                movie_payload["movie_title"],
                movie_payload["tagline"],
                movie_payload["synopsis"],
                movie_payload["genre"],
                movie_payload["mood"],
                json.dumps(movie_payload["soundtrack_mood"]),
                json.dumps(movie_payload["color_palette"]),
                movie_payload["cover_image"],
                json.dumps(movie_payload["story_arc"]),
                json.dumps(movie_payload["chapter_titles"]),
                trip_status,
                itinerary_id,
            ),
        )
        return existing["movie_id"], existing["share_slug"]

    mid = execute_query(
        """
        INSERT INTO trip_movies (
            itinerary_id, user_id, share_slug, movie_title, tagline, synopsis,
            genre, mood, soundtrack_mood, color_palette, cover_image,
            story_arc, chapter_titles, trip_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            itinerary_id,
            user_id,
            slug,
            movie_payload["movie_title"],
            movie_payload["tagline"],
            movie_payload["synopsis"],
            movie_payload["genre"],
            movie_payload["mood"],
            json.dumps(movie_payload["soundtrack_mood"]),
            json.dumps(movie_payload["color_palette"]),
            movie_payload["cover_image"],
            json.dumps(movie_payload["story_arc"]),
            json.dumps(movie_payload["chapter_titles"]),
            trip_status,
        ),
    )
    return mid, slug


@movies_bp.route("/movies/generate", methods=["POST"])
def generate_movie():
    data = request.get_json(silent=True) or {}
    movie = generate_movie_identity(
        destination=data.get("destination") or "Manali",
        vibe=data.get("vibe") or "mountain",
        days=data.get("days") or [],
        budget=data.get("budget") or 25000,
        img=data.get("img"),
        dates=data.get("dates"),
        style=data.get("style"),
    )
    return jsonify({"status": "success", "movie": movie})


@movies_bp.route("/movies/<int:itinerary_id>", methods=["GET"])
def get_movie_by_itinerary(itinerary_id):
    itin = fetch_one(
        """
        SELECT i.*, d.name AS destination_name, d.region AS destination_region, d.image_url AS destination_img
        FROM itineraries i
        JOIN destinations d ON i.destination_id = d.destination_id
        WHERE i.itinerary_id = ?
        """,
        (itinerary_id,),
    )
    if not itin:
        return jsonify({"status": "error", "message": "Trip not found"}), 404

    details = fetch_all(
        "SELECT * FROM itinerary_details WHERE itinerary_id = ? ORDER BY day_number ASC, scheduled_time ASC",
        (itinerary_id,),
    )
    days_map = {}
    for det in details:
        dn = det["day_number"]
        if dn not in days_map:
            days_map[dn] = {"day": dn, "title": det.get("day_title") or f"Day {dn}", "items": []}
        days_map[dn]["items"].append({"time": det.get("scheduled_time") or "09:00", "text": det["activity_title"]})
    days = list(days_map.values())

    movie_row = fetch_one("SELECT * FROM trip_movies WHERE itinerary_id = ?", (itinerary_id,))
    if not movie_row:
        generated = generate_movie_identity(
            destination=itin["destination_name"],
            vibe=itin["vibe"],
            days=days,
            budget=itin["budget"],
            img=itin.get("destination_img"),
            dates=f"{itin['start_date']} – {itin['end_date']}",
        )
        _save_movie_for_itinerary(itinerary_id, itin["user_id"], generated, itin["status"])
        movie_row = fetch_one("SELECT * FROM trip_movies WHERE itinerary_id = ?", (itinerary_id,))

    memory_row = fetch_one("SELECT * FROM trip_memories WHERE itinerary_id = ?", (itinerary_id,))

    return jsonify({
        "status": "success",
        "trip": {
            "itinerary_id": itin["itinerary_id"],
            "title": itin["title"],
            "destination": itin["destination_name"],
            "region": itin["destination_region"],
            "vibe": itin["vibe"],
            "start_date": itin["start_date"],
            "end_date": itin["end_date"],
            "total_days": itin["total_days"],
            "budget": itin["budget"],
            "status": itin["status"],
            "days": days,
        },
        "movie": serialize_movie_row(movie_row),
        "memory": serialize_memory_row(memory_row),
    })


@movies_bp.route("/movies/<int:itinerary_id>", methods=["PUT"])
def update_movie(itinerary_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    movie_row = fetch_one("SELECT * FROM trip_movies WHERE itinerary_id = ? AND user_id = ?", (itinerary_id, user["user_id"]))
    if not movie_row:
        return jsonify({"status": "error", "message": "Movie identity not found"}), 404

    data = request.get_json(silent=True) or {}
    execute_query(
        """
        UPDATE trip_movies
        SET movie_title = ?, tagline = ?, synopsis = ?, cover_image = ?
        WHERE itinerary_id = ? AND user_id = ?
        """,
        (
            (data.get("movie_title") or movie_row["movie_title"]).strip(),
            (data.get("tagline") or movie_row["tagline"]).strip(),
            (data.get("synopsis") or movie_row["synopsis"]).strip(),
            (data.get("cover_image") or movie_row["cover_image"]).strip(),
            itinerary_id,
            user["user_id"],
        ),
    )
    updated = fetch_one("SELECT * FROM trip_movies WHERE itinerary_id = ?", (itinerary_id,))
    return jsonify({"status": "success", "movie": serialize_movie_row(updated)})


@movies_bp.route("/movies/share/<share_slug>", methods=["GET"])
def get_shared_movie(share_slug):
    movie_row = fetch_one("SELECT * FROM trip_movies WHERE share_slug = ?", (share_slug,))
    if not movie_row:
        return jsonify({"status": "error", "message": "Movie story not found"}), 404

    itin = fetch_one(
        """
        SELECT i.*, d.name AS destination_name, d.region AS destination_region, u.full_name AS creator_name
        FROM itineraries i
        JOIN destinations d ON i.destination_id = d.destination_id
        JOIN users u ON i.user_id = u.user_id
        WHERE i.itinerary_id = ?
        """,
        (movie_row["itinerary_id"],),
    )
    memory_row = fetch_one("SELECT * FROM trip_memories WHERE itinerary_id = ?", (movie_row["itinerary_id"],))

    return jsonify({
        "status": "success",
        "trip": {
            "itinerary_id": itin["itinerary_id"],
            "title": itin["title"],
            "destination": itin["destination_name"],
            "region": itin["destination_region"],
            "vibe": itin["vibe"],
            "start_date": itin["start_date"],
            "end_date": itin["end_date"],
            "total_days": itin["total_days"],
            "budget": itin["budget"],
            "status": itin["status"],
            "creator_name": itin.get("creator_name") or "Wayfarer Traveller",
        } if itin else None,
        "movie": serialize_movie_row(movie_row),
        "memory": serialize_memory_row(memory_row),
    })


@movies_bp.route("/movies/<int:itinerary_id>/memory", methods=["GET", "POST"])
def trip_memory(itinerary_id):
    if request.method == "GET":
        row = fetch_one("SELECT * FROM trip_memories WHERE itinerary_id = ?", (itinerary_id,))
        return jsonify({"status": "success", "memory": serialize_memory_row(row)})

    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    itin = fetch_one("SELECT * FROM itineraries WHERE itinerary_id = ? AND user_id = ?", (itinerary_id, user["user_id"]))
    if not itin:
        return jsonify({"status": "error", "message": "Trip not found"}), 404

    movie_row = fetch_one("SELECT movie_id FROM trip_movies WHERE itinerary_id = ?", (itinerary_id,))
    movie_id = movie_row["movie_id"] if movie_row else None

    data = request.get_json(silent=True) or {}
    fav_dest = (data.get("favorite_destination") or "").strip()
    fav_act = (data.get("favorite_activity") or "").strip()
    caption = (data.get("personal_caption") or "").strip()
    storyline = (data.get("post_trip_storyline") or "").strip()
    rating = max(1, min(5, int(data.get("trip_rating") or 5)))
    photos = data.get("photos") or []
    photos_json = json.dumps(photos[:6])

    existing = fetch_one("SELECT memory_id FROM trip_memories WHERE itinerary_id = ?", (itinerary_id,))
    if existing:
        execute_query(
            """
            UPDATE trip_memories
            SET favorite_destination = ?, favorite_activity = ?, personal_caption = ?,
                post_trip_storyline = ?, trip_rating = ?, photos_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE itinerary_id = ?
            """,
            (fav_dest, fav_act, caption, storyline, rating, photos_json, itinerary_id),
        )
    else:
        execute_query(
            """
            INSERT INTO trip_memories (
                itinerary_id, movie_id, user_id, favorite_destination, favorite_activity,
                personal_caption, post_trip_storyline, trip_rating, photos_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (itinerary_id, movie_id, user["user_id"], fav_dest, fav_act, caption, storyline, rating, photos_json),
        )

    saved = fetch_one("SELECT * FROM trip_memories WHERE itinerary_id = ?", (itinerary_id,))
    return jsonify({"status": "success", "memory": serialize_memory_row(saved)})
