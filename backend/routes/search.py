
from flask import Blueprint, request, jsonify

search_bp = Blueprint("search", __name__)

# Sample travel inventory
travel_options = [
    {
        "id": 1,
        "category": "hotels",
        "name": "Mountain View Hotel",
        "destination": "Manali",
        "price": 2500
    },
    {
        "id": 2,
        "category": "hotels",
        "name": "Snow Valley Resort",
        "destination": "Manali",
        "price": 4000
    },
    {
        "id": 3,
        "category": "transport",
        "name": "Volvo Bus",
        "destination": "Manali",
        "price": 1200
    },
    {
        "id": 4,
        "category": "restaurants",
        "name": "Himalayan Cafe",
        "destination": "Manali",
        "price": 500
    },
    {
        "id": 5,
        "category": "activities",
        "name": "Paragliding",
        "destination": "Manali",
        "price": 2500
    }
]


@search_bp.route("/search", methods=["GET"])
def search_options():

    category = request.args.get("category")
    destination = request.args.get("destination")
    max_price = request.args.get("max_price")

    results = travel_options

    if category:
        results = [
            item for item in results
            if item["category"] == category.lower()
        ]

    if destination:
        results = [
            item for item in results
            if item["destination"].lower() == destination.lower()
        ]

    if max_price:
        try:
            max_price = float(max_price)
            results = [
                item for item in results
                if item["price"] <= max_price
            ]
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Invalid maximum price"
            }), 400

    results = sorted(results, key=lambda item: item["price"])

    return jsonify({
        "status": "success",
        "total_results": len(results),
        "results": results
    })
