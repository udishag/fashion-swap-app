# machine-learning/app.py
#
# CHANGE FROM YOUR VERSION: score_items_endpoint() now also reads
# user_styles from the request and passes it through to score_items().
# uploaded_brands support (from the previous round) is unchanged.

import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from run_feed import generate_live_feed, score_items

app = Flask(__name__)
CORS(app)

RESEND_KEY   = os.environ.get("RESEND_API_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

@app.route('/api/send-welcome', methods=['POST'])
def send_welcome():
    data     = request.json or {}
    username = data.get('username', '')
    email    = data.get('email', '')
    if not email:
        return jsonify({"status": "error", "message": "email required"}), 400

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{{font-family:-apple-system,sans-serif;background:#fff;margin:0;padding:0}}
    .w{{max-width:500px;margin:0 auto;padding:40px 20px;text-align:center}}
    .logo{{font-size:2.4rem;font-weight:700;letter-spacing:-1px;text-transform:lowercase;color:#000;margin-bottom:5px}}
    .sub{{font-size:.9rem;color:#666;margin-bottom:35px;text-transform:lowercase}}
    img{{width:100%;height:auto;display:block}}
    .h{{font-size:1.6rem;font-weight:400;color:#000;text-transform:lowercase;margin:35px 0 15px}}
    .b{{font-size:.9rem;line-height:1.6;color:#333;max-width:420px;margin:0 auto 40px;font-weight:300}}
    .sig{{margin-top:40px;color:#000;font-size:.95rem;line-height:1.5;text-transform:lowercase}}
    .ft{{font-size:.7rem;color:#999;text-transform:lowercase;margin-top:60px;border-top:1px solid #eee;padding-top:20px}}
    </style></head><body><div class="w">
    <div class="logo">moss.</div>
    <div class="sub">welcome to the new era of style.</div>
    <img src="https://i.postimg.cc/W4X3dDts/Welcome-Email.jpg" alt="moss. founders"/>
    <div class="h">your inbox just got more beautiful.</div>
    <div class="b">congratulations {username.lower()}, you're officially on the list. we're building a space where fashion is defined by personal curation, and we're incredibly excited to have you along for this journey.</div>
    <div class="sig">much love,<br><strong>udi & daisy</strong></div>
    <div class="ft">&copy; moss. 2026. toronto.<br><a href="#" style="color:#999">unsubscribe</a></div>
    </div></body></html>"""

    resp = requests.post(
        'https://api.resend.com/emails',
        headers={'Authorization': f'Bearer {RESEND_KEY}', 'Content-Type': 'application/json'},
        json={'from': 'moss. <onboarding@resend.dev>', 'to': email, 'subject': 'welcome to moss.', 'html': html}
    )
    return jsonify({"status": "success", "backend_response": resp.text}), resp.status_code


@app.route('/api/feed', methods=['GET'])
def get_feed():
    brand   = request.args.get('brand', default='zara', type=str)
    premium = request.args.get('premium', default='false', type=str).lower() == 'true'
    try:
        df = generate_live_feed(brand, premium)
        return jsonify({"status": "success", "feed": df.to_dict(orient='records')})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ── score real items — now with uploaded_brands AND user_styles ─────────────
#
# POST /api/score-items
# {
#   "user_brands": ["aritzia"],
#   "uploaded_brands": ["shein", "shein", "shein"],
#   "user_styles": ["clean girl", "minimalist"],     ← NEW
#   "has_premium": false,
#   "items": [
#     { "item_id": "abc", "item_brand": "shein", "item_price": 8,
#       "distance_km": 1.2, "is_mock": false, "item_style": "clean girl" }
#   ]
# }

@app.route('/api/score-items', methods=['POST'])
def score_items_endpoint():
    data            = request.json or {}
    user_brands     = data.get('user_brands', ['zara'])
    uploaded_brands = data.get('uploaded_brands', [])
    user_styles     = data.get('user_styles', [])      # NEW
    has_premium     = bool(data.get('has_premium', False))
    items           = data.get('items', [])

    if not items:
        return jsonify({"status": "error", "message": "items list is required"}), 400

    try:
        results = score_items(
            user_brands=user_brands,
            has_premium=has_premium,
            items=items,
            uploaded_brands=uploaded_brands,
            user_styles=user_styles,    # NEW
        )
        return jsonify({"status": "success", "results": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)