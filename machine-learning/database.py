#ml database that is on python

from sqlalchemy import create_engine

#creditinals for db
DB_USER = "root"
DB_PASSWORD = "Tennis20180415"
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "fashiondb"


# This creates the "Engine" your train_model.py is asking for
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
ENGINE = create_engine(DATABASE_URL)