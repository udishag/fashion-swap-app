#import statements
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import MultiLabelBinarizer
from database import ENGINE

#if it matches gives 1 if no match 0

#database with text
#ml code translates these text into vectors
#goal is to look at trade history and see what learning can be done



#Config- connectiong mysql to ml

#vector checklist same order so dot product can be done
VALID_STYLES = ['grunge', 'alt', 'clean girl', 'simple', 'vintage']
VALID_COLORS = ['white', 'pastels', 'black', 'neutral', 'blue', 'red']

#raw strongs from datavase into a numerical match score
#extract a dataframe (like a excel spreadsheet)
def extract_features(df):

    #compare user size to the item size; booleans values converted into nuemrics
    df['size_match'] = (df['user_size'] == df['item_size']).astype(int)

    #what itmes o  checlksit with correct order; helps with the dot product
    # 1. FIXED GRID: We force a strict list order so every style has a permanent "slot" (e.g., Slot 0 is always Grunge).
    # 2. VECTORS: This translates raw text arrays like "grunge,alt" into standardized math grids of 1s and 0s.
    # 3. DOT PRODUCT: Because the slots align perfectly, multiplying them reveals exactly how many styles overlap.

    # --- 2. STYLE OVERLAP (The Vibe Score) ---
    # Initializes the master binarizer using our strict, unchangeable style order.
    mlb = MultiLabelBinarizer(classes=VALID_STYLES)
    
    # Converts comma-separated text strings (like "grunge,alt") into numeric vectors (like [1, 1, 0, 0, 0, 0]).
    u_style_vecs = mlb.fit_transform(df['user_styles'].str.split(','))
    i_style_vecs = mlb.transform(df['item_styles'].str.split(','))
    
    # Multiplies vectors slot-by-slot and adds them up. Higher numbers = deeper style compatibility.
    # ALGORITHM IMPACT: Provides a scale (0, 1, 2, etc.) so XGBoost can rank subtle alignment
    # instead of treating style matches as a simple, flat yes/no question.
    df['style_score'] = [np.dot(u, i) for u, i in zip(u_style_vecs, i_style_vecs)]

    # --- 3. BRAND AFFINITY (The VIP List) ---
    # Row-by-row check to see if the specific item brand is hidden inside the user's top 3 list.
    # ALGORITHM IMPACT: Teaches the model if a user's explicit brand loyalty overrides a partial 
    # style match (e.g., if they accept a "Simple" item just because it's from Brandy Melville).
    df['brand_match'] = df.apply(
        lambda x: 1 if x['item_brand'] in x['user_fav_brands'].split(',') else 0, 
        axis=1
    )

    # --- 4. COLOR OVERLAP ---
    # Repeats the exact same vector-alignment checklist logic used for styles, but for garments colors.
    # ALGORITHM IMPACT: Allows XGBoost to uncover secondary user habits (e.g., an 'Alt' user 
    # might strictly trade for dark items, rejecting bright pink items even if they are 'Alt' cut).
    mlb_color = MultiLabelBinarizer(classes=VALID_COLORS)
    u_color_vecs = mlb_color.fit_transform(df['user_colors'].str.split(','))
    i_color_vecs = mlb_color.transform(df['item_colors'].str.split(','))
    df['color_score'] = [np.dot(u, i) for u, i in zip(u_color_vecs, i_color_vecs)]

    # --- FINAL EXTRACTION ---
    # Strips out all original database text columns, leaving behind only the math scores.
    # ALGORITHM IMPACT: Handing raw text to XGBoost causes immediate crash. This ensures 
    # it only receives clean, numerical, mathematical dimensions.
    return df[['size_match', 'style_score', 'brand_match', 'color_score', 'sustainable_points']]


#pulls the past trade reuqest from the database
#it learns from features
#saves everything in json file which my app will use later
def train_model():
    # SQL QUERY: Gathers historical app data
    query = """
    SELECT 
        u.size as user_size, u.style_prefs as user_styles, 
        u.brand_prefs as user_fav_brands, u.color_prefs as user_colors,
        i.size as item_size, i.style_tags as item_styles, 
        i.brand as item_brand, i.color_tags as item_colors,
        u.sustainable_points, t.status
    FROM trade_requests t
    JOIN users u ON t.sender_id = u.id
    JOIN clothing_items i ON t.item_requested_id = i.id
    """
    df = pd.read_sql(query, ENGINE)

    if df.empty:
        print("Database is empty! Add historical trade data to MySQL Workbench first.")
        return

    df['target'] = (df['status'] == 'ACCEPTED').astype(int)

    X = extract_features(df)
    y = df['target']

    model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        max_depth=4
    )
    
    model.fit(X, y)
    model.save_model("moss_v2_model.json")
    print("SUCCESS: moss_v2_model.json created using structured profile features.")


# =========================================================================
# The Personalized Feed Generator
# =========================================================================
#one user and whole warehouse of clothes
#sees what the porbability is that the user eants it
#sorts items from highest to lowest probality
def generate_personalized_feed(user_id):
    """
    Takes an active user, fetches the entire available warehouse catalog,
    predicts the swap success probability for each item, and returns a sorted list.
    """
    # 1. Load your saved brain weights
    model = xgb.XGBClassifier()
    model.load_model("moss_v2_model.json")

    # 2. Fetch the target user profile data
    user_query = "SELECT size, style_prefs, brand_prefs, color_prefs, sustainable_points FROM users WHERE id = %s"
    user_df = pd.read_sql(user_query, ENGINE, params=[user_id])
    
    # 3. Fetch all pieces of clothing currently available in the warehouse
    items_query = "SELECT id as item_id, size as item_size, style_tags as item_styles, brand as item_brand, color_tags as item_colors FROM clothing_items WHERE status = 'AVAILABLE'"
    items_df = pd.read_sql(items_query, ENGINE)

    if items_df.empty:
        return []
    
    # 4. CROSS-JOIN: Duplicate the single user profile metrics down across every row of available items
    items_df['user_size'] = user_df['size'].iloc[0]
    items_df['user_styles'] = user_df['style_prefs'].iloc[0]
    items_df['user_fav_brands'] = user_df['brand_prefs'].iloc[0]
    items_df['user_colors'] = user_df['color_prefs'].iloc[0]
    items_df['sustainable_points'] = user_df['sustainable_points'].iloc[0]

    # 5. Extract our beautiful mathematical features for this matrix
    X_inference = extract_features(items_df.copy())

    # 6. Predict Probability: [:, 1] extracts the exact percentage chance that they'll love the item
    items_df['match_probability'] = model.predict_proba(X_inference)[:, 1]

    # 7. Sort from highest compatibility to lowest
    sorted_feed = items_df.sort_values(by='match_probability', ascending=False)

    # Return just the ranked item IDs or full objects for your Java backend to hand to the React feed
    return sorted_feed[['item_id', 'match_probability']].to_dict(orient='records')


if __name__ == "__main__":
    # If run directly, default to training the system
    train_model()


    #test vector for clean gril profile
    