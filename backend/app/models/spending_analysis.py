from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class SpendingAnalysis(Base):
    __tablename__ = "spending_analysis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    top_category = Column(String, nullable=True)
    gini_score = Column(Float, nullable=True)
    tree_depth = Column(Integer, nullable=True)
    recommendations_json = Column(String, nullable=True) # Store JSON string of recommendations
    insights_json = Column(String, nullable=True) # Store JSON string of overall insights
    potential_savings = Column(Float, nullable=True)

    owner = relationship("User", backref="spending_analyses")
