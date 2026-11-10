from flask import Blueprint, request, jsonify

replanner_bp = Blueprint("replanner", __name__)


# Sample alternative activities for different disruptions
alternatives = {
    "rain": [
        {"activity": "Visit a local museum", "cost": 200, "hours": 2},
        {"activity": "Explore a local cafe", "cost": 400, "hours": 1},
        {"activity": "Indoor games and entertainment", "cost": 300, "hours": 2}
    ],

    "closure": [
        {"activity": "Explore a nearby market", "cost": 200, "hours": 2},
        {"activity": "Visit a nearby garden", "cost": 100, "hours": 1},
        {"activity": "Explore local food spots", "cost": 500, "hours": 2}
    ],

    "transport_delay": [
        {"activity": "Visit a nearby cafe", "cost": 300, "hours": 1},
        {"activity": "Explore the local market", "cost": 200, "hours": 2},
        {"activity": "Take a short nature walk", "cost": 100, "hours": 1}
    ],

    "unavailable": [
        {"activity": "Try a nearby sightseeing spot", "cost": 300, "hours": 2},
        {"activity": "Explore local attractions", "cost": 200, "hours": 2},
        {"activity": "Enjoy a local food tour", "cost": 500, "hours": 2}
    ]
}


@replanner_bp.route("/replan", methods=["POST"])
def replan_trip():

    data = request.get_json(silent=True) or {}

    destination = data.get("destination")
    vibe = data.get("vibe")
    disruption = data.get("disruption")
    remaining_budget = data.get("remaining_budget")
    available_hours = data.get("available_hours", 8)

    if not destination or not vibe or not disruption or remaining_budget is None:
        return jsonify({
            "status": "error",
            "message": "Please provide destination, vibe, disruption and remaining_budget"
        }), 400

    try:
        remaining_budget = float(remaining_budget)
        available_hours = float(available_hours)

        if remaining_budget < 0 or available_hours <= 0:
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Budget must be non-negative and available hours must be positive"
        }), 400

    disruption = disruption.lower().replace(" ", "_")

    if disruption not in alternatives:
        return jsonify({
            "status": "error",
            "message": "Invalid disruption. Use rain, closure, transport_delay or unavailable"
        }), 400

    suggestions = []

    for option in alternatives[disruption]:
        if option["cost"] <= remaining_budget and option["hours"] <= available_hours:
            suggestions.append(option)

    return jsonify({
        "status": "success",
        "destination": destination,
        "vibe": vibe,
        "disruption": disruption,
        "suggested_alternatives": suggestions,
        "total_suggestions": len(suggestions),
        "message": "Alternative plan generated successfully" if suggestions else "No alternatives fit the current budget and available time",
        "booking_note": "Existing confirmed bookings are not changed automatically."
    })