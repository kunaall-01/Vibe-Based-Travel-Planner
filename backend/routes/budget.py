from flask import Blueprint, request, jsonify
from backend.database import fetch_all, fetch_one, execute_query
from backend.routes.auth import get_current_user

budget_bp = Blueprint("budget", __name__)

# Destination-tailored baseline budget recommendations (in INR)
DESTINATION_PLANS = {
    "jaipur": {"recommended_budget": 32000, "daily_avg": 8000, "split": {"Stay": 14000, "Transport": 5000, "Food": 6000, "Activities": 4000, "Shopping": 3000}, "tip": "Book composite fort tickets and local autos via meter/app to keep Day 2 costs low."},
    "manali": {"recommended_budget": 24000, "daily_avg": 6000, "split": {"Stay": 9000, "Transport": 5500, "Food": 4500, "Activities": 3500, "Shopping": 1500}, "tip": "Overnight HRTC Volvo buses and Old Manali guesthouses cut stay + transit spend by 35%."},
    "goa": {"recommended_budget": 28000, "daily_avg": 7000, "split": {"Stay": 12000, "Transport": 4500, "Food": 6500, "Activities": 3500, "Shopping": 1500}, "tip": "Renting a scooter (₹450/day) saves hugely over point-to-point beach cabs."},
    "udaipur": {"recommended_budget": 34000, "daily_avg": 8500, "split": {"Stay": 15000, "Transport": 6000, "Food": 6500, "Activities": 4000, "Shopping": 2500}, "tip": "Mix one lakeside splurge with heritage hostels and ghat cafés."},
    "agra": {"recommended_budget": 14000, "daily_avg": 7000, "split": {"Stay": 5000, "Transport": 2500, "Food": 3000, "Activities": 2500, "Shopping": 1000}, "tip": "Gatimaan Express from Delhi + 1-night stay near Tajganj keeps Agra compact and affordable."},
    "rishikesh": {"recommended_budget": 16000, "daily_avg": 5300, "split": {"Stay": 6000, "Transport": 2500, "Food": 3500, "Activities": 3000, "Shopping": 1000}, "tip": "River rafting packages often bundle cliff jumping and riverside meals."},
    "kyoto": {"recommended_budget": 85000, "daily_avg": 21000, "split": {"Stay": 35000, "Transport": 15000, "Food": 18000, "Activities": 10000, "Shopping": 7000}, "tip": "ICOCA transit card + Nishiki market tastings keep daily spending predictable."},
    "paris": {"recommended_budget": 110000, "daily_avg": 27500, "split": {"Stay": 50000, "Transport": 18000, "Food": 22000, "Activities": 12000, "Shopping": 8000}, "tip": "Navigo Metro pass + bakery lunches balance evening bistro dining."},
}


@budget_bp.route("/budget/plan", methods=["GET"])
def get_budget_plan():
    user = get_current_user()
    dest = (request.args.get("destination") or "").strip()
    if not dest:
        return jsonify({"status": "error", "message": "Please select a destination first"}), 400

    key = dest.lower()
    days = int(request.args.get("days") or 4)
    template = DESTINATION_PLANS.get(key) or {
        "recommended_budget": max(15000, days * 6000),
        "daily_avg": 6000,
        "split": {
            "Stay": round(days * 2400),
            "Transport": round(days * 1200),
            "Food": round(days * 1200),
            "Activities": round(days * 800),
            "Shopping": round(days * 400),
        },
        "tip": f"Plan ~₹6,000/day for {dest} covering stay, local transport, meals, and activities.",
    }

    budget_amount = template["recommended_budget"]
    expenses = []

    if user:
        saved_budget = fetch_one(
            "SELECT total_budget, days FROM user_budgets WHERE user_id = ? AND LOWER(destination_name) = LOWER(?)",
            (user["user_id"], dest),
        )
        if saved_budget:
            budget_amount = saved_budget["total_budget"]
            days = saved_budget["days"]

        expenses = fetch_all(
            """
            SELECT expense_id as id, category, actual_amount as amount, note, day_number as day, destination_name
            FROM trip_expenses
            WHERE user_id = ? AND LOWER(destination_name) = LOWER(?)
            ORDER BY day_number ASC, expense_id DESC
            """,
            (user["user_id"], dest),
        )

    return jsonify({
        "destination": dest,
        "days": days,
        "budget": budget_amount,
        "recommended_budget": template["recommended_budget"],
        "suggested_split": template["split"],
        "tip": template["tip"],
        "expenses": expenses,
    })


@budget_bp.route("/budget/plan", methods=["POST"])
def save_budget_plan():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    dest = (data.get("destination") or "").strip()
    total_budget = float(data.get("budget") or 0)
    days = int(data.get("days") or 4)

    if not dest or total_budget <= 0:
        return jsonify({"status": "error", "message": "Destination and positive budget required"}), 400

    existing = fetch_one(
        "SELECT budget_id FROM user_budgets WHERE user_id = ? AND LOWER(destination_name) = LOWER(?)",
        (user["user_id"], dest),
    )
    if existing:
        execute_query(
            "UPDATE user_budgets SET total_budget = ?, days = ?, updated_at = CURRENT_TIMESTAMP WHERE budget_id = ?",
            (total_budget, days, existing["budget_id"]),
        )
    else:
        execute_query(
            "INSERT INTO user_budgets (user_id, destination_name, total_budget, days) VALUES (?, ?, ?, ?)",
            (user["user_id"], dest, total_budget, days),
        )

    return jsonify({"status": "success", "budget": total_budget, "destination": dest})


@budget_bp.route("/budget/expenses", methods=["POST"])
def add_expense():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    dest = (data.get("destination") or "").strip()
    category = data.get("category") or "Other"
    amount = float(data.get("amount") or 0)
    note = (data.get("note") or category).strip()
    day = int(data.get("day") or 1)

    if not dest or amount <= 0:
        return jsonify({"status": "error", "message": "Destination and positive amount required"}), 400

    eid = execute_query(
        """
        INSERT INTO trip_expenses (user_id, destination_name, category, estimated_amount, actual_amount, day_number, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user["user_id"], dest, category, amount, amount, day, note),
    )

    return jsonify({
        "status": "success",
        "expense": {"id": eid, "category": category, "amount": amount, "note": note, "day": day, "destination_name": dest},
    }), 201


@budget_bp.route("/budget/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    execute_query("DELETE FROM trip_expenses WHERE expense_id = ? AND user_id = ?", (expense_id, user["user_id"]))
    return jsonify({"status": "success"})
