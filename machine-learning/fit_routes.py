# machine-learning/fit_routes.py
# Drape calculation + free (no-Replicate) try-on and 3D garment endpoints.

import os
from flask import Blueprint, request, jsonify

fit_bp = Blueprint('fit', __name__)

# Free, CORS-enabled sample GLB (Khronos). To use your own file instead, put a .glb in
# frontend/public/models/garment.glb and set GARMENT_GLB_URL=/models/garment.glb in .env
GARMENT_GLB = os.environ.get(
    "GARMENT_GLB_URL",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Corset/glTF-Binary/Corset.glb",
)

ZONES = ('bust', 'waist', 'hips')
TIGHT_BELOW = -0.5
LOOSE_ABOVE = 4.0


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ── Drape calculation ─────────────────────────────────────────────────────
@fit_bp.route('/api/calculate-drape', methods=['POST'])
def calculate_drape():
    data = request.get_json(silent=True) or {}
    user = data.get('user_measurements') or {}
    item = data.get('item_measurements') or {}

    analysis, details = {}, {}
    for zone in ZONES:
        u, g = _num(user.get(zone)), _num(item.get(zone))
        if u is None or g is None:
            continue
        ease = round(g - u, 1)
        status = 'tight' if ease < TIGHT_BELOW else 'loose' if ease > LOOSE_ABOVE else 'ideal'
        analysis[zone] = status
        details[zone] = {'user': u, 'item': g, 'ease': ease, 'status': status}

    if not analysis:
        return jsonify({"error": "Need measurements to calculate drape"}), 400

    statuses = set(analysis.values())
    overall = 'tight' if 'tight' in statuses else 'ideal' if statuses == {'ideal'} else 'loose'

    return jsonify({
        "status": "success",
        "analysis": analysis,
        "details": details,
        "overall": overall,
    }), 200


# ── 2D try-on (free mode: returns the garment photo as the preview) ───────
@fit_bp.route('/api/generate-vton', methods=['POST'])
def generate_vton():
    data = request.get_json(silent=True) or {}
    garment_url = data.get('garment_image_url')
    human_url = data.get('user_image_url')

    if not garment_url and not human_url:
        return jsonify({"error": "Missing garment image"}), 400

    return jsonify({
        "status": "success",
        "vton_image": garment_url or human_url,
        "fallback": True,
        "warning": "Free mode: showing garment preview (no AI try-on).",
    }), 200


# ── 3D garment (free mode: returns a static GLB) ──────────────────────────
@fit_bp.route('/api/generate-3d-garment', methods=['POST'])
def generate_3d_garment():
    return jsonify({
        "status": "success",
        "mesh_url": GARMENT_GLB,
        "fallback": True,
        "warning": "Free 3D mode: using base GLB model.",
    }), 200