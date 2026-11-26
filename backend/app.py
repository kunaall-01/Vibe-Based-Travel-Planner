from flask import Flask
from flask_cors import CORS

from backend.database import init_db

from backend.routes.health import health_bp
from backend.routes.auth import auth_bp
from backend.routes.recommendations import recommendation_bp
from backend.routes.itinerary import itinerary_bp
from backend.routes.search import search_bp
from backend.routes.budget import budget_bp
from backend.routes.replanner import replanner_bp
from backend.routes.local_pulse import local_pulse_bp
from backend.routes.bookings import booking_bp
from backend.routes.connect import connect_bp
from backend.routes.trips import trips_bp
from backend.routes.user import user_bp
from backend.routes.movies import movies_bp
from backend.routes.realtime import realtime_bp
from backend.routes.payments import payments_bp

app = Flask(__name__)

CORS(app)

# Register API routes
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(recommendation_bp, url_prefix="/api")
app.register_blueprint(itinerary_bp, url_prefix="/api")
app.register_blueprint(search_bp, url_prefix="/api")
app.register_blueprint(budget_bp, url_prefix="/api")
app.register_blueprint(replanner_bp, url_prefix="/api")
app.register_blueprint(local_pulse_bp, url_prefix="/api")
app.register_blueprint(booking_bp, url_prefix="/api")
app.register_blueprint(connect_bp, url_prefix="/api")
app.register_blueprint(trips_bp, url_prefix="/api")
app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(movies_bp, url_prefix="/api")
app.register_blueprint(realtime_bp, url_prefix="/api")
app.register_blueprint(payments_bp, url_prefix="/api")


@app.route("/")
def home():
    return {"message": "Vibe-Based Travel Planner Backend is running!"}


# Initialize SQLite database
init_db()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
