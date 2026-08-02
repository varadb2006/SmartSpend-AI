from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password_hash: str
    full_name: str | None=None


class UserLogin(BaseModel):
    email: str
    password_hash:str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name : str | None = None
    is_active: bool

    class Config:
        from_attribute = True


class Token(BaseModel):
    access_token: str
    token_type : str