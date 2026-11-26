import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'travel_planner.db')


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def fetch_all(query, params=None):
    conn = get_db_connection()
    try:
        rows = conn.execute(query, params or ()).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def fetch_one(query, params=None):
    conn = get_db_connection()
    try:
        row = conn.execute(query, params or ()).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def execute_query(query, params=None):
    conn = get_db_connection()
    try:
        cur = conn.execute(query, params or ())
        conn.commit()
        return cur.lastrowid
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables and seed community & catalog data if needed."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT DEFAULT '',
        city TEXT DEFAULT '',
        role TEXT DEFAULT 'traveler',
        bio TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        favorite_vibes TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS destinations (
        destination_id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        primary_vibe TEXT DEFAULT 'heritage',
        description TEXT,
        image_url TEXT,
        latitude REAL,
        longitude REAL
    );

    CREATE TABLE IF NOT EXISTS activities (
        activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        vibe TEXT NOT NULL,
        duration_hours REAL DEFAULT 2.0,
        price REAL NOT NULL,
        rating REAL DEFAULT 4.0,
        is_indoor INTEGER DEFAULT 0,
        disruption_fallback TEXT DEFAULT 'none',
        meta TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hotels (
        hotel_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        price_per_night REAL NOT NULL,
        facilities TEXT,
        rating REAL DEFAULT 4.0,
        meta TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restaurants (
        restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        cuisine TEXT,
        avg_price REAL NOT NULL,
        price_range TEXT NOT NULL,
        rating REAL DEFAULT 4.0,
        meta TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transport (
        transport_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        mode TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        origin TEXT NOT NULL,
        departure_time TEXT,
        arrival_time TEXT,
        price REAL NOT NULL,
        rating REAL DEFAULT 4.0,
        meta TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crowd_info (
        crowd_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        place_name TEXT NOT NULL,
        crowd_level TEXT NOT NULL,
        crowd_percentage INTEGER,
        quiet_times TEXT NOT NULL,
        suggestion TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS itineraries (
        itinerary_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        destination_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        vibe TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days INTEGER NOT NULL,
        budget REAL NOT NULL,
        status TEXT DEFAULT 'Upcoming',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS itinerary_details (
        detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        day_title TEXT,
        time_slot TEXT NOT NULL,
        scheduled_time TEXT,
        activity_title TEXT NOT NULL,
        activity_id INTEGER,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_ref TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        itinerary_id INTEGER,
        destination_name TEXT DEFAULT '',
        booking_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_meta TEXT DEFAULT '',
        travel_date TEXT NOT NULL,
        travellers INTEGER NOT NULL DEFAULT 1,
        total_price REAL NOT NULL,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'Paid',
        booking_status TEXT DEFAULT 'Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_budgets (
        budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        destination_name TEXT NOT NULL,
        total_budget REAL NOT NULL DEFAULT 30000,
        days INTEGER NOT NULL DEFAULT 3,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, destination_name),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_expenses (
        expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id INTEGER,
        user_id INTEGER NOT NULL,
        destination_name TEXT NOT NULL DEFAULT 'General',
        category TEXT NOT NULL,
        estimated_amount REAL NOT NULL DEFAULT 0,
        actual_amount REAL NOT NULL DEFAULT 0,
        day_number INTEGER DEFAULT 1,
        note TEXT,
        expense_date TEXT,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS travel_buddy_profiles (
        profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        preferred_vibe TEXT,
        interests TEXT,
        travel_style TEXT,
        preferred_destination_id INTEGER,
        available_from TEXT,
        available_to TEXT,
        is_open_to_connect INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (preferred_destination_id) REFERENCES destinations(destination_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS connection_requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'Pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_activities (
        group_activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        host_user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        place_label TEXT DEFAULT '',
        description TEXT,
        activity_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        max_participants INTEGER NOT NULL,
        tags TEXT,
        image_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE,
        FOREIGN KEY (host_user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_activity_participants (
        group_activity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_activity_id, user_id),
        FOREIGN KEY (group_activity_id) REFERENCES group_activities(group_activity_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_movies (
        movie_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id INTEGER UNIQUE,
        user_id INTEGER,
        share_slug TEXT NOT NULL UNIQUE,
        movie_title TEXT NOT NULL,
        tagline TEXT NOT NULL,
        synopsis TEXT NOT NULL,
        genre TEXT NOT NULL,
        mood TEXT NOT NULL,
        soundtrack_mood TEXT NOT NULL,
        color_palette TEXT NOT NULL,
        cover_image TEXT NOT NULL,
        story_arc TEXT NOT NULL,
        chapter_titles TEXT NOT NULL,
        trip_status TEXT DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_memories (
        memory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id INTEGER NOT NULL UNIQUE,
        movie_id INTEGER,
        user_id INTEGER NOT NULL,
        favorite_destination TEXT DEFAULT '',
        favorite_activity TEXT DEFAULT '',
        personal_caption TEXT DEFAULT '',
        post_trip_storyline TEXT DEFAULT '',
        trip_rating INTEGER DEFAULT 5,
        photos_json TEXT DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES trip_movies(movie_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rentals (
        rental_id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL,
        model_name TEXT NOT NULL,
        price_per_day REAL NOT NULL,
        rating REAL DEFAULT 4.5,
        vendor_name TEXT,
        meta TEXT,
        FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_items (
        saved_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id TEXT NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        destination TEXT DEFAULT '',
        price REAL DEFAULT 0,
        meta TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_checklists (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        checked INTEGER DEFAULT 0,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
        order_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        booking_payload TEXT NOT NULL,
        base_amount REAL NOT NULL,
        tax_amount REAL NOT NULL,
        convenience_fee REAL NOT NULL DEFAULT 99,
        insurance_fee REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        promo_code TEXT DEFAULT '',
        final_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'UPI',
        channel_detail TEXT DEFAULT '',
        otp_code TEXT DEFAULT '',
        txn_id TEXT DEFAULT '',
        auth_code TEXT DEFAULT '',
        status TEXT DEFAULT 'Created',
        expires_at TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS local_communities (
        community_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        community_name TEXT NOT NULL,
        city TEXT NOT NULL,
        specialty TEXT NOT NULL,
        languages TEXT DEFAULT 'English, Hindi',
        availability TEXT DEFAULT 'Weekends & Evenings',
        offer_type TEXT DEFAULT 'Free Community Meetup',
        bio TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        verified INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        msg_type TEXT DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS video_wall_posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_avatar TEXT DEFAULT '',
        destination TEXT NOT NULL,
        vibe TEXT DEFAULT 'mountain',
        caption TEXT NOT NULL,
        video_url TEXT DEFAULT '',
        poster_url TEXT DEFAULT '',
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS video_wall_likes (
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES video_wall_posts(post_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    """)

    # Safely add columns to connection_requests and geo columns to place tables
    cols = [r[1] for r in cur.execute("PRAGMA table_info(connection_requests)").fetchall()]
    if "request_type" not in cols:
        cur.execute("ALTER TABLE connection_requests ADD COLUMN request_type TEXT DEFAULT 'buddy'")
    if "destination" not in cols:
        cur.execute("ALTER TABLE connection_requests ADD COLUMN destination TEXT DEFAULT ''")
    if "preferred_date" not in cols:
        cur.execute("ALTER TABLE connection_requests ADD COLUMN preferred_date TEXT DEFAULT ''")

    for tbl in ("destinations", "activities", "hotels", "restaurants", "transport", "crowd_info", "rentals"):
        tcols = [r[1] for r in cur.execute(f"PRAGMA table_info({tbl})").fetchall()]
        if "latitude" not in tcols:
            cur.execute(f"ALTER TABLE {tbl} ADD COLUMN latitude REAL")
        if "longitude" not in tcols:
            cur.execute(f"ALTER TABLE {tbl} ADD COLUMN longitude REAL")

    # ---------- SEED COMMUNITY & CATALOG (only if destinations table is empty) ----------
    if cur.execute("SELECT COUNT(*) FROM destinations").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO destinations (slug,name,region,primary_vibe,description,image_url) VALUES (?,?,?,?,?,?)",
            [
                ('jaipur', 'Jaipur', 'Rajasthan, India', 'heritage', 'The Pink City known for sandstone forts, royal palaces, and vibrant bazaars.', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70'),
                ('goa', 'Goa', 'Goa, India', 'beach', 'Sun-drenched beaches, Portuguese heritage quarters, and coastal seafood shacks.', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70'),
                ('manali', 'Manali', 'Himachal Pradesh, India', 'mountain', 'High-altitude Himalayan town surrounded by pine forests, snow peaks, and river valleys.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70'),
                ('udaipur', 'Udaipur', 'Rajasthan, India', 'heritage', 'The City of Lakes famed for marble palaces, sunset boat rides, and rooftop dining.', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=70'),
                ('agra', 'Agra', 'Uttar Pradesh, India', 'heritage', 'Home to the Taj Mahal, Mughal gardens, and Agra Fort along the Yamuna.', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=70'),
                ('rishikesh', 'Rishikesh', 'Uttarakhand, India', 'adventure', 'Himalayan foothills, suspension bridges, river rafting, and Ganga aarti.', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=70'),
                ('kyoto', 'Kyoto', 'Japan', 'food', 'Historic temples, bamboo groves, lantern alleys, and Nishiki Market culinary trails.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=70'),
                ('paris', 'Paris', 'France', 'city', 'Riverside cafés, world-class art museums, late-night bistros, and Montmartre strolls.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=70'),
            ])

        cur.executemany(
            "INSERT INTO activities (destination_id,name,category,vibe,duration_hours,price,rating,is_indoor,disruption_fallback,meta) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [
                # Jaipur (1)
                (1, 'Amber Fort Sunrise Tour', 'Sightseeing', 'heritage', 3.0, 1200, 4.7, 0, 'none', '3 hrs · Guided'),
                (1, 'Block Printing Workshop', 'Workshop', 'heritage', 2.0, 900, 4.6, 1, 'rain', '2 hrs · Hands-on'),
                (1, 'Hot Air Balloon', 'Adventure', 'adventure', 1.0, 12000, 4.8, 0, 'none', '1 hr · Sunrise'),
                (1, 'Albert Hall Museum Visit', 'Museum', 'heritage', 2.0, 200, 4.4, 1, 'rain', 'Indoors · Art & History'),
                (1, 'Dal Baati Churma Cooking Class', 'Culinary', 'food', 2.5, 1100, 4.7, 1, 'rain', 'Hands-on evening class'),
                # Goa (2)
                (2, 'Palolem Sunset Kayak', 'Water Sports', 'beach', 2.0, 800, 4.6, 0, 'none', 'Calm bay paddle'),
                (2, 'Fontainhas Latin Quarter Walk', 'Heritage Walk', 'heritage', 2.0, 600, 4.5, 0, 'closure', 'Old Panjim lanes'),
                (2, 'Goan Spice Plantation & Indoor Tasting', 'Culinary', 'food', 3.0, 950, 4.6, 1, 'rain', 'Covered pavilion · Lunch'),
                (2, 'Tito Lane Nightlife Pass', 'Nightlife', 'city', 4.0, 1500, 4.2, 1, 'rain', 'Baga · Live music'),
                # Manali (3)
                (3, 'Solang Valley Paragliding & Ridge View', 'Adventure', 'mountain', 2.5, 2500, 4.7, 0, 'none', 'Alpine meadow flight'),
                (3, 'Jogini Waterfall Pine Forest Trek', 'Trekking', 'mountain', 3.5, 500, 4.6, 0, 'none', 'Vashisht mountain trail'),
                (3, 'Atal Tunnel & Sissu Valley Scenic Drive', 'Road Trip', 'adventure', 4.5, 2200, 4.8, 0, 'none', 'High-altitude valley'),
                (3, 'Old Manali Riverside Café & Bakery Hop', 'Food Walk', 'food', 2.0, 700, 4.5, 1, 'rain', 'Cozy wood-fire cafés'),
                (3, 'Museum of Himachal Culture & Folk Art', 'Museum', 'heritage', 1.5, 250, 4.4, 1, 'rain', 'Indoors · Mountain heritage'),
                (3, 'Himalayan Hot Springs & Spa at Vashisht', 'Wellness', 'mountain', 2.0, 600, 4.5, 1, 'rain', 'Covered thermal baths'),
                # Udaipur (4)
                (4, 'Lake Pichola Sunset Boat Ride', 'Boating', 'heritage', 1.5, 800, 4.8, 0, 'none', 'Golden hour cruise'),
                (4, 'Bagore Ki Haveli Folk Show', 'Cultural Show', 'heritage', 1.5, 300, 4.6, 1, 'rain', 'Indoor evening dance'),
                (4, 'Monsoon Palace Hill Drive', 'Sightseeing', 'adventure', 2.5, 950, 4.4, 0, 'none', 'Panoramic valley view'),
                # Agra (5)
                (5, 'Taj Mahal Sunrise Entry', 'Sightseeing', 'heritage', 3.0, 1300, 4.9, 0, 'none', 'Golden dawn marble view'),
                (5, 'Marble Inlay Workshop', 'Workshop', 'heritage', 2.0, 800, 4.6, 1, 'rain', 'Indoors · Artisan studio'),
                # Rishikesh (6)
                (6, 'Ganga White Water Rafting', 'Adventure', 'adventure', 3.0, 1200, 4.8, 0, 'none', '16km Shivpuri rapids'),
                (6, 'Evening Ganga Aarti at Triveni Ghat', 'Culture', 'heritage', 1.5, 0, 4.9, 0, 'none', 'Riverfront ritual'),
                (6, 'Indoor Sound Healing & Yoga Session', 'Wellness', 'mountain', 2.0, 700, 4.7, 1, 'rain', 'Covered riverside studio'),
                # Kyoto (7)
                (7, 'Fushimi Inari Early Hike', 'Sightseeing', 'mountain', 2.5, 0, 4.9, 0, 'none', 'Forest torii trail'),
                (7, 'Nishiki Covered Market Food Tour', 'Food Walk', 'food', 2.5, 3200, 4.8, 1, 'rain', 'Covered arcade · Tastings'),
                (7, 'Traditional Tea Ceremony Indoors', 'Culture', 'heritage', 1.5, 2400, 4.8, 1, 'rain', 'Tatami tea house'),
                # Paris (8)
                (8, 'Louvre Museum Curated Highlights', 'Museum', 'city', 3.0, 2200, 4.9, 1, 'rain', 'Indoors · Art masterpieces'),
                (8, 'Seine Evening Cruise & Bistro Walk', 'City', 'city', 2.5, 2800, 4.7, 0, 'none', 'Illuminated bridges'),
                (8, 'Le Marais Pastry & Patisserie Trail', 'Food Walk', 'food', 2.0, 2100, 4.8, 1, 'rain', 'Artisan bakeries'),
            ])

        cur.executemany(
            "INSERT INTO hotels (destination_id,name,location,price_per_night,facilities,rating,meta) VALUES (?,?,?,?,?,?,?)",
            [
                (1, 'Haveli Heritage Stay', 'Old City, Jaipur', 5200, 'Breakfast, Wi-Fi, Courtyard', 4.6, 'Old City · Breakfast included'),
                (1, 'The Pink Courtyard', 'C-Scheme, Jaipur', 7800, 'Pool, Wi-Fi, Restaurant', 4.4, 'C-Scheme · Pool'),
                (1, 'Zostel Jaipur', 'MI Road, Jaipur', 900, 'Shared Lounge, Lockers, Wi-Fi', 4.2, 'Hostel · Shared lounge'),
                (1, 'Rambagh Residency', 'Bhawani Singh Rd, Jaipur', 18500, 'Spa, Pool, Fine Dining', 4.9, 'Palace stay · Spa'),
                (2, 'Casa Colva Beach Resort', 'Colva, South Goa', 4200, 'Beach Access, Pool, Breakfast', 4.5, '2 min walk to beach'),
                (2, 'Baga Breeze Hostel', 'Baga, North Goa', 1100, 'Cafe, Wi-Fi, Scooters', 4.1, 'Budget · Near nightlife'),
                (3, 'Mountain View Hotel', 'Mall Road, Manali', 2500, 'Heater, Balcony, Wi-Fi', 4.3, 'Valley facing rooms'),
                (3, 'Snow Valley Resort', 'Log Huts Area, Manali', 4000, 'Bonfire, Restaurant, Mountain View', 4.6, 'Pine forest stay'),
                (3, 'Zostel Old Manali', 'Manu Temple Rd, Manali', 950, 'Mountain Café, Bonfire, Wi-Fi', 4.5, 'Hostel · Apple orchard views'),
                (4, 'Lake View Boutique Hotel', 'Hanuman Ghat, Udaipur', 6000, 'Rooftop Lake View, Breakfast', 4.7, 'Overlooking Lake Pichola'),
                (4, 'Zostel Udaipur', 'Chandpole, Udaipur', 950, 'Rooftop Cafe, Wi-Fi', 4.4, 'Lakeside hostel'),
                (5, 'Tajview Courtyard', 'Fatehabad Rd, Agra', 4800, 'Taj View, Pool, Breakfast', 4.5, '1.5 km from Taj Mahal'),
                (6, 'Ganga Kinare Riverside Stay', 'Tapovan, Rishikesh', 3400, 'River View, Yoga Deck, Breakfast', 4.6, 'Overlooking the Ganges'),
                (7, 'Higashiyama Machiya Ryokan', 'Gion, Kyoto', 9500, 'Tatami Rooms, Onsen Bath, Tea', 4.8, 'Traditional wooden townhouse'),
                (8, 'Hotel Le Saint-Grégoire', 'Saint-Germain, Paris', 14200, 'Balcony, Espresso Bar, Metro', 4.7, 'Left Bank boutique hotel'),
            ])

        cur.executemany(
            "INSERT INTO restaurants (destination_id,name,location,cuisine,avg_price,price_range,rating,meta) VALUES (?,?,?,?,?,?,?,?)",
            [
                (1, 'Laxmi Misthan Bhandar', 'Johari Bazaar, Jaipur', 'Rajasthani', 600, 'Budget', 4.4, 'Rajasthani · Johari Bazaar'),
                (1, 'Tapri Central', 'C-Scheme, Jaipur', 'Cafe & Snacks', 450, 'Budget', 4.5, 'Café · Tea & snacks'),
                (1, '1135 AD', 'Amber Fort, Jaipur', 'Royal Rajasthani', 3500, 'Luxury', 4.7, 'Fine dining · Amber Fort'),
                (2, "Britto's Shack", 'Baga Beach, Goa', 'Goan Seafood', 1200, 'Moderate', 4.4, 'Beachfront · Seafood'),
                (2, 'Gunpowder', 'Assagao, Goa', 'South Indian & Coastal', 1400, 'Moderate', 4.7, 'Garden courtyard dining'),
                (3, 'Himalayan Cafe', 'Old Manali, Manali', 'Cafe & Continental', 500, 'Budget', 4.4, 'Wood-fired pizzas & coffee'),
                (3, "Johnson's Cafe", 'Circuit House Rd, Manali', 'Himachali & Trout', 1100, 'Moderate', 4.6, 'Fresh river trout'),
                (4, 'Ambrai Restaurant', 'Hanuman Ghat, Udaipur', 'Mewari & North Indian', 1800, 'Luxury', 4.8, 'Waterfront palace view'),
                (4, "Jheel's Ginger Coffee Bar", 'Gangaur Ghat, Udaipur', 'Cafe', 500, 'Budget', 4.5, 'Lakeside breakfast spot'),
                (5, 'Pinch of Spice', 'Tajganj, Agra', 'Mughlai & North Indian', 900, 'Moderate', 4.5, 'Classic Mughlai curries'),
                (6, 'Little Buddha Cafe', 'Laxman Jhula, Rishikesh', 'Healthy & Tibetan', 550, 'Budget', 4.6, 'Riverfront treehouse café'),
                (7, 'Gion Karyo', 'Gion, Kyoto', 'Kaiseki Japanese', 4500, 'Luxury', 4.8, 'Seasonal Kyoto cuisine'),
                (8, 'Café de Flore', 'Saint-Germain, Paris', 'French Bistro', 2200, 'Moderate', 4.5, 'Historic corner café'),
            ])

        cur.executemany(
            "INSERT INTO transport (destination_id,mode,provider_name,origin,departure_time,arrival_time,price,rating,meta) VALUES (?,?,?,?,?,?,?,?,?)",
            [
                (1, 'Flight', 'IndiGo 6E-203', 'Delhi (DEL)', '06:10', '07:05', 3400, 4.1, '06:10 – 07:05 · Non-stop'),
                (1, 'Train', 'Shatabdi 12015', 'New Delhi', '06:05', '10:40', 850, 4.5, '06:05 – 10:40 · Chair car'),
                (1, 'Bus', 'RSRTC Volvo AC', 'Delhi Bikaner House', '07:00', '12:30', 650, 4.0, '07:00 – 12:30 · Seater'),
                (2, 'Flight', 'Air India AI-885', 'Delhi (DEL)', '11:15', '13:55', 5400, 4.3, 'Non-stop · 2h 40m'),
                (2, 'Train', 'Konkan Kanya Express', 'Mumbai', '23:05', '10:45', 950, 4.4, 'Overnight coastal sleeper'),
                (3, 'Bus', 'HRTC Himsuta Volvo', 'Delhi ISBT', '19:30', '07:30', 1200, 4.4, 'Overnight AC Semi-Sleeper'),
                (3, 'Flight', 'Alliance Air · DEL → KUU', 'Delhi (DEL)', '07:15', '08:40', 5800, 4.2, 'Kullu Bhuntar Airport · Mountain hop'),
                (3, 'Cab', 'Himalayan Innova Cab', 'Chandigarh', '07:00', '14:30', 4800, 4.6, 'Private SUV · Scenic highway'),
                (4, 'Flight', 'IndiGo 6E-512', 'Delhi (DEL)', '18:20', '19:45', 4100, 4.2, 'Non-stop · 1h 25m'),
                (4, 'Train', 'Mewar Express 12963', 'Hazrat Nizamuddin', '18:25', '07:15', 780, 4.3, 'Overnight 3AC'),
                (5, 'Train', 'Gatimaan Express 12050', 'Hazrat Nizamuddin', '08:10', '09:50', 750, 4.7, 'Fastest morning train · 1h 40m'),
                (6, 'Bus', 'Uttarakhand Volvo AC', 'Delhi ISBT', '22:00', '04:30', 700, 4.3, 'Overnight AC highway coach'),
                (7, 'Train', 'JR Tokaido Shinkansen', 'Tokyo Station', '08:30', '10:45', 8200, 4.9, 'Bullet train · 2h 15m'),
                (8, 'Flight', 'Air France AF-225', 'Delhi (DEL)', '01:55', '07:20', 42000, 4.6, 'Direct overnight to CDG'),
            ])

        cur.executemany(
            "INSERT INTO crowd_info (destination_id,place_name,crowd_level,crowd_percentage,quiet_times,suggestion) VALUES (?,?,?,?,?,?)",
            [
                (1, 'Hawa Mahal', 'High', 88, 'Before 9:00 AM or after 5:30 PM', 'Arrive right at opening for clean photos'),
                (1, 'Amber Fort', 'Moderate', 56, '8:00 AM - 10:00 AM (Weekdays)', 'Book composite ticket online in advance'),
                (1, 'Nahargarh Fort', 'Low', 30, '4:30 PM - 6:30 PM', 'Ideal for quiet sunset views over Jaipur'),
                (1, 'Bapu Bazaar', 'High', 79, 'Before 11:00 AM', 'Mid-morning is easiest for browsing textiles'),
                (2, 'Baga Beach', 'High', 85, '7:00 AM - 9:30 AM', 'Visit early morning or head to South Goa'),
                (2, 'Fontainhas Latin Quarter', 'Moderate', 45, '8:30 AM - 11:00 AM', 'Morning light is best for pastel Portuguese lanes'),
                (2, 'Agonda Beach', 'Low', 25, 'Anytime', 'Great alternative for peaceful beach walks'),
                (3, 'Solang Valley', 'High', 82, '8:00 AM - 10:00 AM', 'Visit early before gondola and traffic queues build'),
                (3, 'Hadimba Temple', 'Moderate', 55, '9:00 AM - 11:00 AM', 'Peaceful under the cedar canopy in morning hours'),
                (3, 'Jogini Waterfall Trail', 'Low', 28, '7:30 AM - 10:30 AM', 'Quiet pine-forest walk with crisp mountain air'),
                (3, 'Old Manali Bridge & Cafés', 'Moderate', 52, '10:00 AM - 1:00 PM', 'Relaxed riverside seating before evening rush'),
                (4, 'City Palace', 'High', 80, '9:00 AM - 10:00 AM', 'Visit shortly after opening'),
                (4, 'Fateh Sagar Lake', 'Moderate', 48, '7:00 AM - 9:00 AM', 'Calm morning promenade walk'),
                (4, 'Saheliyon Ki Bari', 'Low', 28, '8:00 AM - 11:00 AM', 'Good option for a quieter garden visit'),
                (5, 'Taj Mahal East Gate', 'High', 90, '5:45 AM - 7:30 AM', 'Sunrise slot offers shortest queues and soft light'),
                (5, 'Mehtab Bagh Gardens', 'Low', 24, '4:30 PM - 6:00 PM', 'Serene river-bank sunset view across from Taj'),
                (6, 'Laxman Jhula Market', 'High', 78, '7:00 AM - 9:30 AM', 'Walk early before daytime rafters arrive'),
                (6, 'Neer Garh Waterfall', 'Low', 30, '8:00 AM - 10:30 AM', 'Uncrowded forest waterfall trail'),
                (7, 'Fushimi Inari Shrine', 'High', 84, '6:30 AM - 8:00 AM', 'Hike past the midpoint torii gates for solitude'),
                (7, 'Philosopher Path', 'Low', 26, '8:00 AM - 10:00 AM', 'Quiet canal stroll under cherry/maple trees'),
                (8, 'Louvre Pyramid Entrance', 'High', 88, '9:00 AM (Wed/Fri evening)', 'Use Carrousel underground entrance to skip queues'),
                (8, 'Canal Saint-Martin', 'Low', 27, '9:00 AM - 12:00 PM', 'Laid-back morning coffee along the locks'),
            ])

    # ---------- SEED COMMUNITY PROFILES (only if users table is empty) ----------
    if cur.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        demo_pw = generate_password_hash("travel123", method="pbkdf2:sha256")
        cur.executemany(
            "INSERT INTO users (full_name,email,password_hash,phone,city,role,bio,avatar_url) VALUES (?,?,?,?,?,?,?,?)",
            [
                ('Gauri Bansal', 'gauri@travelplanner.in', demo_pw, '9876543210', 'Noida', 'traveler', 'B.Tech student exploring forts, mountains, and street food.', 'https://i.pravatar.cc/200?img=47'),
                ('Kunal Chauhan', 'kunal@travelplanner.in', demo_pw, '9876543211', 'Delhi', 'traveler', 'Photographer looking for a Rajasthan road-trip partner.', 'https://i.pravatar.cc/200?img=12'),
                ('Atharva Singh', 'atharva@travelplanner.in', demo_pw, '9876543212', 'Noida', 'traveler', 'Weekend traveller, loves mountain trails and street food.', 'https://i.pravatar.cc/200?img=11'),
                ('Kabir Singh', 'kabir@travelplanner.in', demo_pw, '9876543213', 'Gurugram', 'traveler', 'Trekking the Himalayas every winter.', 'https://i.pravatar.cc/200?img=15'),
                ('Meera Sharma', 'meera@travelplanner.in', demo_pw, '9876543214', 'Jaipur', 'local_guide', 'Heritage walk guide, knows every lane of the old city.', 'https://i.pravatar.cc/200?img=32'),
                ('Raghav Joshi', 'raghav@travelplanner.in', demo_pw, '9876543215', 'Udaipur', 'local_guide', 'Boatman turned storyteller on Lake Pichola.', 'https://i.pravatar.cc/200?img=53'),
            ])

        cur.executemany(
            "INSERT INTO travel_buddy_profiles (user_id,preferred_vibe,interests,travel_style,preferred_destination_id,available_from,available_to,is_open_to_connect) VALUES (?,?,?,?,?,?,?,?)",
            [
                (1, 'heritage', 'Forts, Street Food, Photography', 'Budget Explorer', 1, '2026-12-14', '2026-12-21', 1),
                (2, 'heritage', 'Photography, Road trips, Architecture', 'Slow Traveler', 1, '2026-12-13', '2026-12-20', 1),
                (3, 'mountain', 'Trekking, Street Food, Cafes', 'Weekend Hopper', 3, '2026-12-14', '2026-12-18', 1),
                (4, 'mountain', 'Trekking, Camping, Snow Trails', 'Backpacker', 3, '2026-12-20', '2026-12-28', 1),
            ])

        cur.executemany(
            "INSERT INTO group_activities (destination_id,host_user_id,title,place_label,description,activity_date,time_slot,max_participants,tags,image_url) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [
                (1, 5, 'Amber Fort Sunrise Walk', 'Jaipur · 16 Dec', 'Easy-paced heritage walk with chai after.', '2026-12-16', 'Morning', 12, 'Group, Morning, Heritage', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70'),
                (3, 4, 'Jogini Waterfall Morning Hike', 'Manali · 20 Dec', 'Crisp pine-forest trail with hot maggi at the summit.', '2026-12-20', 'Morning', 10, 'Group, Mountain, Trek', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70'),
                (4, 6, 'Lake Pichola Sunset Sail', 'Udaipur · 19 Dec', 'Small group boat ride with local stories.', '2026-12-19', 'Evening', 10, 'Group, Evening, Lakes', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=70'),
            ])

        cur.executemany(
            "INSERT INTO group_activity_participants (group_activity_id,user_id) VALUES (?,?)",
            [(1, 5), (1, 1), (1, 2), (2, 4), (3, 6), (3, 3)])

    # ---------- SEED RENTALS, LOCAL COMMUNITIES & VIDEO WALL ----------
    if cur.execute("SELECT COUNT(*) FROM rentals").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO rentals (destination_id,vehicle_type,model_name,price_per_day,rating,vendor_name,meta) VALUES (?,?,?,?,?,?,?)",
            [
                (1, 'Scooter', 'Honda Activa 6G', 500, 4.5, 'Pink City Wheels', 'Helmet included · Old City pickup'),
                (1, 'SUV', 'Mahindra Thar 4x4', 3200, 4.7, 'Rajputana Drives', 'Unlimited km · Nahargarh ready'),
                (2, 'Scooter', 'TVS Ntorq 125', 450, 4.6, 'Calangute Ride Rentals', 'Free cancellation · Dual helmet'),
                (2, 'Car', 'Maruti Baleno Manual', 1600, 4.4, 'Goa Drive Self-Rental', 'Airport pickup · AC'),
                (3, 'Bike', 'Royal Enfield Himalayan 411', 1500, 4.8, 'Manali Moto Adventures', 'Snow chains optional · Mall Rd'),
                (3, 'SUV', 'Toyota Innova Crysta', 3600, 4.7, 'Kullu Valley Cabs', 'Local mountain driver option'),
                (4, 'Scooter', 'Suzuki Access 125', 500, 4.5, 'Lake City Scooters', 'Chandpole pickup · Helmet'),
                (6, 'Bike', 'Bajaj Avenger 220', 900, 4.5, 'Tapovan Rides', 'Laxman Jhula pickup'),
            ])

    if cur.execute("SELECT COUNT(*) FROM local_communities").fetchone()[0] == 0:
        cur.executemany(
            "INSERT OR IGNORE INTO local_communities (user_id,community_name,city,specialty,languages,availability,offer_type,bio,avatar_url,verified) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [
                (5, 'Old Jaipur Walkers', 'Jaipur', 'Heritage Walks & Hidden Courtyards', 'English, Hindi', 'Daily Mornings', 'Guided Heritage Walk', 'Third-generation Jaipur storyteller hosting sunrise heritage trails, stepwell visits, and chai stops.', 'https://i.pravatar.cc/200?img=32', 1),
                (6, 'Lake Pichola Boatmen Guild', 'Udaipur', 'Lakeside Stories & Sunset Cruises', 'English, Hindi, Mewari', 'Evenings & Weekends', 'Sunset Boating & Stories', 'Boatman turned local historian sharing hidden ghats, palace lore, and quiet waterfront viewpoints.', 'https://i.pravatar.cc/200?img=53', 1),
            ])

    if cur.execute("SELECT COUNT(*) FROM video_wall_posts").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO video_wall_posts (user_id,author_name,author_avatar,destination,vibe,caption,video_url,poster_url,likes_count) VALUES (?,?,?,?,?,?,?,?,?)",
            [
                (4, 'Kabir Singh', 'https://i.pravatar.cc/200?img=15', 'Manali', 'mountain', 'First snowfall mist rolling over Solang ridge at 7:15 AM — bring warm gloves!', '', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=75', 24),
                (5, 'Meera Sharma', 'https://i.pravatar.cc/200?img=32', 'Jaipur', 'heritage', 'Morning light hitting Amber Fort courtyard before the buses arrive.', '', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=75', 19),
                (2, 'Kunal Chauhan', 'https://i.pravatar.cc/200?img=12', 'Goa', 'beach', 'Quiet South Goa cove in Palolem — best kayak water of the season.', '', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=75', 31),
                (6, 'Raghav Joshi', 'https://i.pravatar.cc/200?img=53', 'Udaipur', 'heritage', 'Golden hour reflections across Lake Pichola from Hanuman Ghat.', '', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=75', 16),
            ])

    _populate_coordinates(cur)
    conn.commit()
    conn.close()


def _populate_coordinates(cur):
    """Ensure every destination and place in the DB has accurate latitude/longitude."""
    dest_coords = {
        "jaipur": (26.9124, 75.7873),
        "goa": (15.2993, 74.1240),
        "manali": (32.2432, 77.1892),
        "udaipur": (24.5854, 73.7125),
        "agra": (27.1767, 78.0081),
        "rishikesh": (30.0869, 78.2676),
        "kyoto": (35.0116, 135.7681),
        "paris": (48.8566, 2.3522),
    }
    for slug, (lat, lng) in dest_coords.items():
        cur.execute("UPDATE destinations SET latitude = ?, longitude = ? WHERE LOWER(slug) = ?", (lat, lng, slug))

    hotel_coords = {
        "Haveli Heritage Stay": (26.9239, 75.8267),
        "The Pink Courtyard": (26.9061, 75.8006),
        "Zostel Jaipur": (26.9163, 75.8124),
        "Rambagh Residency": (26.8982, 75.8082),
        "Casa Colva Beach Resort": (15.2798, 73.9135),
        "Baga Breeze Hostel": (15.5553, 73.7517),
        "Mountain View Hotel": (32.2426, 77.1892),
        "Snow Valley Resort": (32.2489, 77.1765),
        "Zostel Old Manali": (32.2568, 77.1806),
        "Lake View Boutique Hotel": (24.5762, 73.6808),
        "Zostel Udaipur": (24.5795, 73.6794),
        "Tajview Courtyard": (27.1636, 78.0421),
        "Ganga Kinare Riverside Stay": (30.1255, 78.3230),
        "Higashiyama Machiya Ryokan": (35.0037, 135.7785),
        "Hotel Le Saint-Grégoire": (48.8484, 2.3264),
    }
    for name, (lat, lng) in hotel_coords.items():
        cur.execute("UPDATE hotels SET latitude = ?, longitude = ? WHERE name = ?", (lat, lng, name))

    rest_coords = {
        "Laxmi Misthan Bhandar": (26.9195, 75.8249),
        "Tapri Central": (26.9022, 75.8021),
        "1135 AD": (26.9855, 75.8513),
        "Britto's Shack": (15.5608, 73.7501),
        "Gunpowder": (15.5992, 73.7765),
        "Himalayan Cafe": (32.2573, 77.1818),
        "Johnson's Cafe": (32.2471, 77.1874),
        "Ambrai Restaurant": (24.5776, 73.6804),
        "Jheel's Ginger Coffee Bar": (24.5791, 73.6819),
        "Pinch of Spice": (27.1618, 78.0448),
        "Little Buddha Cafe": (30.1312, 78.3289),
        "Gion Karyo": (35.0024, 135.7746),
        "Café de Flore": (48.8540, 2.3326),
    }
    for name, (lat, lng) in rest_coords.items():
        cur.execute("UPDATE restaurants SET latitude = ?, longitude = ? WHERE name = ?", (lat, lng, name))

    act_coords = {
        "Amber Fort Sunrise Tour": (26.9855, 75.8513),
        "Block Printing Workshop": (26.8194, 75.7950),
        "Hot Air Balloon": (26.9920, 75.8600),
        "Albert Hall Museum Visit": (26.9116, 75.8195),
        "Dal Baati Churma Cooking Class": (26.9148, 75.8102),
        "Palolem Sunset Kayak": (15.0100, 74.0232),
        "Fontainhas Latin Quarter Walk": (15.4979, 73.8299),
        "Goan Spice Plantation & Indoor Tasting": (15.3982, 74.0246),
        "Tito Lane Nightlife Pass": (15.5567, 73.7535),
        "Solang Valley Paragliding & Ridge View": (32.3164, 77.1569),
        "Jogini Waterfall Pine Forest Trek": (32.2636, 77.1945),
        "Atal Tunnel & Sissu Valley Scenic Drive": (32.4787, 77.1319),
        "Old Manali Riverside Café & Bakery Hop": (32.2565, 77.1820),
        "Museum of Himachal Culture & Folk Art": (32.2481, 77.1805),
        "Himalayan Hot Springs & Spa at Vashisht": (32.2654, 77.1887),
        "Lake Pichola Sunset Boat Ride": (24.5720, 73.6790),
        "Bagore Ki Haveli Folk Show": (24.5796, 73.6816),
        "Monsoon Palace Hill Drive": (24.5936, 73.6388),
        "Taj Mahal Sunrise Entry": (27.1751, 78.0421),
        "Marble Inlay Workshop": (27.1672, 78.0362),
        "Ganga White Water Rafting": (30.1365, 78.3878),
        "Evening Ganga Aarti at Triveni Ghat": (30.1032, 78.2974),
        "Indoor Sound Healing & Yoga Session": (30.1282, 78.3248),
        "Fushimi Inari Early Hike": (34.9671, 135.7727),
        "Nishiki Covered Market Food Tour": (35.0050, 135.7649),
        "Traditional Tea Ceremony Indoors": (35.0030, 135.7755),
        "Louvre Museum Curated Highlights": (48.8606, 2.3376),
        "Seine Evening Cruise & Bistro Walk": (48.8584, 2.3422),
        "Le Marais Pastry & Patisserie Trail": (48.8575, 2.3622),
    }
    for name, (lat, lng) in act_coords.items():
        cur.execute("UPDATE activities SET latitude = ?, longitude = ? WHERE name = ?", (lat, lng, name))

    trans_coords = {
        "IndiGo 6E-203": (26.8242, 75.8122),
        "Shatabdi 12015": (26.9196, 75.7880),
        "RSRTC Volvo AC": (26.9225, 75.7995),
        "Air India AI-885": (15.3808, 73.8314),
        "Konkan Kanya Express": (15.2712, 73.9693),
        "HRTC Himsuta Volvo": (32.2396, 77.1887),
        "Alliance Air · DEL → KUU": (31.8767, 77.1544),
        "Himalayan Innova Cab": (32.2330, 77.1860),
        "IndiGo 6E-512": (24.6177, 73.8961),
        "Mewar Express 12963": (24.5681, 73.6967),
        "Gatimaan Express 12050": (27.1583, 77.9896),
        "Uttarakhand Volvo AC": (30.1045, 78.2881),
        "JR Tokaido Shinkansen": (34.9858, 135.7588),
        "Air France AF-225": (49.0097, 2.5479),
    }
    for prov, (lat, lng) in trans_coords.items():
        cur.execute("UPDATE transport SET latitude = ?, longitude = ? WHERE provider_name = ?", (lat, lng, prov))

    rental_coords = {
        "Honda Activa 6G": (26.9200, 75.8160),
        "Mahindra Thar 4x4": (26.9090, 75.7980),
        "TVS Ntorq 125": (15.5439, 73.7553),
        "Maruti Baleno Manual": (15.3850, 73.8350),
        "Royal Enfield Himalayan 411": (32.2442, 77.1896),
        "Toyota Innova Crysta": (32.2410, 77.1905),
        "Suzuki Access 125": (24.5802, 73.6788),
        "Bajaj Avenger 220": (30.1290, 78.3260),
    }
    for mod, (lat, lng) in rental_coords.items():
        cur.execute("UPDATE rentals SET latitude = ?, longitude = ? WHERE model_name = ?", (lat, lng, mod))

    crowd_coords = {
        "Hawa Mahal": (26.9239, 75.8267),
        "Amber Fort": (26.9855, 75.8513),
        "Nahargarh Fort": (26.9373, 75.8155),
        "Bapu Bazaar": (26.9182, 75.8224),
        "Baga Beach": (15.5553, 73.7517),
        "Fontainhas Latin Quarter": (15.4979, 73.8299),
        "Agonda Beach": (15.0445, 73.9871),
        "Solang Valley": (32.3164, 77.1569),
        "Hadimba Temple": (32.2484, 77.1807),
        "Jogini Waterfall Trail": (32.2636, 77.1945),
        "Old Manali Bridge & Cafés": (32.2535, 77.1843),
        "City Palace": (24.5764, 73.6835),
        "Fateh Sagar Lake": (24.6004, 73.6736),
        "Saheliyon Ki Bari": (24.6028, 73.6860),
        "Taj Mahal East Gate": (27.1751, 78.0421),
        "Mehtab Bagh Gardens": (27.1802, 78.0422),
        "Laxman Jhula Market": (30.1264, 78.3292),
        "Neer Garh Waterfall": (30.1436, 78.3265),
        "Fushimi Inari Shrine": (34.9671, 135.7727),
        "Philosopher Path": (35.0268, 135.7955),
        "Louvre Pyramid Entrance": (48.8610, 2.3358),
        "Canal Saint-Martin": (48.8719, 2.3653),
    }
    for place, (lat, lng) in crowd_coords.items():
        cur.execute("UPDATE crowd_info SET latitude = ?, longitude = ? WHERE place_name = ?", (lat, lng, place))

    # Fallback: any place missing coordinates inherits its destination center with tiny jitter
    for tbl in ("hotels", "restaurants", "activities", "transport", "rentals", "crowd_info"):
        cur.execute(f"""
            UPDATE {tbl}
            SET latitude = (SELECT d.latitude FROM destinations d WHERE d.destination_id = {tbl}.destination_id),
                longitude = (SELECT d.longitude FROM destinations d WHERE d.destination_id = {tbl}.destination_id)
            WHERE latitude IS NULL OR longitude IS NULL
        """)
