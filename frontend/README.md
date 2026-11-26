# Wayfarer – Gauri's Frontend (React + Vite)

Pages: Home, Login, Signup, Profile, Vibe Selector, Itinerary, Search & Compare (hotels/flights/trains/buses/restaurants/activities), Booking & Checkout, **My Trips (premium travel-journal redesign)**, Travel Connect, Budget Guardian, Plan B, Local Pulse.

## Run in VS Code
```bash
npm install
cp .env.example .env     # set VITE_API_URL to your Flask API
npm run dev              # http://localhost:5173
```
If the Flask backend is offline, every page falls back to the mock data in `src/data/mock.js`, so the UI always works.
Protected pages (My Trips, Profile, Booking, Connect, Budget) need login; any email + 6-char password works in demo mode.

## Push to GitHub
```bash
git init
git add .
git commit -m "Add Gauri frontend"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Flask endpoints expected (all optional)
POST /auth/login, /auth/signup, /user/profile, /bookings, /connect/request, /budget/expenses
GET /itinerary, /search, /trips, /connect, /budget/expenses, /plan-b, /local-pulse

## Note
Homepage, Vibe Selector and Itinerary are fresh versions because the existing designs weren't available — swap in your team's originals if you have them.
