from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    transaction_date = Column(String)
    description = Column(String)
    amount = Column(Float)
    transaction_type = Column(String, default="EXPENSE")
    
    category = Column(String, default="Uncategorized")
    predicted_category = Column(String, nullable=True)
    prediction_confidence = Column(Float, nullable=True)
    category_confirmed = Column(Boolean, default=False)
    confirmed_by_user = Column(Boolean, default=False)
    prediction_correct = Column(Boolean, nullable=True)
    prediction_time = Column(String, nullable=True)
    model_version = Column(String, nullable=True)
    trained_at = Column(String, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)

    owner = relationship("User", back_populates="transactions")