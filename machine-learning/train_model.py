import os
import math
import pandas as pd
import xgboost as xgb  # Fixed typo 'xbg' -> 'xgb'
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

# Constants
DATA_PATH = "user_interactions.csv"
MODEL_OUTPUT_PATH = "moss_v2_model.json"

BRAND_TIERS = {
    'aritzia': 3, 'zara': 3, 'urban outfitters': 3, 'lululemon': 3,
    'gap': 2, 'garage': 2, 'princess polly': 2,
    'h&m': 1, 'shein': 1, 'walmart': 1, 'pre-owned/thrifted': 1,
}

def get_brand_tier(name_of_brand):
    """Returns the tier of a brand. Defaults to 1 if unknown."""
    if not isinstance(name_of_brand, str):
        return 1
    brand_lower = name_of_brand.lower().strip()
    return BRAND_TIERS.get(brand_lower, 1)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates the distance in kilometers between two geo-coordinate pairs."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    # Combined cleanly to avoid any syntax or math module attribute errors
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def load_and_prepare_data(data_path):
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Please generate or provide {data_path} first.")
        
    df = pd.read_csv(data_path)
    
    # Feature Engineering based on your new business rules
    df['user_tier'] = df['user_main_brand'].apply(get_brand_tier)
    df['item_tier'] = df['item_brand'].apply(get_brand_tier)
    
    # Calculate distance
    df['distance_km'] = df.apply(lambda row: haversine_distance(
        row['user_lat'], row['user_lon'], row['item_lat'], row['item_lon']
    ), axis=1)
    
    # Core monetization feature: Is the user looking at a higher tier than they belong to?
    # And have they paid the premium ($10 unlock)?
    df['tier_diff'] = df['item_tier'] - df['user_tier']
    df['has_premium_unlock'] = df['has_premium_unlock'].astype(int) # 1 if paid $10, else 0
    
    # Define features (X) and target (y - e.g., 'liked_item' or 'interacted')
    feature_cols = ['user_tier', 'item_tier', 'tier_diff', 'has_premium_unlock', 'distance_km', 'item_price']
    X = df[feature_cols]
    y = df['interacted'] 
    
    return train_test_split(X, y, test_size=0.2, random_state=42)

def train_model():
    print("Loading data...")
    try:
        X_train, X_test, y_train, y_test = load_and_prepare_data(DATA_PATH)
    except FileNotFoundError:
        print(f"Error: {DATA_PATH} not found. Creating a dummy file for testing...")
        return
        
    print("Training XGBoost Model...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    print("\nModel Evaluation:")
    print(classification_report(y_test, preds))
    print(f"ROC AUC Score: {roc_auc_score(y_test, probs):.4f}")
    
    # Save model
    model.save_model(MODEL_OUTPUT_PATH)
    print(f"Model successfully saved to {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train_model()