import pandas as pd
import xgboost as xgb
import os

MODEL_PATH = os.environ.get("MODEL_PATH", "moss_v2_model.json")

BRAND_TIERS = {
    'aritzia': 3, 'zara': 3, 'urban outfitters': 3, 'lululemon': 3,
    'brandy melville': 3, 'reformation': 3, 'free people': 3,
    'anthropologie': 3, 'madewell': 3, 'cos': 3, 'oak + fort': 3,
    'alo': 3, 'alo yoga': 3, 'ba&sh': 3, 'sezane': 3,
    'gap': 2, 'garage': 2, 'princess polly': 2, 'american eagle': 2,
    'hollister': 2, 'abercrombie': 2, 'abercrombie & fitch': 2,
    'uniqlo': 2, 'banana republic': 2, 'j.crew': 2, 'everlane': 2,
    'frank and oak': 2, 'simons': 2, 'dynamite': 2, 'reitmans': 2,
    'h&m': 1, 'shein': 1, 'walmart': 1, 'pre-owned/thrifted': 1,
    'thrifted': 1, 'vintage': 1, 'target': 1, 'old navy': 1,
    'forever 21': 1, 'joe fresh': 1, 'winners': 1,
}

# Your exact 6 signup tags. Items get tagged with one (or more) of these.
VALID_STYLES = {'90s archival', 'clean girl', 'coquette', 'minimalist', 'streetwear', 'vintage'}

def get_brand_tier(name_of_brand):
    if not isinstance(name_of_brand, str):
        return 2
    return BRAND_TIERS.get(name_of_brand.lower().strip(), 2)


def get_stated_tier(user_brands: list[str]) -> int:
    if not user_brands:
        return 2
    return max(get_brand_tier(b) for b in user_brands)


def get_revealed_tier(uploaded_brands: list[str]):
    """Average tier of what they've actually uploaded. None if no uploads yet."""
    if not uploaded_brands:
        return None
    tiers = [get_brand_tier(b) for b in uploaded_brands]
    return int(sum(tiers) / len(tiers))


def get_user_tier(user_brands: list[str], uploaded_brands: list[str], has_premium: bool) -> int:
    """
    Rule order:
    1. premium=True -> stated tier always (premium bypasses the upload penalty)
    2. no uploads yet -> stated tier (fallback)
    3. otherwise -> revealed tier from upload history (this is what can drop
       an aritzia-stated user down to tier 1 if they keep uploading shein)
    """
    stated_tier = get_stated_tier(user_brands)
    if has_premium:
        return stated_tier
    revealed_tier = get_revealed_tier(uploaded_brands)
    return stated_tier if revealed_tier is None else revealed_tier


def normalize_styles(styles) -> set:
    """Lowercase + filter to known tags. Accepts a string or list."""
    if not styles:
        return set()
    if isinstance(styles, str):
        styles = [styles]
    cleaned = {s.lower().strip() for s in styles}
    return cleaned & VALID_STYLES


def style_match_boost(user_styles: set, item_styles: set) -> float:
    """
    Style is a RANKING signal only — it never blocks a trade, it only
    moves the match_score up or down within the items the brand-tier
    gate already allowed through.

    +0.08 if any style overlaps  (push matching-aesthetic items up)
     0.00 if either side has no style data (neutral, don't punish missing data)
    -0.05 if both have styles but share none (push mismatched items down slightly)

    These are small deliberately — brand tier and distance still dominate
    the ranking. This is a tonight-deployable heuristic, not a learned
    feature, because the training data has no style column yet. Once you
    log real interactions with style attached, retrain the model and this
    function can be replaced by a real learned feature.
    """
    if not user_styles or not item_styles:
        return 0.0
    if user_styles & item_styles:
        return 0.08
    return -0.05


def score_items(
    user_brands: list[str],
    has_premium: bool,
    items: list[dict],
    uploaded_brands: list[str] = None,
    user_styles=None,
) -> list[dict]:
    """
    items: each dict needs item_id, item_brand, item_price, distance_km,
    is_mock, and now optionally `item_style` (string or list of strings
    from VALID_STYLES — unrecognized tags are ignored, missing is fine).

    user_styles: string or list of strings from VALID_STYLES, e.g.
    ['clean girl', 'minimalist'] — from the user's profile.

    Returns same shape as before, plus:
        style_boost — float, the adjustment applied (for debugging/display)
    """
    if uploaded_brands is None:
        uploaded_brands = []

    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)

    user_tier = get_user_tier(user_brands, uploaded_brands, has_premium)
    user_style_set = normalize_styles(user_styles)

    df = pd.DataFrame(items)
    df['distance_km'] = df.get('distance_km', pd.Series([3.0] * len(df))).fillna(3.0)
    df['item_price']  = df.get('item_price',  pd.Series([30.0] * len(df))).fillna(30.0)
    df['is_mock']     = df.get('is_mock',     pd.Series([False] * len(df))).fillna(False)
    if 'item_style' not in df.columns:
        df['item_style'] = None

    df['user_tier']          = user_tier
    df['item_tier']          = df['item_brand'].apply(get_brand_tier)
    df['tier_diff']          = df['item_tier'] - df['user_tier']
    df['has_premium_unlock'] = int(has_premium)

    feature_cols = ['user_tier', 'item_tier', 'tier_diff', 'has_premium_unlock', 'distance_km', 'item_price']
    # Pass a plain numpy array, not a DataFrame — arrays carry no column
    # names, so XGBoost has nothing to validate against and can't raise
    # the "data did not contain feature names" error. Column ORDER is what
    # actually matters here, and feature_cols controls that explicitly.
    X = df[feature_cols].to_numpy(dtype=float)
    df['base_score'] = model.predict_proba(X)[:, 1]

    def apply_style(row):
        item_style_set = normalize_styles(row['item_style'])
        boost = style_match_boost(user_style_set, item_style_set)
        final = min(max(row['base_score'] + boost, 0.0), 0.99)
        return round(final, 4), boost

    styled = df.apply(apply_style, axis=1)
    df['match_score'] = [s[0] for s in styled]
    df['style_boost']  = [s[1] for s in styled]

    def tradeable_status(row):
        # Brand tier is the ONLY gate. Style never blocks a trade.
        if row.get('is_mock', False):
            return False, 'mock_item'
        if row['distance_km'] > 10:
            return False, 'out_of_range'
        if row['item_tier'] > user_tier and not has_premium:
            return False, 'premium_required'
        return True, None

    results = []
    for _, row in df.iterrows():
        tradeable, reason = tradeable_status(row.to_dict())
        results.append({
            'item_id':             row['item_id'],
            'item_brand':          row['item_brand'],
            'item_price':          float(row['item_price']),
            'distance_km':         float(row['distance_km']),
            'match_score':         float(row['match_score']),
            'match_pct':           int(round(row['match_score'] * 100)),
            'style_boost':         float(row['style_boost']),
            'tradeable':           tradeable,
            'blocked_reason':      reason,
            'effective_user_tier': user_tier,
        })

    results.sort(key=lambda x: x['match_score'], reverse=True)
    return results


def generate_live_feed(user_brand: str, has_premium_unlock: bool):
    mock_items = [
        {'item_id': 101, 'item_brand': 'aritzia',  'item_price': 95.0,  'distance_km': 2.5,  'is_mock': True},
        {'item_id': 102, 'item_brand': 'walmart',  'item_price': 12.0,  'distance_km': 1.1,  'is_mock': True},
        {'item_id': 103, 'item_brand': 'lululemon','item_price': 80.0,  'distance_km': 15.0, 'is_mock': True},
        {'item_id': 104, 'item_brand': 'garage',   'item_price': 25.0,  'distance_km': 4.0,  'is_mock': True},
        {'item_id': 105, 'item_brand': 'shein',    'item_price': 8.0,   'distance_km': 0.5,  'is_mock': True},
    ]
    results = score_items([user_brand], has_premium_unlock, mock_items, uploaded_brands=[])
    return pd.DataFrame(results)[['item_id', 'item_brand', 'item_price', 'match_score']]


if __name__ == "__main__":
    print("=== A: stated aritzia, uploads 3x shein, no premium, likes 'clean girl' ===")
    print("Expect: tier drops to 1, shein items get style boost if tagged clean girl\n")
    items = [
        {'item_id': 1, 'item_brand': 'aritzia', 'item_price': 95.0, 'distance_km': 2.0, 'is_mock': False, 'item_style': 'minimalist'},
        {'item_id': 2, 'item_brand': 'shein',   'item_price': 8.0,  'distance_km': 1.0, 'is_mock': False, 'item_style': 'clean girl'},
        {'item_id': 3, 'item_brand': 'walmart', 'item_price': 12.0, 'distance_km': 1.5, 'is_mock': False, 'item_style': 'streetwear'},
    ]
    for r in score_items(
        user_brands=['aritzia'], has_premium=False, items=items,
        uploaded_brands=['shein', 'shein', 'shein'], user_styles=['clean girl'],
    ):
        status = "tradeable" if r['tradeable'] else f"blocked: {r['blocked_reason']}"
        print(f"  tier={r['effective_user_tier']}  {r['match_pct']:3d}%  style_boost={r['style_boost']:+.2f}  {r['item_brand']:<10} {status}")

    print("\n=== B: same upload history, but user HAS premium ===")
    print("Expect: tier stays 3 (stated), aritzia becomes tradeable again\n")
    for r in score_items(
        user_brands=['aritzia'], has_premium=True, items=items,
        uploaded_brands=['shein', 'shein', 'shein'], user_styles=['clean girl'],
    ):
        status = "tradeable" if r['tradeable'] else f"blocked: {r['blocked_reason']}"
        print(f"  tier={r['effective_user_tier']}  {r['match_pct']:3d}%  style_boost={r['style_boost']:+.2f}  {r['item_brand']:<10} {status}")