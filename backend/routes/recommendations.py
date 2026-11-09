
from flask import Blueprint, request, jsonify

recommendation_bp = Blueprint("recommendations", __name__)

@recommendation_bp.route("/recommendations", methods=["POST"])
def get_recommendations():

    data = request.get_json(silent=True) or {}

    destination = data.get("destination")
    vibe = data.get("vibe")
    budget = data.get("budget")

    if not destination or not vibe or budget is None:
        return jsonify({
            "status": "error",
            "message": "Please provide destination, vibe and budget"
        }), 400

    activities = {
        "Peaceful": ["Lake Visit", "Garden Visit", "Nature Walk"],
        "Adventurous": ["Trekking", "Hiking", "Camping"],
        "Party": ["Nightlife", "Live Music", "Club Visit"],
        "Foodie": ["Local Food Tour", "Cafe Visit", "Food Walk"]
    }

    recommendations = activities.get(vibe)

    if recommendations is None:
        return jsonify({
            "status": "error",
            "message": "Invalid travel vibe"
        }), 400

    return jsonify({
        "status": "success",
        "destination": destination,
        "vibe": vibe,
        "budget": budget,
        "recommendations": recommendations
    })
