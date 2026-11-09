from flask import Blueprint, request, jsonify

itinerary_bp = Blueprint("itinerary", __name__)

@itinerary_bp.route("/itinerary", methods=["POST"])
def generate_itinerary():

    data = request.get_json(silent=True) or {}

    destination = data.get("destination")
    days = data.get("days")
    vibe = data.get("vibe")

    if not destination or not days or not vibe:
        return jsonify({
            "status": "error",
            "message": "Please provide destination, days and vibe"
        }), 400

    try:
        days = int(days)
        if days < 1 or days > 30:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Days must be between 1 and 30"
        }), 400

    activities = {
        "Peaceful": ["Lake Visit", "Garden Visit", "Nature Walk"],
        "Adventurous": ["Trekking", "Hiking", "Camping"],
        "Party": ["Nightlife", "Live Music", "Club Visit"],
        "Foodie": ["Local Food Tour", "Cafe Visit", "Food Walk"]
    }

    if vibe not in activities:
        return jsonify({
            "status": "error",
            "message": "Invalid travel vibe"
        }), 400

    itinerary = []

    for day in range(1, days + 1):
        itinerary.append({
            "day": day,
            "destination": destination,
            "morning": activities[vibe][0],
            "afternoon": activities[vibe][1],
            "evening": activities[vibe][2]
        })

    return jsonify({
        "status": "success",
        "itinerary": itinerary
    })