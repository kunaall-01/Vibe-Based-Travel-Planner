import hashlib
import json

NUMBER_WORDS = {
    1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five",
    6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten",
}

DEFAULT_COVERS = {
    "manali": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80",
    "jaipur": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=80",
    "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80",
    "udaipur": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=80",
    "agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=80",
    "rishikesh": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=80",
    "kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80",
    "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80",
}

VIBE_FALLBACK_COVERS = {
    "mountain": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80",
    "beach": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    "heritage": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=80",
    "adventure": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80",
    "food": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80",
    "city": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80",
}

VIBE_THEMES = {
    "mountain": {
        "genre": "Coming-of-age alpine drama",
        "mood": "Peaceful, crisp, reflective",
        "titles": [
            "{dur} Days Above the Timberline",
            "Where the Pine Roads Turn to Mist",
            "Letters from {dest}",
            "Still Air Over {dest}",
        ],
        "taglines": [
            "Some journeys take you higher. Others quietly bring you back to yourself.",
            "In the hush of cedar valleys, even silence learns how to speak.",
            "Leave the noise at sea level; keep what the mountains hand you.",
        ],
        "soundtrack": {
            "name": "Indie Acoustic & Alpine Ambient",
            "genres": ["Indie Acoustic", "Soft Piano", "Ambient Nature"],
            "atmosphere": "Warm fingerpicked guitar for winding mountain roads, gentle piano for misty mornings.",
            "tempo": "Slow · Reflective (72 BPM)",
        },
        "palette": [
            {"name": "Misty Blue", "hex": "#6E8EA1"},
            {"name": "Warm Cream", "hex": "#F4EFE6"},
            {"name": "Pine Sage", "hex": "#3B594B"},
            {"name": "Slate Dusk", "hex": "#1F2E2C"},
        ],
    },
    "beach": {
        "genre": "Sun-drenched coastal romance",
        "mood": "Unhurried, salt-warm, nostalgic",
        "titles": [
            "Salt on the Film: {dest}",
            "{dur} Golden Hours in {dest}",
            "Tides That Wait for No Clock",
            "After the Monsoon Sun",
        ],
        "taglines": [
            "No alarms, no rush — just tide tables and amber light.",
            "Some places are measured in sunsets, not itineraries.",
            "Salt air on your skin, and nowhere else you need to be.",
        ],
        "soundtrack": {
            "name": "Dreamy Bossa & Coastal Lo-Fi",
            "genres": ["Dreamy Indie", "Warm Acoustic", "Coastal Lo-Fi"],
            "atmosphere": "Breezy nylon-string chords for golden-hour coves and late-night veranda talks.",
            "tempo": "Laid-back · Swaying (84 BPM)",
        },
        "palette": [
            {"name": "Seafoam Mist", "hex": "#72A29E"},
            {"name": "Sunlit Sand", "hex": "#F8F1E3"},
            {"name": "Driftwood Brass", "hex": "#B48352"},
            {"name": "Deep Tide", "hex": "#1B3B44"},
        ],
    },
    "heritage": {
        "genre": "Historical architectural chronicle",
        "mood": "Regal, timeless, poetic",
        "titles": [
            "Sandstone & Afternoon Light",
            "{dur} Chapters in {dest}",
            "The Courtyard Keeper",
            "Echoes Along the Old Wall",
        ],
        "taglines": [
            "Every archway holds a century; every courtyard keeps a quiet secret.",
            "Walk slow enough and the old stones start telling their own story.",
            "A portrait in warm sandstone, brass lanterns, and morning chai.",
        ],
        "soundtrack": {
            "name": "Classical Strings & Folk Fusion",
            "genres": ["Neoclassical Strings", "Acoustic Folk", "Ambient Instrumental"],
            "atmosphere": "Graceful bowed strings for sunrise forts and warm acoustic notes for bazaar dusk.",
            "tempo": "Measured · Cinematic (78 BPM)",
        },
        "palette": [
            {"name": "Sandstone Rose", "hex": "#B57858"},
            {"name": "Parchment Cream", "hex": "#F7F1E4"},
            {"name": "Haveli Olive", "hex": "#4B5D4E"},
            {"name": "Royal Ink", "hex": "#213633"},
        ],
    },
    "adventure": {
        "genre": "High-adrenaline expedition film",
        "mood": "Bold, untamed, exhilarating",
        "titles": [
            "Before the River Calms",
            "{dur} Days Beyond the Map",
            "Chasing Horizon Lines in {dest}",
            "The Detour Was the Point",
        ],
        "taglines": [
            "The best scenes never happen on the main highway.",
            "Packed light, left early, and said yes to the steeper trail.",
            "Some trips are planned. The unforgettable ones are improvised.",
        ],
        "soundtrack": {
            "name": "Cinematic Pulse & Energetic Strings",
            "genres": ["Cinematic Orchestral", "Post-Rock", "Percussive Indie"],
            "atmosphere": "Rising drums and sweeping instrumentals built for mountain passes and river rapids.",
            "tempo": "Driving · Uplifting (118 BPM)",
        },
        "palette": [
            {"name": "Burnt Ember", "hex": "#C2593B"},
            {"name": "Forest Canopy", "hex": "#254236"},
            {"name": "Trail Amber", "hex": "#D89A48"},
            {"name": "Obsidian Charcoal", "hex": "#1B2220"},
        ],
    },
    "food": {
        "genre": "Culinary slice-of-life feature",
        "mood": "Warm, sensory, nostalgic",
        "titles": [
            "Lanterns After Last Order",
            "A Table for {dur} Evenings in {dest}",
            "Notes from the Night Market",
            "The Taste of {dest}",
        ],
        "taglines": [
            "Every neighborhood introduces itself first through steam and spice.",
            "Follow the locals past closing time — that’s where the real story begins.",
            "Small tables, late hours, and flavors you’ll spend years trying to recreate.",
        ],
        "soundtrack": {
            "name": "Warm Vinyl Jazz & Lo-Fi",
            "genres": ["Warm Lo-Fi", "Retro Indie", "Café Jazz"],
            "atmosphere": "Crackling vinyl warmth and mellow Rhodes keys for covered markets and late dinners.",
            "tempo": "Groovy · Intimate (88 BPM)",
        },
        "palette": [
            {"name": "Film Amber", "hex": "#C8873A"},
            {"name": "Vanilla Cream", "hex": "#F8F2E6"},
            {"name": "Espresso Roast", "hex": "#5C3E34"},
            {"name": "Market Olive", "hex": "#3B4A3C"},
        ],
    },
    "city": {
        "genre": "Modern urban nocturne",
        "mood": "Electric, stylish, restless",
        "titles": [
            "Midnight Bridges & Espresso",
            "{dur} Nights Under {dest} Lights",
            "After Hours in {dest}",
            "The Neon Interlude",
        ],
        "taglines": [
            "Cities don’t sleep — they just change their lighting.",
            "Between corner bookstores and rooftop rain, the night belongs to wanderers.",
            "Catching the last tram with stories still unfinished.",
        ],
        "soundtrack": {
            "name": "Midnight Synthwave & Dream Pop",
            "genres": ["Synthwave", "Indie Electronic", "Late-Night Jazz"],
            "atmosphere": "Shimmering synths and crisp beats for illuminated boulevards and rooftop bars.",
            "tempo": "Steady · Kinetic (110 BPM)",
        },
        "palette": [
            {"name": "Champagne Gold", "hex": "#E2BF8A"},
            {"name": "Midnight Indigo", "hex": "#1E2538"},
            {"name": "Velvet Rose", "hex": "#B45B6C"},
            {"name": "Ivory Mist", "hex": "#F5F2EC"},
        ],
    },
}

CHAPTER_TEMPLATES = [
    {
        "title": "THE ESCAPE",
        "subtitle": "Where ordinary routines fade in the rearview",
        "description": "Leaving behind the familiar, the story opens in {dest} — first impressions, warm local flavors, and the golden light that sets the tone for everything ahead.",
    },
    {
        "title": "THE PLOT TWIST",
        "subtitle": "Beyond the obvious postcards",
        "description": "Somewhere between hidden trails and unhurried corners of {dest}, the journey stops feeling like a checklist and becomes a story worth retelling.",
    },
    {
        "title": "THE GOLDEN HOUR",
        "subtitle": "Where the pace softens and memories settle",
        "description": "Craft, conversation, and lingering views across {dest} — the middle act where every small detour turns into your favourite scene.",
    },
    {
        "title": "THE INTERLUDE",
        "subtitle": "Unplanned detours and quiet discovery",
        "description": "An extra day to wander slowly through {dest}, lingering at cafés and corners you would have missed in a hurry.",
    },
    {
        "title": "THE CRESCENDO",
        "subtitle": "The highest view of the journey",
        "description": "Everything builds toward one unforgettable stretch of {dest} — wide horizons, lively evenings, and film rolls nearly full.",
    },
]

FINAL_CHAPTER_TEMPLATE = {
    "title": "THE FINAL SCENE",
    "subtitle": "A peaceful closing credit",
    "description": "Every good story ends, yet {dest} leaves quiet echoes in your pocket — a slow morning breakfast, one last look back, and the promise of a sequel.",
}


def _pick_index(seed_text, length):
    digest = hashlib.md5(seed_text.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % max(1, length)


def generate_movie_identity(destination, vibe, days, budget=25000, img=None, dates=None, style=None):
    """Build a complete, non-generic cinematic movie identity grounded in the real itinerary."""
    dest_clean = (destination or "Your Destination").strip()
    vibe_key = (vibe or "mountain").strip().lower()
    if vibe_key not in VIBE_THEMES:
        vibe_key = "mountain"

    theme = VIBE_THEMES[vibe_key]
    day_list = days or []
    num_days = max(1, len(day_list))
    dur_word = NUMBER_WORDS.get(num_days, str(num_days))

    seed = f"{dest_clean.lower()}-{vibe_key}-{num_days}-{style or ''}"
    title_tmpl = theme["titles"][_pick_index(seed + "-title", len(theme["titles"]))]
    tagline = theme["taglines"][_pick_index(seed + "-tag", len(theme["taglines"]))]
    movie_title = title_tmpl.format(dest=dest_clean, dur=dur_word)

    # Pull actual highlights from the real itinerary days for the synopsis
    highlights = []
    for d in day_list:
        for it in (d.get("items") or []):
            if it.get("text"):
                highlights.append(it["text"])
    sample_a = highlights[0] if len(highlights) > 0 else f"arriving in {dest_clean}"
    sample_b = highlights[min(3, len(highlights) - 1)] if len(highlights) > 1 else f"exploring {dest_clean}"

    synopsis = (
        f"A {dur_word.lower()}-day {vibe_key} story set in {dest_clean} — beginning with {sample_a.lower()}, "
        f"unfolding through {sample_b.lower()}, and lingering over the unhurried moments that turn a trip into cinema."
    )

    cover_image = (
        img
        or DEFAULT_COVERS.get(dest_clean.lower())
        or VIBE_FALLBACK_COVERS.get(vibe_key)
        or DEFAULT_COVERS["manali"]
    )

    # Convert each actual itinerary day into a story chapter WITHOUT altering real times or activities
    story_arc = []
    chapter_titles = []
    for idx, d in enumerate(day_list):
        day_num = d.get("day") or (idx + 1)
        if num_days > 1 and idx == num_days - 1:
            chap = FINAL_CHAPTER_TEMPLATE
        else:
            chap = CHAPTER_TEMPLATES[idx % len(CHAPTER_TEMPLATES)]

        chap_label = f"DAY {day_num} — {chap['title']}"
        chapter_titles.append(chap_label)
        story_arc.append({
            "day": day_num,
            "chapter_number": f"CHAPTER {str(day_num).zfill(2)}",
            "chapter_title": chap["title"],
            "full_chapter_title": chap_label,
            "subtitle": d.get("title") or chap["subtitle"],
            "narrative": chap["description"].format(dest=dest_clean),
            "items": d.get("items") or [],
        })

    return {
        "movie_title": movie_title,
        "tagline": tagline,
        "synopsis": synopsis,
        "genre": theme["genre"],
        "mood": theme["mood"],
        "soundtrack_mood": theme["soundtrack"],
        "color_palette": theme["palette"],
        "cover_image": cover_image,
        "story_arc": story_arc,
        "chapter_titles": chapter_titles,
        "duration_days": num_days,
        "destination": dest_clean,
        "vibe": vibe_key,
        "budget": budget,
        "dates": dates or "14 – 17 Dec 2026",
    }


def serialize_movie_row(row):
    if not row:
        return None
    return {
        "movie_id": row["movie_id"],
        "itinerary_id": row["itinerary_id"],
        "user_id": row["user_id"],
        "share_slug": row["share_slug"],
        "movie_title": row["movie_title"],
        "tagline": row["tagline"],
        "synopsis": row["synopsis"],
        "genre": row["genre"],
        "mood": row["mood"],
        "soundtrack_mood": json.loads(row["soundtrack_mood"]),
        "color_palette": json.loads(row["color_palette"]),
        "cover_image": row["cover_image"],
        "story_arc": json.loads(row["story_arc"]),
        "chapter_titles": json.loads(row["chapter_titles"]),
        "trip_status": row["trip_status"],
        "created_at": row["created_at"],
    }


def serialize_memory_row(row):
    if not row:
        return None
    photos = []
    try:
        photos = json.loads(row.get("photos_json") or "[]")
    except Exception:
        photos = []
    return {
        "memory_id": row["memory_id"],
        "itinerary_id": row["itinerary_id"],
        "movie_id": row["movie_id"],
        "favorite_destination": row.get("favorite_destination") or "",
        "favorite_activity": row.get("favorite_activity") or "",
        "personal_caption": row.get("personal_caption") or "",
        "post_trip_storyline": row.get("post_trip_storyline") or "",
        "trip_rating": row.get("trip_rating") or 5,
        "photos": photos,
        "updated_at": row.get("updated_at") or "",
    }
