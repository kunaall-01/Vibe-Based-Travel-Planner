# Database Relationship & Normalization Documentation (`travel_planner`)

## 1. Normalization Summary (3NF)
- **1NF:** All columns store atomic values; multi-day schedules are separated into rows in `itinerary_details` rather than comma-separated lists.
- **2NF:** Every non-key attribute depends on the full primary key (including the composite primary key `(group_activity_id, user_id)` in `group_activity_participants`).
- **3NF:** Destination metadata (`name`, `region`, `description`) is isolated in `destinations` and referenced via `destination_id` across catalog and trip tables to eliminate transitive dependencies and duplication.

## 2. Entity Relationships & Cardinality

| Parent Entity | Child Entity | Cardinality | Foreign Key | Referential Action |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `travel_buddy_profiles` | **1 : 1** | `user_id` (UNIQUE) | `ON DELETE CASCADE` |
| `users` | `itineraries` | **1 : N** | `user_id` | `ON DELETE CASCADE` |
| `users` | `bookings` | **1 : N** | `user_id` | `ON DELETE CASCADE` |
| `users` | `trip_expenses` | **1 : N** | `user_id` | `ON DELETE CASCADE` |
| `users` | `connection_requests` | **1 : N** (Dual) | `sender_id`, `receiver_id` | `ON DELETE CASCADE` |
| `users` | `user_reports` | **1 : N** (Dual) | `reporter_id`, `reported_user_id` | `ON DELETE CASCADE` |
| `users` | `blocked_users` | **1 : N** (Dual) | `blocker_id`, `blocked_user_id` | `ON DELETE CASCADE` |
| `users` | `group_activities` | **1 : N** | `host_user_id` | `ON DELETE CASCADE` |
| `users` & `group_activities` | `group_activity_participants` | **M : N** (Junction) | `group_activity_id`, `user_id` | `ON DELETE CASCADE` |
| `destinations` | `activities` | **1 : N** | `destination_id` | `ON DELETE CASCADE` |
| `destinations` | `hotels` | **1 : N** | `destination_id` | `ON DELETE CASCADE` |
| `destinations` | `restaurants` | **1 : N** | `destination_id` | `ON DELETE CASCADE` |
| `destinations` | `transport` | **1 : N** | `destination_id` | `ON DELETE CASCADE` |
| `destinations` | `rentals` | **1 : N** | `destination_id` | `ON DELETE CASCADE` |
| `destinations` | `crowd_info` | **1 : N** | `destination_id` | `ON DELETE CASCADE` |
| `destinations` | `itineraries` | **1 : N** | `destination_id` | `ON DELETE RESTRICT` |
| `itineraries` | `itinerary_details` | **1 : N** | `itinerary_id` | `ON DELETE CASCADE` |
| `itineraries` | `bookings` | **1 : N** | `itinerary_id` | `ON DELETE SET NULL` |
| `itineraries` | `trip_expenses` | **1 : N** | `itinerary_id` | `ON DELETE CASCADE` |
| `activities` | `itinerary_details` | **1 : N** | `activity_id` | `ON DELETE SET NULL` |