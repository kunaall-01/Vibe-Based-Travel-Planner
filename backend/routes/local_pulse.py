from flask import Blueprint, request, jsonify
from backend.database import fetch_all

local_pulse_bp = Blueprint("local_pulse", __name__)


@local_pulse_bp.route("/local-pulse", methods=["GET"])
def get_local_pulse():
    """Return crowd data specifically for the requested destination."""
    dest = (request.args.get("destination") or "").strip()

    if not dest:
        return jsonify({"status": "error", "message": "Please select a destination first"}), 400

    rows = fetch_all("""
        SELECT c.crowd_id as id, c.place_name as place, c.crowd_level as level,
               c.crowd_percentage as pct, c.quiet_times as best, c.suggestion,
               COALESCE(c.latitude, d.latitude) as latitude,
               COALESCE(c.longitude, d.longitude) as longitude
        FROM crowd_info c
        JOIN destinations d ON c.destination_id = d.destination_id
        WHERE LOWER(d.slug) = LOWER(?) OR LOWER(d.name) = LOWER(?)
        ORDER BY c.crowd_percentage DESC
    """, (dest, dest))

    if rows:
        return jsonify({"destination": dest.title(), "places": rows})

    # For custom destinations not in the pre-seeded list, generate localized crowd estimates
    pretty = dest.title()
    custom_places = [
        {"id": 1, "place": f"{pretty} Central Market & Bazaar", "level": "High", "pct": 82, "best": "Before 10:30 AM", "suggestion": "Explore early morning before shops get crowded"},
        {"id": 2, "place": f"{pretty} Main Landmark / Heritage Square", "level": "Moderate", "pct": 54, "best": "8:00 AM - 10:00 AM", "suggestion": "Weekday mornings offer smooth entry"},
        {"id": 3, "place": f"{pretty} Waterfront / Viewpoint Trail", "level": "Low", "pct": 26, "best": "Sunset or early dawn", "suggestion": "Peaceful spot away from the central rush"},
        {"id": 4, "place": f"{pretty} Old Town Cafés & Lanes", "level": "Low", "pct": 32, "best": "10:00 AM - 1:00 PM", "suggestion": "Calmest window for a slow walk"},
    ]
    return jsonify({"destination": pretty, "places": custom_places})


@local_pulse_bp.route("/crowd", methods=["GET"])
def get_crowd_information():
    destination = request.args.get("destination")
    if not destination:
        return jsonify({"status": "error", "message": "Please provide a destination"}), 400

    rows = fetch_all("""
        SELECT c.place_name as place, c.crowd_level, c.quiet_times, c.suggestion
        FROM crowd_info c
        JOIN destinations d ON c.destination_id = d.destination_id
        WHERE LOWER(d.name) = LOWER(?)
    """, (destination,))

    return jsonify({
        "status": "success",
        "destination": destination,
        "crowd_information": rows,
        "data_type": "Sample estimates - not real-time crowd data",
    })
