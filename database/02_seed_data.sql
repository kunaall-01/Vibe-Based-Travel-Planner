USE travel_planner;

-- 1. USERS (Travelers & Local Guides)
INSERT INTO users (full_name, email, password_hash, phone, city, role, bio, avatar_url) VALUES
('Gauri Bansal', 'atharva@travelplanner.in', 'pbkdf2:sha256:hashed_pw_1', '9876543210', 'Noida', 'traveler', 'B.Tech student exploring forts, mountains, and street food.', 'https://i.pravatar.cc/200?img=11'),
('Kunal Chauhan', 'aarav@travelplanner.in', 'pbkdf2:sha256:hashed_pw_2', '9876543211', 'Delhi', 'traveler', 'Photographer looking for a Rajasthan road-trip partner.', 'https://i.pravatar.cc/200?img=12'),
('Atharva Singh', 'ishita@travelplanner.in', 'pbkdf2:sha256:hashed_pw_3', '9876543212', 'Noida', 'traveler', 'Weekend traveller, loves forts and street food.', 'https://i.pravatar.cc/200?img=47'),
('Kabir Singh', 'kabir@travelplanner.in', 'pbkdf2:sha256:hashed_pw_4', '9876543213', 'Gurugram', 'traveler', 'Trekking the Himalayas every winter.', 'https://i.pravatar.cc/200?img=15'),
('Meera Sharma', 'meera@travelplanner.in', 'pbkdf2:sha256:hashed_pw_5', '9876543214', 'Jaipur', 'local_guide', 'Heritage walk guide, knows every lane of the old city.', 'https://i.pravatar.cc/200?img=32'),
('Raghav Joshi', 'raghav@travelplanner.in', 'pbkdf2:sha256:hashed_pw_6', '9876543215', 'Udaipur', 'local_guide', 'Boatman turned storyteller on Lake Pichola.', 'https://i.pravatar.cc/200?img=53');

-- 2. DESTINATIONS (1=Jaipur, 2=Goa, 3=Manali, 4=Udaipur)
INSERT INTO destinations (slug, name, region, description, image_url) VALUES
('jaipur', 'Jaipur', 'Rajasthan, India', 'The Pink City known for sandstone forts, royal palaces, and vibrant bazaars.', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70'),
('goa', 'Goa', 'Goa, India', 'Sun-drenched beaches, Portuguese heritage quarters, and coastal seafood shacks.', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70'),
('manali', 'Manali', 'Himachal Pradesh, India', 'High-altitude Himalayan town surrounded by pine forests, snow peaks, and river valleys.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70'),
('udaipur', 'Udaipur', 'Rajasthan, India', 'The City of Lakes famed for marble palaces, sunset boat rides, and rooftop dining.', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=70');

-- 3. ACTIVITIES
INSERT INTO activities (destination_id, name, category, vibe, duration_hours, price, rating, is_indoor, disruption_fallback, meta) VALUES
-- Jaipur (1)
(1, 'Amber Fort Sunrise Tour', 'Sightseeing', 'heritage', 3.0, 1200.00, 4.7, FALSE, 'none', '3 hrs · Guided'),
(1, 'Block Printing Workshop', 'Workshop', 'heritage', 2.0, 900.00, 4.6, TRUE, 'rain', '2 hrs · Hands-on'),
(1, 'Hot Air Balloon', 'Adventure', 'adventure', 1.0, 12000.00, 4.8, FALSE, 'none', '1 hr · Sunrise'),
(1, 'Albert Hall Museum Visit', 'Museum', 'heritage', 2.0, 200.00, 4.4, TRUE, 'rain', 'Indoors · Art & History'),
(1, 'Dal Baati Churma Cooking Class', 'Culinary', 'food', 2.5, 1100.00, 4.7, TRUE, 'rain', 'Hands-on evening class'),
-- Goa (2)
(2, 'Palolem Sunset Kayak', 'Water Sports', 'beach', 2.0, 800.00, 4.6, FALSE, 'none', 'Calm bay paddle'),
(2, 'Fontainhas Latin Quarter Walk', 'Heritage Walk', 'heritage', 2.0, 600.00, 4.5, FALSE, 'closure', 'Old Panjim lanes'),
(2, 'Tito Lane Nightlife Pass', 'Nightlife', 'Party', 4.0, 1500.00, 4.2, TRUE, 'rain', 'Baga · Live music'),
-- Manali (3)
(3, 'Solang Valley Paragliding', 'Adventure', 'Adventurous', 2.0, 2500.00, 4.7, FALSE, 'none', 'Tandem flight'),
(3, 'Jogini Waterfall Trek', 'Trekking', 'mountain', 3.5, 500.00, 4.6, FALSE, 'none', 'Vashisht trail'),
(3, 'Old Manali Cafe Hopping', 'Food Walk', 'Foodie', 2.0, 700.00, 4.5, TRUE, 'rain', 'Riverside cafes'),
-- Udaipur (4)
(4, 'Lake Pichola Sunset Boat Ride', 'Boating', 'Peaceful', 1.5, 800.00, 4.8, FALSE, 'none', 'Golden hour cruise'),
(4, 'Bagore Ki Haveli Folk Show', 'Cultural Show', 'heritage', 1.5, 300.00, 4.6, TRUE, 'rain', 'Evening traditional dance'),
(4, 'Monsoon Palace Hill Drive', 'Sightseeing', 'adventure', 2.5, 950.00, 4.4, FALSE, 'none', 'Panoramic valley view');

-- 4. HOTELS
INSERT INTO hotels (destination_id, name, location, price_per_night, facilities, rating, meta) VALUES
(1, 'Haveli Heritage Stay', 'Old City, Jaipur', 5200.00, 'Breakfast, Wi-Fi, Courtyard', 4.6, 'Old City · Breakfast included'),
(1, 'The Pink Courtyard', 'C-Scheme, Jaipur', 7800.00, 'Pool, Wi-Fi, Restaurant', 4.4, 'C-Scheme · Pool'),
(1, 'Zostel Jaipur', 'MI Road, Jaipur', 900.00, 'Shared Lounge, Lockers, Wi-Fi', 4.2, 'Hostel · Shared lounge'),
(1, 'Rambagh Residency', 'Bhawani Singh Rd, Jaipur', 18500.00, 'Spa, Pool, Fine Dining', 4.9, 'Palace stay · Spa'),
(2, 'Casa Colva Beach Resort', 'Colva, South Goa', 4200.00, 'Beach Access, Pool, Breakfast', 4.5, '2 min walk to beach'),
(2, 'Baga Breeze Hostel', 'Baga, North Goa', 1100.00, 'Cafe, Wi-Fi, Scooters', 4.1, 'Budget · Near nightlife'),
(3, 'Mountain View Hotel', 'Mall Road, Manali', 2500.00, 'Heater, Balcony, Wi-Fi', 4.3, 'Valley facing rooms'),
(3, 'Snow Valley Resort', 'Log Huts Area, Manali', 4000.00, 'Bonfire, Restaurant, Mountain View', 4.6, 'Pine forest stay'),
(4, 'Lake View Boutique Hotel', 'Hanuman Ghat, Udaipur', 6000.00, 'Rooftop Lake View, Breakfast', 4.7, 'Overlooking Lake Pichola'),
(4, 'Zostel Udaipur', 'Chandpole, Udaipur', 950.00, 'Rooftop Cafe, Wi-Fi', 4.4, 'Lakeside hostel');

-- 5. RESTAURANTS
INSERT INTO restaurants (destination_id, name, location, cuisine, avg_price, price_range, rating, meta) VALUES
(1, 'Laxmi Misthan Bhandar', 'Johari Bazaar, Jaipur', 'Rajasthani', 600.00, 'Budget', 4.4, 'Rajasthani · Johari Bazaar'),
(1, 'Tapri Central', 'C-Scheme, Jaipur', 'Cafe & Snacks', 450.00, 'Budget', 4.5, 'Café · Tea & snacks'),
(1, '1135 AD', 'Amber Fort, Jaipur', 'Royal Rajasthani', 3500.00, 'Luxury', 4.7, 'Fine dining · Amber Fort'),
(2, 'Britto''s Shack', 'Baga Beach, Goa', 'Goan Seafood', 1200.00, 'Moderate', 4.4, 'Beachfront · Seafood'),
(2, 'Gunpowder', 'Assagao, Goa', 'South Indian & Coastal', 1400.00, 'Moderate', 4.7, 'Garden courtyard dining'),
(3, 'Himalayan Cafe', 'Old Manali, Manali', 'Cafe & Continental', 500.00, 'Budget', 4.4, 'Wood-fired pizzas & coffee'),
(3, 'Johnson''s Cafe', 'Circuit House Rd, Manali', 'Himachali & Trout', 1100.00, 'Moderate', 4.6, 'Fresh river trout'),
(4, 'Ambrai Restaurant', 'Hanuman Ghat, Udaipur', 'Mewari & North Indian', 1800.00, 'Luxury', 4.8, 'Waterfront palace view'),
(4, 'Jheel''s Ginger Coffee Bar', 'Gangaur Ghat, Udaipur', 'Cafe', 500.00, 'Budget', 4.5, 'Lakeside breakfast spot');

-- 6. TRANSPORT
INSERT INTO transport (destination_id, mode, provider_name, origin, departure_time, arrival_time, price, rating, meta) VALUES
(1, 'Flight', 'IndiGo 6E-203', 'Delhi (DEL)', '06:10', '07:05', 3400.00, 4.1, '06:10 – 07:05 · Non-stop'),
(1, 'Train', 'Shatabdi 12015', 'New Delhi', '06:05', '10:40', 850.00, 4.5, '06:05 – 10:40 · Chair car'),
(1, 'Bus', 'RSRTC Volvo AC', 'Delhi Bikaner House', '07:00', '12:30', 650.00, 4.0, '07:00 – 12:30 · Seater'),
(2, 'Flight', 'Air India AI-885', 'Delhi (DEL)', '11:15', '13:55', 5400.00, 4.3, 'Non-stop · 2h 40m'),
(3, 'Bus', 'HRTC Himsuta Volvo', 'Delhi ISBT', '19:30', '07:30', 1200.00, 4.4, 'Overnight AC Semi-Sleeper'),
(4, 'Flight', 'IndiGo 6E-512', 'Delhi (DEL)', '18:20', '19:45', 4100.00, 4.2, 'Non-stop · 1h 25m'),
(4, 'Cab', 'Rajasthan Intercity Cab', 'Jaipur', '09:00', '15:30', 6200.00, 4.5, 'Private sedan · NH48');

-- 7. RENTALS
INSERT INTO rentals (destination_id, vehicle_type, model_name, price_per_day, availability_status, vendor_name) VALUES
(1, 'Scooter', 'Honda Activa 6G', 500.00, 'Available', 'Pink City Wheels'),
(2, 'Scooter', 'TVS Ntorq 125', 450.00, 'Available', 'Calangute Ride Rentals'),
(2, 'Car', 'Maruti Baleno Manual', 1600.00, 'Available', 'Goa Drive Self-Rental'),
(3, 'Bike', 'Royal Enfield Himalayan 411', 1500.00, 'Available', 'Manali Moto Adventures'),
(4, 'Scooter', 'Suzuki Access 125', 500.00, 'Available', 'Lake City Scooters');

-- 8. CROWD INFORMATION
INSERT INTO crowd_info (destination_id, place_name, crowd_level, crowd_percentage, quiet_times, suggestion) VALUES
(1, 'Hawa Mahal', 'High', 88, 'Before 9:00 AM or after 5:30 PM', 'Arrive right at opening for clean photos'),
(1, 'Amber Fort', 'Moderate', 56, '8:00 AM - 10:00 AM (Weekdays)', 'Book composite ticket online in advance'),
(1, 'Nahargarh Fort', 'Low', 30, '4:30 PM - 6:30 PM', 'Ideal for quiet sunset views over Jaipur'),
(2, 'Baga Beach', 'High', 85, '7:00 AM - 9:30 AM', 'Visit early morning or head to South Goa'),
(2, 'Agonda Beach', 'Low', 25, 'Anytime', 'Great alternative for peaceful beach walks'),
(3, 'Solang Valley', 'High', 82, '8:00 AM - 10:00 AM', 'Visit early in the morning before traffic builds'),
(3, 'Hadimba Temple', 'Moderate', 55, '9:00 AM - 11:00 AM', 'Visit during morning hours'),
(4, 'City Palace', 'High', 80, '9:00 AM - 10:00 AM', 'Visit shortly after opening'),
(4, 'Saheliyon Ki Bari', 'Low', 28, '8:00 AM - 11:00 AM', 'Good option for a quieter garden visit');

-- 9. ITINERARIES
INSERT INTO itineraries (user_id, destination_id, title, vibe, start_date, end_date, total_days, budget, status, notes) VALUES
(1, 1, 'Jaipur, the Pink City', 'heritage', '2026-12-14', '2026-12-17', 4, 35000.00, 'Upcoming', 'Winter heritage and food trail'),
(1, 3, 'Manali Weekend', 'mountain', '2026-05-10', '2026-05-13', 3, 18000.00, 'Completed', 'Snow on the Rohtang road');

-- 10. ITINERARY DETAILS
INSERT INTO itinerary_details (itinerary_id, day_number, day_title, time_slot, scheduled_time, activity_title, activity_id) VALUES
(1, 1, 'Arrival & Old City', 'Morning', '11:00:00', 'Check in at Haveli Heritage Stay', NULL),
(1, 1, 'Arrival & Old City', 'Afternoon', '14:00:00', 'Lunch at Laxmi Misthan Bhandar', NULL),
(1, 1, 'Arrival & Old City', 'Evening', '17:00:00', 'Hawa Mahal at golden hour', NULL),
(1, 2, 'Forts & Palaces', 'Morning', '08:30:00', 'Amber Fort Sunrise Tour', 1),
(1, 2, 'Forts & Palaces', 'Afternoon', '13:00:00', 'Panna Meena ka Kund & lunch', NULL),
(1, 2, 'Forts & Palaces', 'Evening', '16:00:00', 'City Palace and Jantar Mantar', NULL),
(1, 3, 'Craft & Cafés', 'Morning', '10:00:00', 'Block Printing Workshop, Sanganer', 2),
(1, 3, 'Craft & Cafés', 'Afternoon', '15:00:00', 'Bapu Bazaar shopping walk', NULL),
(1, 3, 'Craft & Cafés', 'Evening', '19:30:00', 'Dinner on a rooftop terrace', NULL);

-- 11. BOOKINGS
INSERT INTO bookings (booking_ref, user_id, itinerary_id, booking_type, item_id, item_name, travel_date, travellers, total_price, payment_method, payment_status, booking_status) VALUES
('HV-48213', 1, 1, 'hotel', 1, 'Haveli Heritage Stay (3 Nights)', '2026-12-14', 1, 15600.00, 'Visa ending 4417', 'Paid', 'Confirmed'),
('PNR-241883', 1, 1, 'transport', 2, 'Shatabdi 12015 · Delhi to Jaipur', '2026-12-14', 1, 850.00, 'UPI', 'Paid', 'Confirmed'),
('BK-90124', 1, 1, 'activity', 1, 'Amber Fort Sunrise Tour', '2026-12-15', 1, 1200.00, 'UPI', 'Paid', 'Confirmed');

-- 12. TRIP EXPENSES
INSERT INTO trip_expenses (itinerary_id, user_id, category, estimated_amount, actual_amount, day_number, note, expense_date) VALUES
(1, 1, 'Stay', 16000.00, 15600.00, 1, 'Jaipur hotel 3 nights', '2026-12-14'),
(1, 1, 'Transport', 1500.00, 850.00, 1, 'Shatabdi train ticket', '2026-12-14'),
(1, 1, 'Food', 4500.00, 4200.00, 2, 'LMB & Tapri Central meals', '2026-12-15'),
(1, 1, 'Activities', 3000.00, 2100.00, 3, 'Amber Fort tour & Block printing', '2026-12-16'),
(1, 1, 'Shopping', 3000.00, 2500.00, 3, 'Bapu Bazaar souvenirs', '2026-12-16');

-- 13. TRAVEL BUDDY PROFILES
INSERT INTO travel_buddy_profiles (user_id, preferred_vibe, interests, travel_style, preferred_destination_id, available_from, available_to, is_open_to_connect) VALUES
(1, 'heritage', 'Forts, Street Food, Photography', 'Budget Explorer', 1, '2026-12-14', '2026-12-21', TRUE),
(2, 'heritage', 'Photography, Road trips, Architecture', 'Slow Traveler', 1, '2026-12-13', '2026-12-20', TRUE),
(3, 'food', 'Heritage, Street Food, Cafes', 'Weekend Hopper', 1, '2026-12-14', '2026-12-18', TRUE),
(4, 'mountain', 'Trekking, Camping, Snow Trails', 'Backpacker', 3, '2026-12-20', '2026-12-28', TRUE);

-- 14. CONNECTION REQUESTS
INSERT INTO connection_requests (sender_id, receiver_id, status, message) VALUES
(1, 2, 'Accepted', 'Hey Aarav! Exploring Jaipur Dec 14-17, down for a sunrise shoot at Amber Fort?'),
(3, 1, 'Pending', 'Hi Atharva, I am also visiting Jaipur that weekend!');

-- 15. GROUP ACTIVITIES & PARTICIPANTS
INSERT INTO group_activities (destination_id, host_user_id, title, description, activity_date, time_slot, max_participants, tags) VALUES
(1, 5, 'Amber Fort Sunrise Walk', 'Easy-paced heritage walk with chai after.', '2026-12-16', 'Morning', 12, 'Group, Morning, Heritage'),
(4, 6, 'Lake Pichola Sunset Sail', 'Small group boat ride with local stories.', '2026-12-19', 'Evening', 10, 'Group, Evening, Lakes');

INSERT INTO group_activity_participants (group_activity_id, user_id) VALUES
(1, 5), (1, 1), (1, 2),
(2, 6), (2, 3);

-- 16. REPORTS AND BLOCKS
INSERT INTO user_reports (reporter_id, reported_user_id, reason, status) VALUES
(3, 4, 'Spamming unrelated trek links in Jaipur group chat', 'Reviewed');

INSERT INTO blocked_users (blocker_id, blocked_user_id) VALUES
(2, 4);