from flask import Blueprint, request, jsonify
from backend.routes.search import travel_options
import uuid
from datetime import datetime

booking_bp = Blueprint("bookings", __name__)

# Temporary storage for demo bookings
bookings = []


@booking_bp.route("/bookings", methods=["POST"])
def create_booking():

    data = request.get_json(silent=True) or {}

    customer_name = data.get("customer_name")
    option_id = data.get("option_id")
    travel_date = data.get("travel_date")
    travellers = data.get("travellers", 1)

    if not customer_name or option_id is None or not travel_date:
        return jsonify({
            "status": "error",
            "message": "Please provide customer_name, option_id and travel_date"
        }), 400

    try:
        option_id = int(option_id)
        travellers = int(travellers)

        if travellers < 1 or travellers > 20:
            raise ValueError

        datetime.strptime(travel_date, "%Y-%m-%d")

    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Invalid option ID, travel date or number of travellers"
        }), 400

    selected_option = next(
        (item for item in travel_options if item["id"] == option_id),
        None
    )

    if selected_option is None:
        return jsonify({
            "status": "error",
            "message": "Selected travel option not found"
        }), 404

    booking = {
        "booking_id": "BK-" + uuid.uuid4().hex[:8].upper(),
        "customer_name": customer_name,
        "option": selected_option,
        "travel_date": travel_date,
        "travellers": travellers,
        "total_price": selected_option["price"] * travellers,
        "booking_status": "Confirmed",
        "booking_type": selected_option["category"]
    }

    bookings.append(booking)

    return jsonify({
        "status": "success",
        "message": "Demo booking created successfully!",
        "booking": booking
    }), 201


@booking_bp.route("/bookings/<booking_id>", methods=["GET"])
def get_booking(booking_id):

    booking = next(
        (item for item in bookings if item["booking_id"] == booking_id),
        None
    )

    if booking is None:
        return jsonify({
            "status": "error",
            "message": "Booking not found"
        }), 404

    return jsonify({
        "status": "success",
        "booking": booking
    })

@booking_bp.route("/my-trips", methods=["GET"])
def get_my_trips():

    customer_name = request.args.get("customer_name")

    if not customer_name:
        return jsonify({
            "status": "error",
            "message": "Please provide customer_name"
        }), 400

    user_bookings = [
        booking for booking in bookings
        if booking["customer_name"].lower() == customer_name.lower()
    ]

    return jsonify({
        "status": "success",
        "customer_name": customer_name,
        "total_trips": len(user_bookings),
        "trips": user_bookings
    })