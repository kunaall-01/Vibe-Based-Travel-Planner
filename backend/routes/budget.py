
from flask import Blueprint, request, jsonify

budget_bp = Blueprint("budget", __name__)


@budget_bp.route("/budget", methods=["POST"])
def calculate_budget():

    data = request.get_json(silent=True) or {}

    budget = data.get("budget")
    hotel = data.get("hotel", 0)
    transport = data.get("transport", 0)
    food = data.get("food", 0)
    activities = data.get("activities", 0)

    if budget is None:
        return jsonify({
            "status": "error",
            "message": "Please provide total budget"
        }), 400

    try:
        budget = float(budget)
        hotel = float(hotel)
        transport = float(transport)
        food = float(food)
        activities = float(activities)

        if min(budget, hotel, transport, food, activities) < 0:
            raise ValueError

        if budget == 0:
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Budget and expenses must be valid positive numbers"
        }), 400

    total_expenses = hotel + transport + food + activities
    remaining_budget = budget - total_expenses

    cheaper_alternatives = []

    if total_expenses > budget:
        if hotel > 0:
            cheaper_alternatives.append(
                "Consider a more affordable hotel"
            )

        if transport > 0:
            cheaper_alternatives.append(
                "Compare bus or train options"
            )

        if food > 0:
            cheaper_alternatives.append(
                "Try local budget-friendly restaurants"
            )

        if activities > 0:
            cheaper_alternatives.append(
                "Choose free or low-cost activities"
            )

    return jsonify({
        "status": "success",
        "total_budget": budget,
        "expenses": {
            "hotel": hotel,
            "transport": transport,
            "food": food,
            "activities": activities
        },
        "total_expenses": total_expenses,
        "remaining_budget": remaining_budget,
        "within_budget": total_expenses <= budget,
        "cheaper_alternatives": cheaper_alternatives
    })
