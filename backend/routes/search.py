from flask import Blueprint, request, jsonify
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user

search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["GET"])
def search_options():
    """Return realistic Booking.com / MakeMyTrip-style search listings with GPS coordinates."""
    dest = (request.args.get("destination") or request.args.get("dest") or "").strip()

    dest_filter = ""
    params = []
    if dest:
        dest_filter = "WHERE LOWER(d.name) LIKE LOWER(?)"
        params = [f"%{dest}%"]

    hotels = fetch_all(f"""
        SELECT 'h' || h.hotel_id as id, h.name, h.meta, h.price_per_night as price,
               h.rating, h.facilities, h.location, d.name as destination,
               COALESCE(h.latitude, d.latitude) as latitude,
               COALESCE(h.longitude, d.longitude) as longitude
        FROM hotels h JOIN destinations d ON h.destination_id = d.destination_id {dest_filter}
        ORDER BY h.rating DESC
    """, params)
    for h in hotels:
        h["badges"] = ["Free cancellation", "Instant confirmation"]
        if "breakfast" in (h.get("facilities") or "").lower() or "breakfast" in (h.get("meta") or "").lower():
            h["badges"].append("Breakfast included")
        h["reviews"] = int((h["rating"] * 42) + 38)

    restaurants = fetch_all(f"""
        SELECT 'r' || r.restaurant_id as id, r.name, r.meta, r.avg_price as price,
               r.rating, r.cuisine, r.price_range, r.location, d.name as destination,
               COALESCE(r.latitude, d.latitude) as latitude,
               COALESCE(r.longitude, d.longitude) as longitude
        FROM restaurants r JOIN destinations d ON r.destination_id = d.destination_id {dest_filter}
        ORDER BY r.rating DESC
    """, params)
    for r in restaurants:
        r["badges"] = [r.get("price_range") or "Popular", "Table reservation"]
        r["reviews"] = int((r["rating"] * 35) + 21)

    activities = fetch_all(f"""
        SELECT 'a' || a.activity_id as id, a.name, a.meta, a.price, a.rating,
               a.category, a.vibe, a.duration_hours, d.name as destination,
               COALESCE(a.latitude, d.latitude) as latitude,
               COALESCE(a.longitude, d.longitude) as longitude
        FROM activities a JOIN destinations d ON a.destination_id = d.destination_id {dest_filter}
        ORDER BY a.rating DESC
    """, params)
    for a in activities:
        a["badges"] = [a.get("category") or "Experience", "Mobile voucher"]
        a["reviews"] = int((a["rating"] * 28) + 19)

    flights = fetch_all(f"""
        SELECT 'f' || t.transport_id as id, t.provider_name || ' · ' || t.origin || ' → ' || d.name as name,
               t.meta, t.price, t.rating, t.departure_time, t.arrival_time, d.name as destination,
               COALESCE(t.latitude, d.latitude) as latitude,
               COALESCE(t.longitude, d.longitude) as longitude
        FROM transport t JOIN destinations d ON t.destination_id = d.destination_id
        WHERE t.mode = 'Flight' {('AND LOWER(d.name) LIKE LOWER(?)' if dest else '')}
        ORDER BY t.price
    """, params if dest else [])
    for f in flights:
        f["badges"] = ["Cabin bag included", "Web check-in"]
        f["reviews"] = int((f["rating"] * 50) + 60)

    trains = fetch_all(f"""
        SELECT 't' || t.transport_id as id, t.provider_name || ' → ' || d.name as name,
               t.meta, t.price, t.rating, t.departure_time, t.arrival_time, d.name as destination,
               COALESCE(t.latitude, d.latitude) as latitude,
               COALESCE(t.longitude, d.longitude) as longitude
        FROM transport t JOIN destinations d ON t.destination_id = d.destination_id
        WHERE t.mode = 'Train' {('AND LOWER(d.name) LIKE LOWER(?)' if dest else '')}
        ORDER BY t.price
    """, params if dest else [])
    for t in trains:
        t["badges"] = ["Confirmed e-Ticket", "IRCTC Partner"]
        t["reviews"] = int((t["rating"] * 45) + 42)

    buses = fetch_all(f"""
        SELECT 'b' || t.transport_id as id, t.provider_name || ' → ' || d.name as name,
               t.meta, t.price, t.rating, t.departure_time, t.arrival_time, d.name as destination,
               COALESCE(t.latitude, d.latitude) as latitude,
               COALESCE(t.longitude, d.longitude) as longitude
        FROM transport t JOIN destinations d ON t.destination_id = d.destination_id
        WHERE t.mode IN ('Bus', 'Cab') {('AND LOWER(d.name) LIKE LOWER(?)' if dest else '')}
        ORDER BY t.price
    """, params if dest else [])
    for b in buses:
        b["badges"] = ["Live GPS tracking", "Flexible boarding"]
        b["reviews"] = int((b["rating"] * 30) + 27)

    rentals = fetch_all(f"""
        SELECT 'v' || r.rental_id as id, r.model_name || ' (' || r.vehicle_type || ')' as name,
               r.meta, r.price_per_day as price, r.rating, r.vendor_name, d.name as destination,
               COALESCE(r.latitude, d.latitude) as latitude,
               COALESCE(r.longitude, d.longitude) as longitude
        FROM rentals r JOIN destinations d ON r.destination_id = d.destination_id {dest_filter}
        ORDER BY r.price_per_day ASC
    """, params)
    for rt in rentals:
        rt["badges"] = ["Free cancellation", rt.get("vendor_name") or "Verified Vendor"]
        rt["reviews"] = int((rt["rating"] * 22) + 14)

    return jsonify({
        "Hotels": hotels,
        "Flights": flights,
        "Trains": trains,
        "Buses": buses,
        "Rentals": rentals,
        "Restaurants": restaurants,
        "Activities": activities,
    })


@search_bp.route("/destinations", methods=["GET"])
def list_destinations():
    rows = fetch_all("""
        SELECT destination_id as id, slug, name, region, primary_vibe, description,
               image_url as img, latitude, longitude
        FROM destinations ORDER BY destination_id
    """)
    return jsonify(rows)


@search_bp.route("/map", methods=["GET"])
def map_places():
    """Return unified geo-located places across all DB tables for visual map exploration."""
    q = (request.args.get("q") or "").strip().lower()
    dest = (request.args.get("destination") or "").strip().lower()

    places = []
    dests = fetch_all("SELECT destination_id, name, region, latitude, longitude FROM destinations")
    for d in dests:
        places.append({
            "id": f"dest-{d['destination_id']}",
            "category": "Destinations",
            "name": d["name"],
            "destination": d["name"],
            "meta": d["region"],
            "price": 0,
            "rating": 4.8,
            "latitude": d["latitude"],
            "longitude": d["longitude"],
        })

    rows = fetch_all("""
        SELECT 'Hotels' as category, 'h' || h.hotel_id as id, h.name, d.name as destination,
               h.meta, h.price_per_night as price, h.rating, h.latitude, h.longitude
        FROM hotels h JOIN destinations d ON h.destination_id = d.destination_id
        UNION ALL
        SELECT 'Restaurants' as category, 'r' || r.restaurant_id as id, r.name, d.name as destination,
               r.meta, r.avg_price as price, r.rating, r.latitude, r.longitude
        FROM restaurants r JOIN destinations d ON r.destination_id = d.destination_id
        UNION ALL
        SELECT 'Activities' as category, 'a' || a.activity_id as id, a.name, d.name as destination,
               a.meta, a.price, a.rating, a.latitude, a.longitude
        FROM activities a JOIN destinations d ON a.destination_id = d.destination_id
        UNION ALL
        SELECT 'Rentals' as category, 'v' || rt.rental_id as id, rt.model_name || ' (' || rt.vehicle_type || ')' as name,
               d.name as destination, rt.meta, rt.price_per_day as price, rt.rating, rt.latitude, rt.longitude
        FROM rentals rt JOIN destinations d ON rt.destination_id = d.destination_id
    """)
    places.extend(rows)

    if dest and dest != "all":
        places = [p for p in places if dest in (p.get("destination") or "").lower()]
    if q:
        places = [
            p for p in places
            if q in (p.get("name") or "").lower()
            or q in (p.get("destination") or "").lower()
            or q in (p.get("meta") or "").lower()
            or q in (p.get("category") or "").lower()
        ]

    return jsonify({"status": "success", "total": len(places), "places": places})


@search_bp.route("/saved", methods=["GET", "POST"])
def saved_wishlist():
    user = get_current_user()
    if not user:
        return jsonify({"saved": [], "ids": []})

    uid = user["user_id"]
    if request.method == "GET":
        rows = fetch_all("SELECT * FROM saved_items WHERE user_id = ? ORDER BY saved_id DESC", (uid,))
        return jsonify({"saved": rows, "ids": [r["item_id"] for r in rows]})

    data = request.get_json(silent=True) or {}
    item_id = str(data.get("id") or "")
    if not item_id:
        return jsonify({"status": "error", "message": "Item ID required"}), 400

    existing = fetch_one("SELECT saved_id FROM saved_items WHERE user_id = ? AND item_id = ?", (uid, item_id))
    if existing:
        execute_query("DELETE FROM saved_items WHERE saved_id = ?", (existing["saved_id"],))
        saved = False
    else:
        execute_query(
            "INSERT INTO saved_items (user_id, item_id, category, name, destination, price, meta) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (uid, item_id, data.get("category") or "Stay", data.get("name") or "", data.get("destination") or "", float(data.get("price") or 0), data.get("meta") or ""),
        )
        saved = True

    rows = fetch_all("SELECT item_id FROM saved_items WHERE user_id = ?", (uid,))
    return jsonify({"status": "success", "saved": saved, "ids": [r["item_id"] for r in rows]})
