from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user
from backend.services.movie_generator import generate_movie_identity
from backend.routes.movies import _save_movie_for_itinerary

itinerary_bp = Blueprint("itinerary", __name__)

# Curated vibe -> destination & multi-day authentic itinerary templates
VIBE_ITINERARIES = {
    "mountain": {
        "destination": "Manali",
        "region": "Himachal Pradesh, India",
        "title": "Manali, Himalayan Pines & Valleys",
        "dates": "14 – 17 Dec 2026",
        "img": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70",
        "budget": 24000,
        "days": [
            {"day": 1, "title": "Arrival in the Kullu Valley", "items": [
                {"time": "10:30", "text": "Check in at Snow Valley Resort / Zostel Old Manali"},
                {"time": "13:30", "text": "Warm siddu & trout lunch at Johnson's Cafe"},
                {"time": "16:30", "text": "Golden-hour stroll along the Beas River & Old Manali bridge"},
            ]},
            {"day": 2, "title": "Pine Trails & Waterfalls", "items": [
                {"time": "08:00", "text": "Jogini Waterfall Pine Forest Trek from Vashisht"},
                {"time": "12:30", "text": "Natural hot springs soak at Vashisht Temple"},
                {"time": "16:30", "text": "Wood-fired coffee & mountain views at Himalayan Cafe"},
            ]},
            {"day": 3, "title": "High Peaks & Alpine Passes", "items": [
                {"time": "08:30", "text": "Solang Valley ridge walk & tandem paragliding"},
                {"time": "13:00", "text": "Drive through Atal Tunnel into snowy Sissu Valley"},
                {"time": "18:30", "text": "Bonfire & local Himachali dinner back in Manali"},
            ]},
            {"day": 4, "title": "Cedar Temples & Departure", "items": [
                {"time": "09:00", "text": "Quiet morning walk through Hadimba Devi cedar grove"},
                {"time": "12:00", "text": "Pick up Kullu woollens & depart for Chandigarh/Delhi"},
            ]},
        ],
    },
    "beach": {
        "destination": "Goa",
        "region": "Goa, India",
        "title": "Goa, Slow Beaches & Latin Quarters",
        "dates": "14 – 17 Dec 2026",
        "img": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70",
        "budget": 26000,
        "days": [
            {"day": 1, "title": "South Goa Coves", "items": [
                {"time": "11:00", "text": "Check in at Casa Colva Beach Resort"},
                {"time": "14:00", "text": "Goan fish curry & kokum cooler by the palms"},
                {"time": "17:00", "text": "Palolem Sunset Kayak across the calm bay"},
            ]},
            {"day": 2, "title": "Quiet Sands & Spice Gardens", "items": [
                {"time": "08:00", "text": "Early morning barefoot walk at Agonda Beach"},
                {"time": "13:00", "text": "Goan Spice Plantation tour & indoor courtyard lunch"},
                {"time": "17:30", "text": "Cabo de Rama cliffside sunset overlooking the Arabian Sea"},
            ]},
            {"day": 3, "title": "Fontainhas & North Coast", "items": [
                {"time": "09:30", "text": "Heritage walk through Fontainhas pastel Portuguese lanes"},
                {"time": "13:30", "text": "Coastal tasting at Gunpowder, Assagao"},
                {"time": "19:30", "text": "Seafood platter & live acoustic music at Britto's"},
            ]},
            {"day": 4, "title": "Slow Morning & Departure", "items": [
                {"time": "09:00", "text": "Poi bread & filter coffee at a village bakery"},
                {"time": "12:00", "text": "Check out and transfer to Dabolim / Mopa airport"},
            ]},
        ],
    },
    "heritage": {
        "destination": "Jaipur",
        "region": "Rajasthan, India",
        "title": "Jaipur, Forts & Sandstone Palaces",
        "dates": "14 – 17 Dec 2026",
        "img": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70",
        "budget": 32000,
        "days": [
            {"day": 1, "title": "Arrival & Old City", "items": [
                {"time": "11:00", "text": "Check in at Haveli Heritage Stay"},
                {"time": "14:00", "text": "Lunch at Laxmi Misthan Bhandar, Johari Bazaar"},
                {"time": "17:00", "text": "Hawa Mahal facade at golden hour"},
            ]},
            {"day": 2, "title": "Forts & Palaces", "items": [
                {"time": "08:30", "text": "Amber Fort Sunrise Tour before the crowds"},
                {"time": "13:00", "text": "Panna Meena ka Kund stepwell & courtyard lunch"},
                {"time": "16:00", "text": "City Palace & Jantar Mantar astronomical instruments"},
            ]},
            {"day": 3, "title": "Craft & Sunset Hills", "items": [
                {"time": "10:00", "text": "Block Printing Workshop in Sanganer"},
                {"time": "15:00", "text": "Albert Hall Museum & Bapu Bazaar walk"},
                {"time": "18:00", "text": "Sunset views from Nahargarh Fort ramparts"},
            ]},
            {"day": 4, "title": "Slow Morning & Departure", "items": [
                {"time": "09:00", "text": "Breakfast chai & bun maska at Tapri Central"},
                {"time": "12:00", "text": "Check out and transfer to railway station / airport"},
            ]},
        ],
    },
    "adventure": {
        "destination": "Rishikesh",
        "region": "Uttarakhand, India",
        "title": "Rishikesh, Rapids & Foothill Trails",
        "dates": "14 – 17 Dec 2026",
        "img": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=70",
        "budget": 18000,
        "days": [
            {"day": 1, "title": "Riverbanks & Suspension Bridges", "items": [
                {"time": "11:00", "text": "Check in at Ganga Kinare Riverside Stay, Tapovan"},
                {"time": "14:00", "text": "Tibetan thukpa at Little Buddha Cafe"},
                {"time": "17:30", "text": "Evening Ganga Aarti & lamps at Triveni Ghat"},
            ]},
            {"day": 2, "title": "White Water Rapids", "items": [
                {"time": "08:30", "text": "16 km Ganga White Water Rafting from Shivpuri"},
                {"time": "14:00", "text": "Cliff jump & riverside chai by the white sand beaches"},
                {"time": "19:00", "text": "Bonfire dinner at riverside camp"},
            ]},
            {"day": 3, "title": "Waterfalls & Forest Trails", "items": [
                {"time": "08:00", "text": "Neer Garh Waterfall hike through forested hills"},
                {"time": "13:30", "text": "Beatles Ashram street-art & meditation domes walk"},
                {"time": "17:00", "text": "Indoor sound healing & restorative yoga session"},
            ]},
            {"day": 4, "title": "Sunrise & Departure", "items": [
                {"time": "07:00", "text": "Sunrise yoga on the river deck"},
                {"time": "11:00", "text": "Check out and drive back"},
            ]},
        ],
    },
    "food": {
        "destination": "Kyoto",
        "region": "Japan",
        "title": "Kyoto, Markets & Tea Houses",
        "dates": "14 – 17 Dec 2026",
        "img": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=70",
        "budget": 75000,
        "days": [
            {"day": 1, "title": "Lantern Alleys & Izakayas", "items": [
                {"time": "12:00", "text": "Check in at Higashiyama Machiya Ryokan"},
                {"time": "14:30", "text": "Matcha sweets & hand-pulled udon in Gion"},
                {"time": "18:30", "text": "Evening walk along Pontocho Alley & lantern dining"},
            ]},
            {"day": 2, "title": "Nishiki Kitchen & Tea Ceremony", "items": [
                {"time": "09:30", "text": "Nishiki Covered Market food tour — yuba, tamago & skewers"},
                {"time": "14:00", "text": "Traditional indoor tatami tea ceremony"},
                {"time": "19:00", "text": "Seasonal kaiseki dinner at Gion Karyo"},
            ]},
            {"day": 3, "title": "Arashiyama Bamboo & Tofu", "items": [
                {"time": "07:30", "text": "Early walk through Arashiyama bamboo grove"},
                {"time": "12:30", "text": "Handmade soba & riverside tofu lunch"},
                {"time": "16:30", "text": "Philosopher's Path café hopping"},
            ]},
            {"day": 4, "title": "Morning Ramen & Shinkansen", "items": [
                {"time": "09:00", "text": "Bakery pastries & pour-over coffee near Kyoto Station"},
                {"time": "12:00", "text": "Board JR Tokaido Shinkansen"},
            ]},
        ],
    },
    "city": {
        "destination": "Paris",
        "region": "France",
        "title": "Paris, Cafés & Late Nights",
        "dates": "14 – 17 Dec 2026",
        "img": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=70",
        "budget": 95000,
        "days": [
            {"day": 1, "title": "Left Bank & Seine Lights", "items": [
                {"time": "11:00", "text": "Check in at Hotel Le Saint-Grégoire, Saint-Germain"},
                {"time": "13:30", "text": "Espresso & tartine at Café de Flore"},
                {"time": "19:00", "text": "Seine Evening Cruise past illuminated bridges"},
            ]},
            {"day": 2, "title": "Art & Patisseries", "items": [
                {"time": "09:00", "text": "Louvre Museum curated highlights"},
                {"time": "14:00", "text": "Le Marais artisan bakery & pastry trail"},
                {"time": "20:00", "text": "Candlelit rooftop bistro dinner"},
            ]},
            {"day": 3, "title": "Montmartre & Bookshops", "items": [
                {"time": "09:30", "text": "Walk cobblestone streets up to Sacré-Cœur"},
                {"time": "13:00", "text": "Picnic & canal stroll along Canal Saint-Martin"},
                {"time": "18:00", "text": "Jazz club evening in Saint-Germain-des-Prés"},
            ]},
            {"day": 4, "title": "Croissants & Departure", "items": [
                {"time": "09:00", "text": "Morning croissants in Jardin du Luxembourg"},
                {"time": "12:30", "text": "Transfer to CDG airport"},
            ]},
        ],
    },
}

# Destination-specific itineraries if user explicitly chooses a destination
DEST_TO_VIBE = {
    "manali": "mountain",
    "rishikesh": "adventure",
    "goa": "beach",
    "jaipur": "heritage",
    "udaipur": "heritage",
    "agra": "heritage",
    "kyoto": "food",
    "paris": "city",
}


def _build_itinerary(vibes_list, dest_param=None, days_count=4):
    dest_clean = (dest_param or "").strip().lower()
    chosen_vibe = None

    # First check explicit vibes if no incompatible destination forced
    for v in vibes_list:
        if v in VIBE_ITINERARIES:
            chosen_vibe = v
            break

    # If user explicitly picked a destination, build around that destination
    if dest_clean:
        # Try DB activities for this destination
        dest_row = fetch_one(
            "SELECT * FROM destinations WHERE LOWER(slug) = ? OR LOWER(name) = ?",
            (dest_clean, dest_clean),
        )
        if dest_row:
            # Check if a template already matches this destination
            tmpl_vibe = DEST_TO_VIBE.get(dest_row["slug"].lower())
            if tmpl_vibe and VIBE_ITINERARIES[tmpl_vibe]["destination"].lower() == dest_row["name"].lower():
                plan = dict(VIBE_ITINERARIES[tmpl_vibe])
                plan["days"] = plan["days"][:days_count]
                plan["vibe"] = chosen_vibe or tmpl_vibe
                plan["destination_id"] = dest_row["destination_id"]
                return plan

            # Otherwise dynamically assemble from DB tables for Udaipur / Agra etc.
            acts = fetch_all("SELECT * FROM activities WHERE destination_id = ?", (dest_row["destination_id"],))
            hotels = fetch_all("SELECT * FROM hotels WHERE destination_id = ?", (dest_row["destination_id"],))
            rests = fetch_all("SELECT * FROM restaurants WHERE destination_id = ?", (dest_row["destination_id"],))
            stay_name = hotels[0]["name"] if hotels else f"Boutique Stay in {dest_row['name']}"
            food_name = rests[0]["name"] if rests else f"Local Kitchen in {dest_row['name']}"

            days = []
            for d in range(1, days_count + 1):
                if d == 1:
                    items = [
                        {"time": "11:00", "text": f"Check in at {stay_name}"},
                        {"time": "13:30", "text": f"Welcome local lunch at {food_name}"},
                        {"time": "17:00", "text": acts[0]["name"] if acts else f"Golden hour walk in {dest_row['name']}"},
                    ]
                    title = f"Arrival in {dest_row['name']}"
                else:
                    a1 = acts[(d - 1) % len(acts)]["name"] if acts else f"Morning exploration in {dest_row['name']}"
                    a2 = acts[d % len(acts)]["name"] if acts else f"Afternoon cultural walk"
                    r_pick = rests[d % len(rests)]["name"] if rests else food_name
                    items = [
                        {"time": "09:00", "text": a1},
                        {"time": "13:30", "text": f"Lunch at {r_pick}"},
                        {"time": "17:00", "text": a2},
                    ]
                    title = f"Day {d} · Discovering {dest_row['name']}"
                days.append({"day": d, "title": title, "items": items})

            return {
                "destination": dest_row["name"],
                "destination_id": dest_row["destination_id"],
                "region": dest_row["region"],
                "vibe": chosen_vibe or dest_row.get("primary_vibe") or "heritage",
                "title": f"{dest_row['name']}, {dest_row['region']}",
                "dates": "14 – 17 Dec 2026",
                "img": dest_row["image_url"],
                "budget": 28000,
                "days": days,
            }

        # Custom unknown destination: generate clean relevant plan
        pretty_dest = dest_param.strip().title()
        vibe_label = (chosen_vibe or "discovery").title()
        days = []
        for d in range(1, days_count + 1):
            days.append({
                "day": d,
                "title": f"Day {d} · {vibe_label} in {pretty_dest}",
                "items": [
                    {"time": "09:00", "text": f"Morning {vibe_label.lower()} trail around {pretty_dest}"},
                    {"time": "13:30", "text": f"Regional lunch at a local favourite in {pretty_dest}"},
                    {"time": "17:30", "text": f"Sunset viewpoint & evening stroll in {pretty_dest}"},
                ],
            })
        return {
            "destination": pretty_dest,
            "region": "",
            "vibe": chosen_vibe or "mountain",
            "title": f"{pretty_dest} · {vibe_label} Escape",
            "dates": "14 – 17 Dec 2026",
            "img": VIBE_ITINERARIES.get(chosen_vibe or "mountain", VIBE_ITINERARIES["mountain"])["img"],
            "budget": 25000,
            "days": days,
        }

    # No explicit destination -> select the destination matched to the chosen vibe!
    if not chosen_vibe:
        chosen_vibe = "mountain"
    plan = dict(VIBE_ITINERARIES[chosen_vibe])
    plan["vibe"] = chosen_vibe
    plan["days"] = plan["days"][:days_count]
    dest_row = fetch_one("SELECT destination_id FROM destinations WHERE LOWER(name) = LOWER(?)", (plan["destination"],))
    if dest_row:
        plan["destination_id"] = dest_row["destination_id"]
    return plan


@itinerary_bp.route("/itinerary", methods=["GET", "POST"])
def generate_itinerary():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        vibes_raw = data.get("vibes") or data.get("vibe") or ""
        dest = data.get("destination") or ""
        days = int(data.get("days") or 4)
    else:
        vibes_raw = request.args.get("vibes") or request.args.get("vibe") or ""
        dest = request.args.get("destination") or ""
        days = int(request.args.get("days") or 4)

    days = max(1, min(days, 10))
    if isinstance(vibes_raw, list):
        vibes_list = [str(v).strip().lower() for v in vibes_raw if str(v).strip()]
    else:
        vibes_list = [v.strip().lower() for v in str(vibes_raw).split(",") if v.strip()]

    plan = _build_itinerary(vibes_list, dest, days)
    movie = generate_movie_identity(
        destination=plan["destination"],
        vibe=plan.get("vibe") or (vibes_list[0] if vibes_list else "mountain"),
        days=plan["days"],
        budget=plan.get("budget") or 25000,
        img=plan.get("img"),
        dates=plan.get("dates"),
    )
    plan["movie"] = movie

    # Also return suggested destinations matching the selected vibe
    all_dests = fetch_all("SELECT destination_id, slug, name, region, primary_vibe FROM destinations ORDER BY destination_id")
    plan["available_destinations"] = all_dests
    return jsonify(plan)


@itinerary_bp.route("/itinerary/save", methods=["POST"])
def save_itinerary():
    """Save the generated itinerary AND its cinematic movie identity into SQLite."""
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to save an itinerary"}), 401

    data = request.get_json(silent=True) or {}
    destination_name = (data.get("destination") or "").strip()
    title = (data.get("title") or f"Trip to {destination_name}").strip()
    vibe = (data.get("vibe") or "mountain").strip()
    days = data.get("days") or []
    budget = float(data.get("budget") or 25000)
    start_date = data.get("start_date") or (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    total_days = max(1, len(days))
    end_dt = datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=total_days - 1)
    end_date = end_dt.strftime("%Y-%m-%d")

    dest_row = fetch_one("SELECT destination_id, image_url FROM destinations WHERE LOWER(name) = LOWER(?)", (destination_name,))
    if not dest_row:
        slug = destination_name.lower().replace(" ", "-") or "custom"
        dest_id = execute_query(
            "INSERT OR IGNORE INTO destinations (slug, name, region, primary_vibe, description, image_url) VALUES (?, ?, ?, ?, ?, ?)",
            (slug, destination_name or "Custom Trip", "Travel Destination", vibe, f"Custom {vibe} itinerary", data.get("img") or ""),
        )
        if not dest_id:
            dest_row = fetch_one("SELECT destination_id, image_url FROM destinations WHERE slug = ?", (slug,))
            dest_id = dest_row["destination_id"]
    else:
        dest_id = dest_row["destination_id"]

    itin_id = execute_query(
        """
        INSERT INTO itineraries (user_id, destination_id, title, vibe, start_date, end_date, total_days, budget, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', ?)
        """,
        (user["user_id"], dest_id, title, vibe, start_date, end_date, total_days, budget, f"{total_days}-day {vibe} itinerary"),
    )

    for d in days:
        day_num = int(d.get("day") or 1)
        day_title = d.get("title") or f"Day {day_num}"
        for idx, item in enumerate(d.get("items") or []):
            slot = "Morning" if idx == 0 else "Afternoon" if idx == 1 else "Evening"
            execute_query(
                """
                INSERT INTO itinerary_details (itinerary_id, day_number, day_title, time_slot, scheduled_time, activity_title)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (itin_id, day_num, day_title, slot, item.get("time") or "09:00", item.get("text") or "Activity"),
            )

    movie_payload = data.get("movie") or generate_movie_identity(
        destination=destination_name,
        vibe=vibe,
        days=days,
        budget=budget,
        img=data.get("img") or (dest_row.get("image_url") if dest_row else None),
        dates=f"{start_date} – {end_date}",
    )
    movie_id, share_slug = _save_movie_for_itinerary(itin_id, user["user_id"], movie_payload, "Upcoming")

    return jsonify({
        "status": "success",
        "itinerary_id": itin_id,
        "movie_id": movie_id,
        "share_slug": share_slug,
        "movie": {**movie_payload, "movie_id": movie_id, "itinerary_id": itin_id, "share_slug": share_slug},
        "message": "Trip & Movie Identity saved to My Trips!",
    }), 201
