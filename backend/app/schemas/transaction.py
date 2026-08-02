from pydantic import BaseModel

class TransactionCreate(BaseModel):
    transaction_date: str
    description: str
    amount: float
    transaction_type: str
    category: str | None = "Uncategorized"

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    transaction_date: str
    description: str
    amount: float
    transaction_type: str
    category: str
    is_anomaly: bool

    class Config:
        from_attributes = True