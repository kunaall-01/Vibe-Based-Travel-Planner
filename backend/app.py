    
from flask import Flask
from flask_cors import CORS

from backend.routes.health import health_bp
from backend.routes.recommendations import recommendation_bp
from backend.routes.itinerary import itinerary_bp
from backend.routes.search import search_bp
from backend.routes.budget import budget_bp
from backend.routes.replanner import replanner_bp
from backend.routes.local_pulse import local_pulse_bp
app = Flask(__name__)

# Allow frontend requests
CORS(app)

# Register API routes
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(recommendation_bp, url_prefix="/api")
app.register_blueprint(itinerary_bp, url_prefix="/api")
app.register_blueprint(search_bp, url_prefix="/api")	
app.register_blueprint(budget_bp, url_prefix="/api")
app.register_blueprint(replanner_bp, url_prefix="/api")
app.register_blueprint(local_pulse_bp, url_prefix="/api")

@app.route("/")
def home():
    return {"message": "Vibe-Based Travel Planner Backend is running!"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
