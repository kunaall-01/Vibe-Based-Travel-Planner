from flask import Blueprint, request, jsonify
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user
from backend.services.movie_generator import (
    generate_movie_identity,
    serialize_movie_row,
    serialize_memory_row,
)
from backend.routes.movies import _save_movie_for_itinerary

trips_bp = Blueprint("trips", __name__)

DEFAULT_DEST_IMG = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70"


def _attach_movie_and_memory(itin_row):
    """Fetch (or lazily create) the movie identity + memory card for an itinerary."""
    itin_id = itin_row["itinerary_id"]
    details = fetch_all(
        "SELECT * FROM itinerary_details WHERE itinerary_id = ? ORDER BY day_number ASC, scheduled_time ASC",
        (itin_id,),
    )
    days_map = {}
    activities = []
    for det in details:
        dn = det["day_number"]
        if dn not in days_map:
            days_map[dn] = {"day": dn, "title": det.get("day_title") or f"Day {dn}", "items": []}
        days_map[dn]["items"].append({"time": det.get("scheduled_time") or "09:00", "text": det["activity_title"]})
        activities.append(det["activity_title"])
    days = list(days_map.values())

    movie_row = fetch_one("SELECT * FROM trip_movies WHERE itinerary_id = ?", (itin_id,))
    if not movie_row:
        generated = generate_movie_identity(
            destination=itin_row["destination_name"],
            vibe=itin_row["vibe"],
            days=days,
            budget=itin_row["budget"],
            img=itin_row.get("destination_img"),
            dates=f"{itin_row['start_date']} – {itin_row['end_date']}",
        )
        _save_movie_for_itinerary(itin_id, itin_row["user_id"], generated, itin_row["status"])
        movie_row = fetch_one("SELECT * FROM trip_movies WHERE itinerary_id = ?", (itin_id,))

    memory_row = fetch_one("SELECT * FROM trip_memories WHERE itinerary_id = ?", (itin_id,))
    return serialize_movie_row(movie_row), serialize_memory_row(memory_row), activities


@trips_bp.route("/trips", methods=["GET"])
def get_trips():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    uid = user["user_id"]

    upcoming_itin = fetch_one(
        """
        SELECT i.*, d.name AS destination_name, d.image_url AS destination_img, d.description AS destination_desc
        FROM itineraries i
        JOIN destinations d ON i.destination_id = d.destination_id
        WHERE i.user_id = ? AND i.status = 'Upcoming'
        ORDER BY i.created_at DESC
        LIMIT 1
        """,
        (uid,),
    )

    all_bookings = fetch_all(
        """
        SELECT *
        FROM bookings
        WHERE user_id = ? AND booking_status <> 'Cancelled'
        ORDER BY travel_date ASC, created_at ASC
        """,
        (uid,),
    )

    stays = []
    transport = []
    other_bookings = []

    for b in all_bookings:
        btype = (b.get("booking_type") or "").lower()
        entry = {
            "id": b["booking_id"],
            "name": b["item_name"],
            "place": b.get("destination_name") or btype.title(),
            "dates": b["travel_date"],
            "status": b["booking_status"],
            "ref": b["booking_ref"],
            "amount": b["total_price"],
            "method": b.get("payment_method") or "UPI",
            "paid": b.get("payment_status") or "Paid",
            "type": btype,
        }
        if btype in ("hotel", "hotels", "stay"):
            stays.append(entry)
        elif btype in ("transport", "flight", "flights", "train", "trains", "bus", "buses", "cab", "rental", "rentals"):
            entry["place"] = btype.rstrip("s").title()
            transport.append(entry)
        else:
            other_bookings.append(entry)

    past_rows = fetch_all(
        """
        SELECT i.*, d.name AS destination_name, d.image_url AS destination_img
        FROM itineraries i
        JOIN destinations d ON i.destination_id = d.destination_id
        WHERE i.user_id = ? AND i.status IN ('Completed', 'Cancelled')
        ORDER BY i.end_date DESC, i.created_at DESC
        """,
        (uid,),
    )

    past = []
    for p in past_rows:
        movie, memory, activities = _attach_movie_and_memory(p)
        past.append({
            "id": p["itinerary_id"],
            "title": p["title"],
            "destination": p["destination_name"],
            "vibe": p["vibe"],
            "year": (p["start_date"] or "")[:4],
            "dates": f"{p['start_date']} to {p['end_date']}",
            "status": p["status"],
            "img": p["destination_img"] or DEFAULT_DEST_IMG,
            "note": p.get("notes") or f"{p['total_days']} days · {p['vibe'].title()} vibe",
            "budget": p["budget"],
            "total_days": p["total_days"],
            "movie": movie,
            "memory": memory,
            "activities": activities,
        })

    upcoming = None
    if upcoming_itin or stays or transport or other_bookings:
        if upcoming_itin:
            title = upcoming_itin["title"]
            subtitle = upcoming_itin.get("notes") or upcoming_itin.get("destination_desc") or f"{upcoming_itin['total_days']}-day {upcoming_itin['vibe']} journey"
            start = upcoming_itin["start_date"]
            end = upcoming_itin["end_date"]
            img = upcoming_itin.get("destination_img") or DEFAULT_DEST_IMG
            budget = upcoming_itin["budget"]
            itin_id = upcoming_itin["itinerary_id"]
            dest_name = upcoming_itin["destination_name"]
            vibe = upcoming_itin["vibe"]
            total_days = upcoming_itin["total_days"]
            movie, memory, activities = _attach_movie_and_memory(upcoming_itin)
        else:
            first_b = (stays + transport + other_bookings)[0]
            dest_name = first_b.get("place") or "Your Trip"
            title = f"Trip to {dest_name}" if dest_name else "Your Planned Bookings"
            subtitle = "Built from your confirmed reservations"
            start = first_b["dates"]
            end = first_b["dates"]
            img = DEFAULT_DEST_IMG
            budget_row = fetch_one(
                "SELECT total_budget FROM user_budgets WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
                (uid,),
            )
            budget = budget_row["total_budget"] if budget_row else max(sum(x["amount"] for x in stays + transport + other_bookings), 25000)
            itin_id = None
            vibe = "heritage"
            total_days = 1
            movie = None
            memory = None
            activities = []

        upcoming = {
            "id": itin_id,
            "title": title,
            "destination": dest_name,
            "vibe": vibe,
            "total_days": total_days,
            "subtitle": subtitle,
            "start": start,
            "end": end,
            "img": img,
            "budget": budget,
            "stays": stays,
            "transport": transport,
            "activities": other_bookings,
            "itinerary_activities": activities,
            "movie": movie,
            "memory": memory,
        }

    return jsonify({
        "upcoming": upcoming,
        "past": past,
    })


@trips_bp.route("/trips/<int:itinerary_id>/status", methods=["PATCH"])
def update_trip_status(itinerary_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("Upcoming", "Completed", "Cancelled"):
        return jsonify({"status": "error", "message": "Invalid status"}), 400

    trip = fetch_one("SELECT itinerary_id FROM itineraries WHERE itinerary_id = ? AND user_id = ?", (itinerary_id, user["user_id"]))
    if not trip:
        return jsonify({"status": "error", "message": "Trip not found"}), 404

    execute_query("UPDATE itineraries SET status = ? WHERE itinerary_id = ?", (new_status, itinerary_id))
    execute_query("UPDATE trip_movies SET trip_status = ? WHERE itinerary_id = ?", (new_status, itinerary_id))
    return jsonify({"status": "success", "message": f"Trip marked as {new_status}"})


@trips_bp.route("/trips/bookings/<int:booking_id>", methods=["DELETE"])
def cancel_booking(booking_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    b = fetch_one("SELECT booking_id FROM bookings WHERE booking_id = ? AND user_id = ?", (booking_id, user["user_id"]))
    if not b:
        return jsonify({"status": "error", "message": "Booking not found"}), 404

    execute_query("UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?", (booking_id,))
    return jsonify({"status": "success", "message": "Booking cancelled"})


VIBE_PACKING_PRESETS = {
    "mountain": ["Thermal layers & fleece jacket", "Sturdy hiking shoes", "Sunscreen & lip balm", "Power bank (cold drains battery)"],
    "beach": ["Reef-safe sunscreen", "Light linen shirts & swimwear", "Waterproof phone pouch", "Polarized sunglasses"],
    "heritage": ["Comfortable walking sneakers", "Light scarf for temples/forts", "Refillable water bottle", "Camera & spare SD card"],
    "adventure": ["Quick-dry activewear", "Daypack with rain cover", "Basic first-aid & electrolytes", "Action camera strap"],
    "food": ["Digestive mints & wet wipes", "Reusable tote for market spices", "Cash in small notes for street stalls", "Slip-on walking shoes"],
    "city": ["Smart-casual evening outfit", "Portable umbrella", "Transit card / offline maps", "Universal adapter"],
}


@trips_bp.route("/trips/<int:itinerary_id>/checklist", methods=["GET", "POST"])
def trip_checklist(itinerary_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    itin = fetch_one("SELECT itinerary_id, vibe FROM itineraries WHERE itinerary_id = ? AND user_id = ?", (itinerary_id, user["user_id"]))
    if not itin:
        return jsonify({"status": "error", "message": "Trip not found"}), 404

    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        label = (data.get("label") or "").strip()
        if not label:
            return jsonify({"status": "error", "message": "Checklist label required"}), 400
        iid = execute_query(
            "INSERT INTO trip_checklists (itinerary_id, user_id, label, checked) VALUES (?, ?, ?, 0)",
            (itinerary_id, user["user_id"], label),
        )
        return jsonify({"status": "success", "item": {"item_id": iid, "label": label, "checked": 0}}), 201

    items = fetch_all("SELECT item_id, label, checked FROM trip_checklists WHERE itinerary_id = ? AND user_id = ? ORDER BY item_id ASC", (itinerary_id, user["user_id"]))
    if not items:
        presets = VIBE_PACKING_PRESETS.get((itin.get("vibe") or "mountain").lower(), VIBE_PACKING_PRESETS["mountain"])
        for label in presets:
            execute_query("INSERT INTO trip_checklists (itinerary_id, user_id, label, checked) VALUES (?, ?, ?, 0)", (itinerary_id, user["user_id"], label))
        items = fetch_all("SELECT item_id, label, checked FROM trip_checklists WHERE itinerary_id = ? AND user_id = ? ORDER BY item_id ASC", (itinerary_id, user["user_id"]))
    return jsonify({"status": "success", "items": items})


@trips_bp.route("/trips/checklist/<int:item_id>", methods=["PATCH", "DELETE"])
def update_checklist_item(item_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    if request.method == "DELETE":
        execute_query("DELETE FROM trip_checklists WHERE item_id = ? AND user_id = ?", (item_id, user["user_id"]))
        return jsonify({"status": "success"})

    data = request.get_json(silent=True) or {}
    checked = 1 if data.get("checked") else 0
    execute_query("UPDATE trip_checklists SET checked = ? WHERE item_id = ? AND user_id = ?", (checked, item_id, user["user_id"]))
    return jsonify({"status": "success", "checked": checked})
