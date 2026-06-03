import pandas as pd
import numpy as np

# Configuration
NUM_SAMPLES = 1000
OUTPUT_FILE = "user_interactions.csv"

# Brands available in each tier
brands_t3 = ['aritzia', 'zara', 'urban outfitters', 'lululemon']
brands_t2 = ['gap', 'garage', 'princess polly']
brands_t1 = ['h&m', 'shein', 'walmart', 'pre-owned/thrifted']
all_brands = brands_t1 + brands_t2 + brands_t3

np.random.seed(42)

data = {
    'user_main_brand': np.random.choice(all_brands, NUM_SAMPLES),
    'item_brand': np.random.choice(all_brands, NUM_SAMPLES),
    # Random lat/long around a city center (e.g., London/Toronto area)
    'user_lat': np.random.uniform(42.90, 43.70, NUM_SAMPLES),
    'user_lon': np.random.uniform(-81.30, -79.30, NUM_SAMPLES),
    'item_lat': np.random.uniform(42.90, 43.70, NUM_SAMPLES),
    'item_lon': np.random.uniform(-81.30, -79.30, NUM_SAMPLES),
    'item_price': np.random.uniform(5.0, 150.0, NUM_SAMPLES),
    'has_premium_unlock': np.random.choice([0, 1], NUM_SAMPLES, p=[0.7, 0.3]) # 30% have paid the $10
}

df = pd.DataFrame(data)

# Helper function to compute tiers inside data gen to simulate realistic targets
def quick_tier(brand):
    if brand in brands_t3: return 3
    if brand in brands_t2: return 2
    return 1

# Generate a smart 'interacted' (y target) column
# Users are highly likely to interact if it's their tier OR if they have premium unlock for higher tiers
def simulate_interaction(row):
    u_tier = quick_tier(row['user_main_brand'])
    i_tier = quick_tier(row['item_brand'])
    
    if u_tier >= i_tier:
        return np.random.choice([0, 1], p=[0.3, 0.7]) # 70% chance to like same or lower tier
    elif row['has_premium_unlock'] == 1:
        return np.random.choice([0, 1], p=[0.4, 0.6]) # 60% chance to like higher tier if unlocked
    else:
        return np.random.choice([0, 1], p=[0.95, 0.05]) # Only 5% chance to see/interact with premium tier if not paid

df['interacted'] = df.apply(simulate_interaction, axis=1)

# Save it
df.to_csv(OUTPUT_FILE, index=False)
print(f"Successfully generated {NUM_SAMPLES} mock rows in '{OUTPUT_FILE}'!")