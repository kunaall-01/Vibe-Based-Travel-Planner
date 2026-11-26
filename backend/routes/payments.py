import json
import re
import secrets
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from backend.database import fetch_one, execute_query
from backend.routes.auth import get_current_user

payments_bp = Blueprint("payments", __name__)

PROMO_CODES = {
    "WAYFARER10": {"type": "pct", "value": 10, "max_discount": 2500, "label": "10% off up to ₹2,500"},
    "FIRSTTRIP": {"type": "flat", "value": 600, "max_discount": 600, "label": "₹600 instant welcome discount"},
    "MOUNTAIN15": {"type": "pct", "value": 15, "max_discount": 3000, "label": "15% off mountain escapes"},
    "WEEKEND500": {"type": "flat", "value": 500, "max_discount": 500, "label": "₹500 weekend getaway savings"},
}

UPI_HANDLES = {"okicici", "oksbi", "okaxis", "okhdfcbank", "ybl", "ibl", "axl", "paytm", "upi", "icici", "sbi", "hdfc"}


def _luhn_check(num_str):
    digits = [int(d) for d in num_str if d.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    alt = False
    for d in reversed(digits):
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
        alt = not alt
    return checksum % 10 == 0


def _detect_card_brand(num_str):
    d = "".join(c for c in num_str if c.isdigit())
    if d.startswith("4"):
        return "Visa"
    if re.match(r"^(5[1-5]|2[2-7])", d):
        return "Mastercard"
    if d.startswith(("34", "37")):
        return "Amex"
    if d.startswith(("60", "65", "81", "82", "508")):
        return "RuPay"
    return "Card"


def _calc_discount(base_amount, promo_code):
    code = (promo_code or "").strip().upper()
    if not code or code not in PROMO_CODES:
        return 0.0, None
    cfg = PROMO_CODES[code]
    if cfg["type"] == "pct":
        disc = min(cfg["max_discount"], round(base_amount * cfg["value"] / 100.0))
    else:
        disc = min(base_amount, cfg["value"])
    return float(disc), cfg


@payments_bp.route("/payments/promo", methods=["POST"])
def validate_promo():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    base_amount = float(data.get("base_amount") or 0)

    if code not in PROMO_CODES:
        return jsonify({"status": "error", "message": "Invalid promo code. Try WAYFARER10, FIRSTTRIP, or WEEKEND500."}), 404

    disc, cfg = _calc_discount(base_amount, code)
    return jsonify({
        "status": "success",
        "code": code,
        "discount": disc,
        "label": cfg["label"],
    })


@payments_bp.route("/payments/order", methods=["POST"])
def create_payment_order():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Please log in to proceed to payment"}), 401

    data = request.get_json(silent=True) or {}
    item = data.get("item") or {}
    qty = max(1, int(data.get("qty") or 1))
    base_amount = float(item.get("price") or 0) * qty
    if base_amount <= 0:
        return jsonify({"status": "error", "message": "Invalid booking amount"}), 400

    promo_code = (data.get("promo_code") or "").strip().upper()
    discount, _ = _calc_discount(base_amount, promo_code)
    tax_amount = round(base_amount * 0.05)
    convenience_fee = 99.0
    insurance_fee = 199.0 if data.get("travel_insurance") else 0.0
    final_amount = max(1.0, base_amount + tax_amount + convenience_fee + insurance_fee - discount)

    order_id = "ORD-" + uuid.uuid4().hex[:10].upper()
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    execute_query(
        """
        INSERT INTO payment_orders (
            order_id, user_id, booking_payload, base_amount, tax_amount,
            convenience_fee, insurance_fee, discount_amount, promo_code,
            final_amount, status, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created', ?)
        """,
        (
            order_id, user["user_id"], json.dumps(data),
            base_amount, tax_amount, convenience_fee, insurance_fee,
            discount, promo_code, final_amount, expires_at,
        ),
    )

    return jsonify({
        "status": "success",
        "order": {
            "order_id": order_id,
            "base_amount": base_amount,
            "tax_amount": tax_amount,
            "convenience_fee": convenience_fee,
            "insurance_fee": insurance_fee,
            "discount_amount": discount,
            "promo_code": promo_code,
            "final_amount": final_amount,
            "expires_at": expires_at,
            "booking": data,
        },
    }), 201


@payments_bp.route("/payments/verify-vpa", methods=["POST"])
def verify_vpa():
    data = request.get_json(silent=True) or {}
    vpa = (data.get("vpa") or "").strip().lower()
    if "@" not in vpa:
        return jsonify({"status": "error", "message": "Enter a valid UPI ID like name@okicici or mobile@ybl"}), 400
    prefix, handle = vpa.split("@", 1)
    if len(prefix) < 2 or not re.match(r"^[a-z0-9._-]+$", prefix):
        return jsonify({"status": "error", "message": "Invalid UPI username before @"}), 400
    if handle not in UPI_HANDLES and len(handle) < 2:
        return jsonify({"status": "error", "message": "Unrecognized UPI bank handle"}), 400

    bank_map = {
        "okicici": "ICICI Bank", "oksbi": "State Bank of India", "okaxis": "Axis Bank",
        "okhdfcbank": "HDFC Bank", "ybl": "Yes Bank / PhonePe", "paytm": "Paytm Payments Bank",
        "axl": "Axis Bank", "ibl": "IndusInd Bank", "upi": "NPCI BHIM UPI",
    }
    bank_name = bank_map.get(handle, handle.upper() + " Bank")
    holder = prefix.replace(".", " ").replace("_", " ").title()
    return jsonify({
        "status": "success",
        "verified": True,
        "vpa": vpa,
        "account_holder": holder,
        "bank_name": bank_name,
    })


@payments_bp.route("/payments/initiate", methods=["POST"])
def initiate_payment():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    order_id = data.get("order_id")
    method = (data.get("method") or "UPI").strip()

    order = fetch_one("SELECT * FROM payment_orders WHERE order_id = ? AND user_id = ?", (order_id, user["user_id"]))
    if not order:
        return jsonify({"status": "error", "message": "Payment order not found"}), 404
    if order["status"] == "Paid":
        return jsonify({"status": "error", "message": "This order is already paid"}), 400

    channel_detail = ""
    if method == "Card":
        card_num = re.sub(r"\D", "", data.get("card_number") or "")
        card_name = (data.get("card_name") or "").strip()
        expiry = (data.get("expiry") or "").strip()
        cvv = (data.get("cvv") or "").strip()

        if not _luhn_check(card_num):
            return jsonify({"status": "error", "message": "Card number failed real-time Luhn verification."}), 400
        if len(card_name) < 2:
            return jsonify({"status": "error", "message": "Enter cardholder name as printed on card."}), 400
        m = re.match(r"^(\d{2})/(\d{2})$", expiry)
        if not m:
            return jsonify({"status": "error", "message": "Expiry must be in MM/YY format."}), 400
        mm, yy = int(m.group(1)), int("20" + m.group(2))
        now = datetime.utcnow()
        if mm < 1 or mm > 12 or (yy < now.year) or (yy == now.year and mm < now.month):
            return jsonify({"status": "error", "message": "Card expiry date is invalid or expired."}), 400
        brand = _detect_card_brand(card_num)
        expected_cvv = 4 if brand == "Amex" else 3
        if not cvv.isdigit() or len(cvv) != expected_cvv:
            return jsonify({"status": "error", "message": f"{brand} requires a {expected_cvv}-digit CVV."}), 400
        channel_detail = f"{brand} ending {card_num[-4:]}"

    elif method == "UPI":
        vpa = (data.get("vpa") or "").strip().lower()
        if "@" not in vpa:
            return jsonify({"status": "error", "message": "Please enter and verify your UPI ID first."}), 400
        channel_detail = f"UPI ({vpa})"

    elif method == "NetBanking":
        bank = (data.get("bank") or "").strip()
        if not bank:
            return jsonify({"status": "error", "message": "Please select your bank."}), 400
        channel_detail = f"NetBanking · {bank}"

    elif method == "PayAtProperty":
        channel_detail = "Pay at property (Guaranteed)"
    else:
        channel_detail = method

    otp = str(100000 + (secrets.randbelow(900000)))
    execute_query(
        "UPDATE payment_orders SET payment_method = ?, channel_detail = ?, otp_code = ?, status = 'OTP_Pending' WHERE order_id = ?",
        (method, channel_detail, otp, order_id),
    )

    return jsonify({
        "status": "success",
        "order_id": order_id,
        "channel_detail": channel_detail,
        "demo_otp": otp,  # Shown in simulated Bank SMS toast so user can verify real-time OTP
        "message": f"3D-Secure verification initiated for {channel_detail}.",
    })


@payments_bp.route("/payments/verify-otp", methods=["POST"])
def verify_otp_and_complete():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    order_id = data.get("order_id")
    otp = (data.get("otp") or "").strip()

    order = fetch_one("SELECT * FROM payment_orders WHERE order_id = ? AND user_id = ?", (order_id, user["user_id"]))
    if not order:
        return jsonify({"status": "error", "message": "Payment order not found"}), 404

    if order["otp_code"] != otp:
        return jsonify({"status": "error", "message": "Incorrect verification OTP. Please check the SMS code and try again."}), 400

    txn_id = "TXN" + uuid.uuid4().hex[:10].upper()
    auth_code = "AUTH-" + uuid.uuid4().hex[:6].upper()
    execute_query(
        "UPDATE payment_orders SET status = 'Paid', txn_id = ?, auth_code = ? WHERE order_id = ?",
        (txn_id, auth_code, order_id),
    )

    # Create confirmed booking + expense in SQLite
    booking_data = json.loads(order["booking_payload"])
    item = booking_data.get("item") or {}
    item_name = item.get("name") or "Travel Booking"
    item_id = str(item.get("id") or "custom")
    item_meta = item.get("meta") or ""
    booking_type = (booking_data.get("type") or "activity").lower()
    dest_name = (booking_data.get("dest") or item.get("destination") or "India").strip()
    travel_date = booking_data.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    travellers = int(booking_data.get("qty") or 1)

    type_map = {
        "hotels": "hotel", "hotel": "hotel",
        "flights": "flight", "flight": "flight",
        "trains": "train", "train": "train",
        "buses": "bus", "bus": "bus",
        "rentals": "rental", "rental": "rental",
        "restaurants": "restaurant", "restaurant": "restaurant",
        "activities": "activity", "activity": "activity",
    }
    norm_type = type_map.get(booking_type, "activity")
    payment_status = "Due on arrival" if order["payment_method"] == "PayAtProperty" else "Paid"

    itin = fetch_one(
        "SELECT itinerary_id FROM itineraries WHERE user_id = ? AND status = 'Upcoming' ORDER BY created_at DESC LIMIT 1",
        (user["user_id"],),
    )
    itin_id = itin["itinerary_id"] if itin else None

    ref = "WF-" + uuid.uuid4().hex[:6].upper()
    bid = execute_query(
        """
        INSERT INTO bookings (
            booking_ref, user_id, itinerary_id, destination_name,
            booking_type, item_id, item_name, item_meta,
            travel_date, travellers, total_price, payment_method, payment_status, booking_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
        """,
        (
            ref, user["user_id"], itin_id, dest_name,
            norm_type, item_id, item_name, item_meta,
            travel_date, travellers, order["final_amount"], order["channel_detail"], payment_status,
        ),
    )

    exp_cat = "Stay" if norm_type == "hotel" else "Transport" if norm_type in ("flight", "train", "bus", "rental") else "Food" if norm_type == "restaurant" else "Activities"
    execute_query(
        """
        INSERT INTO trip_expenses (itinerary_id, user_id, destination_name, category, estimated_amount, actual_amount, day_number, note, expense_date)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        """,
        (itin_id, user["user_id"], dest_name, exp_cat, order["final_amount"], order["final_amount"], f"Verified Booking: {item_name}", travel_date),
    )

    return jsonify({
        "status": "Confirmed",
        "receipt": {
            "booking_id": bid,
            "ref": ref,
            "order_id": order_id,
            "txn_id": txn_id,
            "auth_code": auth_code,
            "amount_paid": order["final_amount"],
            "channel_detail": order["channel_detail"],
            "payment_status": payment_status,
            "item_name": item_name,
            "destination": dest_name,
            "travel_date": travel_date,
        },
    }), 201
