CREATE DATABASE IF NOT EXISTS travel_planner;
USE travel_planner;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    role ENUM('traveler', 'local_guide', 'admin') DEFAULT 'traveler',
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE destinations (
    destination_id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255)
);

CREATE TABLE activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    vibe VARCHAR(50) NOT NULL,
    duration_hours DECIMAL(4,1) DEFAULT 2.0,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    rating DECIMAL(2,1) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
    is_indoor BOOLEAN DEFAULT FALSE,
    disruption_fallback ENUM('none', 'rain', 'closure', 'transport_delay', 'unavailable') DEFAULT 'none',
    meta VARCHAR(255),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE hotels (
    hotel_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night >= 0),
    facilities VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
    meta VARCHAR(255),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE restaurants (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    cuisine VARCHAR(100),
    avg_price DECIMAL(10,2) NOT NULL CHECK (avg_price >= 0),
    price_range ENUM('Budget', 'Moderate', 'Luxury') NOT NULL,
    rating DECIMAL(2,1) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
    meta VARCHAR(255),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE transport (
    transport_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    mode ENUM('Flight', 'Train', 'Bus', 'Cab') NOT NULL,
    provider_name VARCHAR(150) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    departure_time VARCHAR(50),
    arrival_time VARCHAR(50),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    rating DECIMAL(2,1) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
    meta VARCHAR(255),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    vehicle_type ENUM('Scooter', 'Bike', 'Car', 'SUV') NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL CHECK (price_per_day >= 0),
    availability_status ENUM('Available', 'Booked', 'Maintenance') DEFAULT 'Available',
    vendor_name VARCHAR(120),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE crowd_info (
    crowd_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    place_name VARCHAR(150) NOT NULL,
    crowd_level ENUM('Low', 'Moderate', 'High') NOT NULL,
    crowd_percentage INT CHECK (crowd_percentage >= 0 AND crowd_percentage <= 100),
    quiet_times VARCHAR(150) NOT NULL,
    suggestion VARCHAR(255),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE itineraries (
    itinerary_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    destination_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    vibe VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL CHECK (total_days >= 1 AND total_days <= 30),
    budget DECIMAL(10,2) NOT NULL CHECK (budget > 0),
    status ENUM('Upcoming', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE RESTRICT
);

CREATE TABLE itinerary_details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id INT NOT NULL,
    day_number INT NOT NULL CHECK (day_number >= 1),
    day_title VARCHAR(150),
    time_slot ENUM('Morning', 'Afternoon', 'Evening') NOT NULL,
    scheduled_time TIME,
    activity_title VARCHAR(200) NOT NULL,
    activity_id INT NULL,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE SET NULL
);

CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(25) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    itinerary_id INT NULL,
    booking_type ENUM('hotel', 'transport', 'restaurant', 'activity', 'rental') NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    travel_date DATE NOT NULL,
    travellers INT NOT NULL DEFAULT 1 CHECK (travellers >= 1 AND travellers <= 20),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    payment_method VARCHAR(80),
    payment_status ENUM('Paid', 'Pending', 'Due on arrival', 'Refunded') DEFAULT 'Pending',
    booking_status ENUM('Confirmed', 'Pending', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE SET NULL
);

CREATE TABLE trip_expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id INT NOT NULL,
    user_id INT NOT NULL,
    category ENUM('Stay', 'Transport', 'Food', 'Activities', 'Shopping', 'Misc') NOT NULL,
    estimated_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (estimated_amount >= 0),
    actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (actual_amount >= 0),
    day_number INT DEFAULT 1,
    note VARCHAR(255),
    expense_date DATE,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE travel_buddy_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    preferred_vibe VARCHAR(50),
    interests VARCHAR(255),
    travel_style VARCHAR(100),
    preferred_destination_id INT NULL,
    available_from DATE,
    available_to DATE,
    is_open_to_connect BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_destination_id) REFERENCES destinations(destination_id) ON DELETE SET NULL
);

CREATE TABLE connection_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_connection (sender_id, receiver_id),
    CHECK (sender_id <> receiver_id),
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE group_activities (
    group_activity_id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    host_user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    time_slot ENUM('Morning', 'Afternoon', 'Evening') NOT NULL,
    max_participants INT NOT NULL CHECK (max_participants >= 2),
    tags VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE,
    FOREIGN KEY (host_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE group_activity_participants (
    group_activity_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_activity_id, user_id),
    FOREIGN KEY (group_activity_id) REFERENCES group_activities(group_activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE user_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reported_user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('Open', 'Reviewed', 'Resolved') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_id <> reported_user_id),
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE blocked_users (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_id INT NOT NULL,
    blocked_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_block (blocker_id, blocked_user_id),
    CHECK (blocker_id <> blocked_user_id),
    FOREIGN KEY (blocker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);