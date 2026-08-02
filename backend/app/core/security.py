from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from app.core import config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(frontend_hash: str) -> str:
    return pwd_context.hash(frontend_hash)

def verify_password(frontend_hash: str, db_hashed_password: str) -> bool:
    return pwd_context.verify(frontend_hash, db_hashed_password)

def create_access_token(data:dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return encoded_jwt