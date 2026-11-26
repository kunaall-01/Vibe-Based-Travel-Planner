from flask import Blueprint, request, jsonify

replanner_bp = Blueprint("replanner", __name__)

PLAN_B_DATA = {
    "jaipur": {
        "destination": "Jaipur",
        "original_title": "Day 2 · Forts & Palaces",
        "alt_title": "Day 2 · Rain-ready Jaipur",
        "disruptions": {
            "rain": "Rain is forecast in Jaipur (80% chance from 11:00).",
            "closure": "Amber Fort courtyard has a scheduled heritage closure.",
            "transport_delay": "Traffic congestion on Amer Road is delaying transfers.",
            "unavailable": "Outdoor stepwell tour was cancelled for maintenance.",
        },
        "original": [
            {"time": "08:30", "text": "Amber Fort ramparts before the crowds"},
            {"time": "13:00", "text": "Panna Meena ka Kund open stepwell & lunch"},
            {"time": "16:00", "text": "Jantar Mantar open observatory & Nahargarh drive"},
        ],
        "alternative": [
            {"time": "08:00", "text": "Amber Fort early, wrapped up before midday"},
            {"time": "12:30", "text": "Covered terrace chai & lunch at Tapri Central"},
            {"time": "14:30", "text": "Albert Hall Museum (indoors · art & royal collections)"},
            {"time": "17:00", "text": "Indoor block-printing workshop & Dal Baati cooking class"},
        ],
    },
    "manali": {
        "destination": "Manali",
        "original_title": "Mountain Trails & Passes",
        "alt_title": "Weather-safe Manali",
        "disruptions": {
            "rain": "Heavy mountain rain / snowfall alert near Solang & Rohtang.",
            "closure": "Atal Tunnel high-altitude road is temporarily closed.",
            "transport_delay": "Landslide clearance is delaying Kullu valley cabs.",
            "unavailable": "Paragliding flights are grounded due to gusty winds.",
        },
        "original": [
            {"time": "08:30", "text": "Solang Valley tandem paragliding & ridge trek"},
            {"time": "12:30", "text": "Drive through Atal Tunnel to Sissu Valley"},
            {"time": "16:30", "text": "Jogini Waterfall steep mountain trail"},
        ],
        "alternative": [
            {"time": "09:30", "text": "Warm soak at Vashisht covered thermal hot springs"},
            {"time": "12:30", "text": "Wood-fired lunch & fresh river trout at Johnson's Cafe"},
            {"time": "15:00", "text": "Museum of Himachal Culture & Folk Art (indoors)"},
            {"time": "17:30", "text": "Cozy acoustic café hopping along Old Manali"},
        ],
    },
    "goa": {
        "destination": "Goa",
        "original_title": "Beaches & Bay Kayaking",
        "alt_title": "Monsoon-safe Goa",
        "disruptions": {
            "rain": "Coastal squall & heavy monsoon showers forecast today.",
            "closure": "Water sports & kayaking suspended due to high tide.",
            "transport_delay": "Ferry crossing delayed along the Mandovi river.",
            "unavailable": "Beach shack event postponed.",
        },
        "original": [
            {"time": "08:00", "text": "Early barefoot walk along Agonda Beach"},
            {"time": "13:00", "text": "Cabo de Rama cliffside picnic"},
            {"time": "17:00", "text": "Palolem Sunset Kayak across the bay"},
        ],
        "alternative": [
            {"time": "09:30", "text": "Covered heritage church & gallery hop in Old Goa"},
            {"time": "13:00", "text": "Assagao courtyard lunch at Gunpowder"},
            {"time": "15:30", "text": "Goan Spice Plantation pavilion tasting & feni workshop"},
            {"time": "18:30", "text": "Azulejos tile studio & indoor Panjim cafés"},
        ],
    },
    "udaipur": {
        "destination": "Udaipur",
        "original_title": "Lakes & Hilltop Palaces",
        "alt_title": "Covered Havelis & Cultural Udaipur",
        "disruptions": {
            "rain": "Afternoon showers & gusty winds over Lake Pichola.",
            "closure": "Boat jetty temporarily paused due to high wind.",
            "transport_delay": "Old city narrow-lane congestion near City Palace.",
            "unavailable": "Monsoon Palace hill road closed for maintenance.",
        },
        "original": [
            {"time": "09:00", "text": "Monsoon Palace hilltop drive"},
            {"time": "13:00", "text": "Saheliyon Ki Bari outdoor gardens"},
            {"time": "17:30", "text": "Lake Pichola open sunset boat ride"},
        ],
        "alternative": [
            {"time": "09:30", "text": "City Palace indoor galleries & Crystal Gallery"},
            {"time": "13:00", "text": "Lakeside veranda lunch at Jheel's Ginger Coffee Bar"},
            {"time": "15:30", "text": "Vintage Car Museum & miniature painting studio"},
            {"time": "19:00", "text": "Bagore Ki Haveli indoor folk dance performance"},
        ],
    },
    "agra": {
        "destination": "Agra",
        "original_title": "Taj & River Gardens",
        "alt_title": "Indoor Mughal Craft & Heritage",
        "disruptions": {
            "rain": "Heavy rain & low visibility forecast along the Yamuna.",
            "closure": "Friday / scheduled monument maintenance closure.",
            "transport_delay": "Expressway fog delaying morning arrival.",
            "unavailable": "Garden access closed temporarily.",
        },
        "original": [
            {"time": "06:00", "text": "Taj Mahal sunrise courtyard walk"},
            {"time": "11:00", "text": "Agra Fort open ramparts"},
            {"time": "17:00", "text": "Mehtab Bagh river-bank sunset"},
        ],
        "alternative": [
            {"time": "09:30", "text": "Taj Museum & indoor Diwan-i-Khas pavilions"},
            {"time": "13:00", "text": "Mughlai lunch at Pinch of Spice"},
            {"time": "15:30", "text": "Pietra dura marble inlay artisan workshop (indoors)"},
            {"time": "18:00", "text": "Chaat & sweet tasting in Sadar Bazaar covered arcade"},
        ],
    },
    "rishikesh": {
        "destination": "Rishikesh",
        "original_title": "Rapids & Forest Waterfalls",
        "alt_title": "Ashrams & Riverside Studios",
        "disruptions": {
            "rain": "Heavy foothills rain; river rafting paused by authorities.",
            "closure": "Waterfall forest trail closed for trail safety.",
            "transport_delay": "Highway congestion between Haridwar and Tapovan.",
            "unavailable": "Outdoor zip-line closed today.",
        },
        "original": [
            {"time": "08:30", "text": "16 km Ganga White Water Rafting"},
            {"time": "13:30", "text": "Neer Garh Waterfall forest hike"},
            {"time": "17:30", "text": "Outdoor river-beach meditation"},
        ],
        "alternative": [
            {"time": "09:00", "text": "Indoor Himalayan sound healing & restorative yoga"},
            {"time": "12:30", "text": "Covered riverside deck lunch at Little Buddha Cafe"},
            {"time": "15:00", "text": "Covered temple art & Beatles Ashram gallery rooms"},
            {"time": "18:00", "text": "Sheltered Ganga Aarti viewing pavilion at Parmarth Niketan"},
        ],
    },
    "kyoto": {
        "destination": "Kyoto",
        "original_title": "Shrines & Bamboo Trails",
        "alt_title": "Covered Arcades & Tea Houses",
        "disruptions": {
            "rain": "Steady Kyoto rain forecast all afternoon.",
            "closure": "Garden pavilion undergoing seasonal preservation.",
            "transport_delay": "Bus crowding in Higashiyama.",
            "unavailable": "River boat ride suspended.",
        },
        "original": [
            {"time": "07:30", "text": "Fushimi Inari mountain torii hike"},
            {"time": "13:00", "text": "Arashiyama bamboo & river walk"},
            {"time": "16:30", "text": "Philosopher's Path canal stroll"},
        ],
        "alternative": [
            {"time": "09:30", "text": "Kyoto National Museum & Sanjusangendo Hall (indoors)"},
            {"time": "12:30", "text": "Nishiki Covered Market food tour (rain-proof arcade)"},
            {"time": "15:00", "text": "Private indoor tatami tea ceremony in Gion"},
            {"time": "18:30", "text": "Covered izakaya alley dinner in Pontocho"},
        ],
    },
    "paris": {
        "destination": "Paris",
        "original_title": "Gardens & Seine Cruise",
        "alt_title": "Museums & Covered Passages",
        "disruptions": {
            "rain": "Showers expected across central Paris.",
            "closure": "Outdoor park gates closed due to high winds.",
            "transport_delay": "RER / Metro line maintenance delay.",
            "unavailable": "Open-top river boat cancelled.",
        },
        "original": [
            {"time": "09:30", "text": "Jardin du Luxembourg & Montmartre hilltop walk"},
            {"time": "13:30", "text": "Canal Saint-Martin picnic"},
            {"time": "18:30", "text": "Open-deck Seine river cruise"},
        ],
        "alternative": [
            {"time": "09:30", "text": "Louvre or Musée d'Orsay indoor masterpieces"},
            {"time": "13:00", "text": "Bistro lunch inside historic Galerie Vivienne covered passage"},
            {"time": "15:30", "text": "Le Marais patisserie & hot chocolate trail"},
            {"time": "19:30", "text": "Intimate cellar jazz club in Saint-Germain"},
        ],
    },
}


@replanner_bp.route("/plan-b", methods=["GET"])
def get_plan_b():
    dest = (request.args.get("destination") or "").strip()
    disruption = (request.args.get("disruption") or "rain").strip().lower().replace(" ", "_")

    if not dest:
        return jsonify({"status": "error", "message": "Please specify a destination first"}), 400

    key = dest.lower()
    if key in PLAN_B_DATA:
        entry = PLAN_B_DATA[key]
        reason = entry["disruptions"].get(disruption, entry["disruptions"]["rain"])
        return jsonify({
            "destination": entry["destination"],
            "disruption": disruption,
            "reason": reason,
            "original_title": entry["original_title"],
            "alt_title": entry["alt_title"],
            "original": entry["original"],
            "alternative": entry["alternative"],
        })

    # Dynamic Plan B for any custom destination
    pretty = dest.title()
    reason_map = {
        "rain": f"Heavy rain is forecast in {pretty} from late morning.",
        "closure": f"Key outdoor landmark in {pretty} is closed for maintenance today.",
        "transport_delay": f"Local transit delays are affecting routes around {pretty}.",
        "unavailable": f"Your scheduled outdoor activity in {pretty} is unavailable today.",
    }
    return jsonify({
        "destination": pretty,
        "disruption": disruption,
        "reason": reason_map.get(disruption, reason_map["rain"]),
        "original_title": f"Original Plan · {pretty}",
        "alt_title": f"Backup Plan · {pretty}",
        "original": [
            {"time": "09:00", "text": f"Outdoor sightseeing & viewpoints in {pretty}"},
            {"time": "13:30", "text": f"Open-air market walk & street food in {pretty}"},
            {"time": "17:00", "text": f"Sunset promenade in {pretty}"},
        ],
        "alternative": [
            {"time": "09:30", "text": f"City museum & indoor heritage gallery in {pretty}"},
            {"time": "13:00", "text": f"Cozy indoor café & regional lunch in {pretty}"},
            {"time": "15:30", "text": f"Local artisan workshop or covered bazaar in {pretty}"},
            {"time": "18:30", "text": f"Indoor cultural performance & dinner in {pretty}"},
        ],
    })
