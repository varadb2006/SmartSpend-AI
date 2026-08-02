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
    is_anomaly = Column(Boolean, default=False)

    owner = relationship("User", back_populates="transactions")