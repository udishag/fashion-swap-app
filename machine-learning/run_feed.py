#import and setup
import pandas as pd #structured table on amrkertplace
import xgboost as xgb

MODEL_PATH = "moss_v2_model.json"

BRAND_TIERS = {
    'aritzia': 3, 'zara': 3, 'urban outfitters': 3, 'lululemon': 3,
    'gap': 2, 'garage': 2, 'princess polly': 2,
    'h&m': 1, 'shein': 1, 'walmart': 1, 'pre-owned/thrifted': 1,
}

def get_brand_tier(name_of_brand):
    return BRAND_TIERS.get(name_of_brand.lower().strip(), 1)

#prepare the user and inventory

def generate_live_feed(user_brand, has_premium_unlock):
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    
    user_tier = get_brand_tier(user_brand)
    
    available_items = [
        {'item_id': 101, 'item_brand': 'aritzia', 'item_price': 95.0, 'distance_km': 2.5},
        {'item_id': 102, 'item_brand': 'walmart', 'item_price': 12.0, 'distance_km': 1.1},
        {'item_id': 103, 'item_brand': 'lululemon', 'item_price': 80.0, 'distance_km': 15.0},
        {'item_id': 104, 'item_brand': 'garage', 'item_price': 25.0, 'distance_km': 4.0},
        {'item_id': 105, 'item_brand': 'shein', 'item_price': 8.0, 'distance_km': 0.5},
    ]
    
    df_items = pd.DataFrame(available_items)
    
    df_items['user_tier'] = user_tier
    df_items['item_tier'] = df_items['item_brand'].apply(get_brand_tier)
    df_items['tier_diff'] = df_items['item_tier'] - df_items['user_tier']
    df_items['has_premium_unlock'] = int(has_premium_unlock)
    
    feature_cols = ['user_tier', 'item_tier', 'tier_diff', 'has_premium_unlock', 'distance_km', 'item_price']
    X_live = df_items[feature_cols]
    
    df_items['match_score'] = model.predict_proba(X_live)[:, 1]
    
    ranked_feed = df_items.sort_values(by='match_score', ascending=False)
    
    return ranked_feed[['item_id', 'item_brand', 'item_price', 'match_score']]

if __name__ == "__main__":
    print("--- SCENARIO A: Walmart User (NO Premium) ---")
    print(generate_live_feed(user_brand='walmart', has_premium_unlock=False))
    
    print("\n--- SCENARIO B: Walmart User (PAID $10 Premium) ---")
    print(generate_live_feed(user_brand='walmart', has_premium_unlock=True))