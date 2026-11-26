import uuid
from flask import Blueprint, request, jsonify
from backend.database import fetch_one, fetch_all, execute_query
from backend.routes.auth import get_current_user

booking_bp = Blueprint("bookings", __name__)


@booking_bp.route("/bookings", methods=["POST"])
def create_booking():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to confirm a booking"}), 401

    data = request.get_json(silent=True) or {}
    item = data.get("item") or {}
    item_name = item.get("name") or data.get("item_name")
    item_id = str(item.get("id") or data.get("option_id") or "custom")
    item_meta = item.get("meta") or ""
    booking_type = (data.get("type") or "activity").lower()
    dest_name = (data.get("dest") or data.get("destination") or item.get("destination") or "").strip()
    travel_date = (data.get("date") or data.get("travel_date") or "").strip()
    travellers = int(data.get("qty") or data.get("travellers") or 1)
    total_price = float(data.get("total") or item.get("price", 0) * travellers)
    payment_method = data.get("method") or "UPI"

    if not item_name or not travel_date:
        return jsonify({"status": "error", "message": "Item name and travel date are required"}), 400

    # Normalize booking_type
    type_map = {
        "hotels": "hotel",
        "hotel": "hotel",
        "flights": "flight",
        "flight": "flight",
        "trains": "train",
        "train": "train",
        "buses": "bus",
        "bus": "bus",
        "transport": "transport",
        "restaurants": "restaurant",
        "restaurant": "restaurant",
        "activities": "activity",
        "activity": "activity",
    }
    norm_type = type_map.get(booking_type, "activity")
    payment_status = "Due on arrival" if payment_method == "Pay at property" else "Paid"

    # Link to latest upcoming itinerary if one exists
    itin = fetch_one(
        "SELECT itinerary_id FROM itineraries WHERE user_id = ? AND status = 'Upcoming' ORDER BY created_at DESC LIMIT 1",
        (user["user_id"],),
    )
    itin_id = itin["itinerary_id"] if itin else None

    ref = "WF-" + uuid.uuid4().hex[:6].upper()
    bid = execute_query(
        """
        INSERT INTO bookings (
            booking_ref, user_id, itinerary_id, destination_name,
            booking_type, item_id, item_name, item_meta,
            travel_date, travellers, total_price, payment_method, payment_status, booking_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
        """,
        (
            ref, user["user_id"], itin_id, dest_name,
            norm_type, item_id, item_name, item_meta,
            travel_date, travellers, total_price, payment_method, payment_status
        ),
    )

    # Also log into trip_expenses for that destination so Budget Guardian stays in sync
    if dest_name:
        exp_cat = "Stay" if norm_type == "hotel" else "Transport" if norm_type in ("flight", "train", "bus", "transport") else "Food" if norm_type == "restaurant" else "Activities"
        execute_query(
            """
            INSERT INTO trip_expenses (itinerary_id, user_id, destination_name, category, estimated_amount, actual_amount, day_number, note, expense_date)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            """,
            (itin_id, user["user_id"], dest_name, exp_cat, total_price, total_price, f"Booking: {item_name}", travel_date),
        )

    return jsonify({
        "status": "Confirmed",
        "booking_id": bid,
        "ref": ref,
        "message": "Booking saved to your trips!",
    }), 201


@booking_bp.route("/bookings", methods=["GET"])
def list_bookings():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401
    rows = fetch_all("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC", (user["user_id"],))
    return jsonify({"status": "success", "bookings": rows})
