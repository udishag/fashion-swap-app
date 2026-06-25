import os
from sqlalchemy import create_engine

# 1. Securely fetch the full Postgres connection string from your .env file
DATABASE_URL = os.environ.get("SUPABASE_DB_URL", "")

# 2. Create the Engine for train_model.py to use
# We check if the URL exists first so it doesn't crash if the .env is missing
if DATABASE_URL:
    ENGINE = create_engine(DATABASE_URL)
else:
    ENGINE = None
    print("Warning: SUPABASE_DB_URL is missing. Check your .env file!")