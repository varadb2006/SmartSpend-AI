import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartspend.db")
SECRET_KEY = os.getenv("SECRET_KEY", "simple_secret_key_for_local_dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")