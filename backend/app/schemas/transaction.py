from pydantic import BaseModel, field_validator
from datetime import datetime

class TransactionCreate(BaseModel):
    transaction_date: str 
    description: str
    amount: float
    transaction_type: str
    category: str | None = "Uncategorized"
    predicted_category: str | None = None
    prediction_confidence: float | None = None
    category_confirmed: bool = False
    confirmed_by_user: bool = False
    prediction_correct: bool | None = None
    prediction_time: str | None = None
    @field_validator("transaction_date")
    def validate_date(cls, v):
        try:
            # Enforce a strict ISO format so pandas parses it perfectly every time
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    transaction_date: str
    description: str
    amount: float
    transaction_type: str
    category: str
    predicted_category: str | None = None
    prediction_confidence: float | None = None
    category_confirmed: bool = False
    confirmed_by_user: bool = False
    prediction_correct: bool | None = None
    prediction_time: str | None = None
    model_version: str | None = None
    trained_at: str | None = None
    is_anomaly: bool
    anomaly_score: float | None = None

    class Config:
        from_attributes = True

class TransactionPredictRequest(BaseModel):
    description: str
    amount: float

class TransactionPredictResponse(BaseModel):
    predicted_category: str
    confidence: float

class TransactionPreview(BaseModel):
    id: str
    date: str
    description: str
    amount: float
    type: str
    category: str
    confidence: float | None = None
    status: str 
    is_corrected: bool = False

class TransactionUploadSummary(BaseModel):
    rows_found: int
    imported: int
    duplicates_removed: int
    invalid_rows: int
    ai_categorized: int
    user_corrected: int
    average_confidence: float
    model_updated: bool