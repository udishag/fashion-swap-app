# machine-learning/app.py

import os
import json
import re
import traceback
import requests
from dotenv import load_dotenv

# Load .env FIRST so fit_routes can read GARMENT_GLB_URL
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from run_feed import generate_live_feed, score_items
from fit_routes import fit_bp  # loud on purpose: if fit_routes.py is wrong, you see it immediately

app = Flask(__name__)
# CORS for all API routes (also answers the browser's OPTIONS preflight)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Drape, 2D try-on, and 3D garment routes
app.register_blueprint(fit_bp)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
RESEND_KEY   = os.environ.get("RESEND_API_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


@app.route('/api/health', methods=['GET'])
def health():
    routes = sorted(r.rule for r in app.url_map.iter_rules() if r.rule.startswith('/api/'))
    return jsonify({"status": "ok", "routes": routes})


@app.route('/api/analyze-item', methods=['POST'])
def analyze_item():
    parts = []

    if 'image_front' in request.files:
        front_file = request.files['image_front']
        parts.append(types.Part.from_bytes(
            data=front_file.read(),
            mime_type=front_file.content_type or 'image/jpeg'
        ))

    if 'image_back' in request.files:
        back_file = request.files['image_back']
        parts.append(types.Part.from_bytes(
            data=back_file.read(),
            mime_type=back_file.content_type or 'image/jpeg'
        ))

    if not parts:
        return jsonify({"error": "No images provided for scanning"}), 400

    prompt = """
    You are an expert fashion stylist and tailor. Analyze the provided clothing item photo(s).
    Identify the brand, style, color, category, and tagged size.

    CRITICAL INSTRUCTION: Based on the brand (e.g., Aritzia, Zara), the identified size (e.g., S),
    and the garment's intended fit, estimate physical garment measurements in inches:
    - If brand is 'Aritzia' and size is 'M': bust ~36.5, waist ~28.5, hips ~38.5.
    - If brand is 'Aritzia' and size is 'S': bust ~34.5, waist ~26.5, hips ~36.5.
    - If oversized (hoodies/sweatshirts), adjust dimensions for ease (+2-4 inches).

    Return ONLY a raw JSON object with the following fields:
    {
      "title": "A short, descriptive aesthetic title",
      "brand": "Brand name",
      "color": "Dominant color",
      "categoryGender": "Womenswear, Menswear, or Unisex",
      "condition": "New with tags, Excellent, Good, or Fair",
      "size": "XXS, XS, S, M, L, XL",
      "details": "Any distinct fit notes",
      "estimated_measurements": {
          "bust": 36.0,
          "waist": 28.5,
          "hips": 38.5
      }
    }
    """

    parts.append(prompt)

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=parts,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        raw_text = response.text.strip()

        # Strip markdown code fences if the model adds them anyway
        if raw_text.startswith("```"):
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', raw_text, re.DOTALL)
            if match:
                raw_text = match.group(1).strip()

        data = json.loads(raw_text)
        return jsonify(data), 200

    except Exception as e:
        print("\n❌ ====== AI ANALYSIS ERROR ======")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/send-welcome', methods=['POST'])
def send_welcome():
    data     = request.json or {}
    username = data.get('username', '')
    email    = data.get('email', '')
    if not email:
        return jsonify({"status": "error", "message": "email required"}), 400

    # ⚠️ Replace with your real email template
    html = f"""<!DOCTYPE html><html><body>
    <h1>welcome to moss., {username}</h1>
    </body></html>"""

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


@app.route('/api/score-items', methods=['POST'])
def score_items_endpoint():
    data            = request.json or {}
    user_brands     = data.get('user_brands', ['zara'])
    uploaded_brands = data.get('uploaded_brands', [])
    user_styles     = data.get('user_styles', [])
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
            user_styles=user_styles,
        )
        return jsonify({"status": "success", "results": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)