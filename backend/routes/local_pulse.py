
from flask import Blueprint, request, jsonify

local_pulse_bp = Blueprint("local_pulse", __name__)


# Sample crowd information for popular destinations
crowd_data = {
    "manali": [
        {
            "place": "Solang Valley",
            "crowd_level": "High",
            "quiet_times": ["8 AM - 10 AM"],
            "suggestion": "Visit early in the morning"
        },
        {
            "place": "Hadimba Temple",
            "crowd_level": "Moderate",
            "quiet_times": ["9 AM - 11 AM"],
            "suggestion": "Visit during the morning"
        },
        {
            "place": "Mall Road",
            "crowd_level": "High",
            "quiet_times": ["10 AM - 12 PM"],
            "suggestion": "Visit before the evening rush"
        }
    ],

    "udaipur": [
        {
            "place": "City Palace",
            "crowd_level": "High",
            "quiet_times": ["9 AM - 10 AM"],
            "suggestion": "Visit shortly after opening"
        },
        {
            "place": "Fateh Sagar Lake",
            "crowd_level": "Moderate",
            "quiet_times": ["7 AM - 9 AM"],
            "suggestion": "Enjoy an early morning visit"
        },
        {
            "place": "Saheliyon Ki Bari",
            "crowd_level": "Low",
            "quiet_times": ["8 AM - 11 AM"],
            "suggestion": "A good option for a quieter visit"
        }
    ]
}


@local_pulse_bp.route("/crowd", methods=["GET"])
def get_crowd_information():

    destination = request.args.get("destination")

    if not destination:
        return jsonify({
            "status": "error",
            "message": "Please provide a destination"
        }), 400

    destination_key = destination.lower().strip()

    if destination_key not in crowd_data:
        return jsonify({
            "status": "error",
            "message": "Crowd information is not available for this destination yet"
        }), 404

    return jsonify({
        "status": "success",
        "destination": destination,
        "crowd_information": crowd_data[destination_key],
        "data_type": "Sample estimates - not real-time crowd data"
    })
