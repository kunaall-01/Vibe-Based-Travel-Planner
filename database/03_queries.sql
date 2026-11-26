USE travel_planner;

-- ============================================================
-- 1. USER REGISTRATION & LOGIN DATA RETRIEVAL
-- ============================================================
-- Register a new user
INSERT INTO users (full_name, email, password_hash, phone, city, role)
VALUES ('Atharva Singh', 'tony@travelplanner.in', 'pbkdf2:sha256:hashed_pw_7', '9876543299', 'Noida', 'traveler');

-- Retrieve user credentials for login verification
SELECT user_id, full_name, email, password_hash, role, city
FROM users
WHERE email = 'atharva@travelplanner.in';


-- ============================================================
-- 2. SEARCHING HOTELS, RESTAURANTS & ACTIVITIES
-- ============================================================
-- Unified search across hotels, restaurants, and activities by keyword
SELECT 'hotel' AS category, h.hotel_id AS id, h.name, d.name AS destination, h.price_per_night AS price, h.rating, h.meta
FROM hotels h
JOIN destinations d ON h.destination_id = d.destination_id
WHERE h.name LIKE '%Heritage%' OR d.name LIKE '%Jaipur%'
UNION ALL
SELECT 'restaurant' AS category, r.restaurant_id AS id, r.name, d.name AS destination, r.avg_price AS price, r.rating, r.meta
FROM restaurants r
JOIN destinations d ON r.destination_id = d.destination_id
WHERE r.name LIKE '%Heritage%' OR d.name LIKE '%Jaipur%'
UNION ALL
SELECT 'activity' AS category, a.activity_id AS id, a.name, d.name AS destination, a.price, a.rating, a.meta
FROM activities a
JOIN destinations d ON a.destination_id = d.destination_id
WHERE a.name LIKE '%Heritage%' OR d.name LIKE '%Jaipur%';


-- ============================================================
-- 3. FILTERING OPTIONS BY DESTINATION & PRICE
-- ============================================================
-- Filter hotels in a destination under a maximum price
SELECT h.hotel_id, h.name, d.name AS destination, h.location, h.price_per_night, h.facilities, h.rating
FROM hotels h
INNER JOIN destinations d ON h.destination_id = d.destination_id
WHERE d.name = 'Jaipur' AND h.price_per_night <= 8000.00
ORDER BY h.price_per_night ASC;

-- Filter activities by destination, vibe, and max price
SELECT a.activity_id, a.name, d.name AS destination, a.vibe, a.duration_hours, a.price, a.rating
FROM activities a
INNER JOIN destinations d ON a.destination_id = d.destination_id
WHERE d.name = 'Jaipur' AND a.price <= 5000.00
ORDER BY a.rating DESC;


-- ============================================================
-- 4. RETRIEVING SAVED ITINERARIES (WITH DAY-WISE PLANS)
-- ============================================================
SELECT
    i.itinerary_id,
    i.title AS trip_title,
    d.name AS destination,
    i.vibe,
    i.start_date,
    i.end_date,
    i.budget,
    i.status,
    id.day_number,
    id.day_title,
    id.time_slot,
    id.scheduled_time,
    id.activity_title
FROM itineraries i
INNER JOIN destinations d ON i.destination_id = d.destination_id
LEFT JOIN itinerary_details id ON i.itinerary_id = id.itinerary_id
WHERE i.user_id = 1
ORDER BY i.start_date DESC, id.day_number ASC, id.scheduled_time ASC;


-- ============================================================
-- 5. RETRIEVING BOOKING HISTORY
-- ============================================================
SELECT
    b.booking_ref,
    b.booking_type,
    b.item_name,
    b.travel_date,
    b.travellers,
    b.total_price,
    b.payment_method,
    b.payment_status,
    b.booking_status,
    i.title AS linked_trip
FROM bookings b
LEFT JOIN itineraries i ON b.itinerary_id = i.itinerary_id
WHERE b.user_id = 1
ORDER BY b.travel_date ASC;


-- ============================================================
-- 6. CALCULATING TRIP EXPENSES (CATEGORY BREAKDOWN & REMAINING BUDGET)
-- ============================================================
-- Category-wise estimated vs actual spend
SELECT
    category,
    SUM(estimated_amount) AS total_estimated,
    SUM(actual_amount) AS total_actual,
    (SUM(estimated_amount) - SUM(actual_amount)) AS variance
FROM trip_expenses
WHERE itinerary_id = 1
GROUP BY category;

-- Overall trip budget vs total spent
SELECT
    i.itinerary_id,
    i.title,
    i.budget AS total_budget,
    COALESCE(SUM(te.actual_amount), 0) AS total_spent,
    (i.budget - COALESCE(SUM(te.actual_amount), 0)) AS remaining_budget
FROM itineraries i
LEFT JOIN trip_expenses te ON i.itinerary_id = te.itinerary_id
WHERE i.itinerary_id = 1
GROUP BY i.itinerary_id, i.title, i.budget;


-- ============================================================
-- 7. FINDING COMPATIBLE TRAVEL BUDDIES (EXCLUDING BLOCKED USERS)
-- ============================================================
SELECT
    u.user_id,
    u.full_name,
    u.city,
    u.bio,
    u.avatar_url,
    tbp.preferred_vibe,
    tbp.interests,
    tbp.travel_style,
    d.name AS preferred_destination,
    tbp.available_from,
    tbp.available_to
FROM travel_buddy_profiles tbp
INNER JOIN users u ON tbp.user_id = u.user_id
LEFT JOIN destinations d ON tbp.preferred_destination_id = d.destination_id
WHERE tbp.is_open_to_connect = TRUE
  AND u.user_id <> 1
  AND tbp.preferred_destination_id = 1
  AND u.user_id NOT IN (
      SELECT blocked_user_id FROM blocked_users WHERE blocker_id = 1
      UNION
      SELECT blocker_id FROM blocked_users WHERE blocked_user_id = 1
  );


-- ============================================================
-- 8. RETRIEVING CROWD INFORMATION
-- ============================================================
SELECT
    c.crowd_id,
    d.name AS destination,
    c.place_name,
    c.crowd_level,
    c.crowd_percentage,
    c.quiet_times,
    c.suggestion
FROM crowd_info c
INNER JOIN destinations d ON c.destination_id = d.destination_id
WHERE LOWER(d.name) = LOWER('Jaipur')
ORDER BY c.crowd_percentage ASC;