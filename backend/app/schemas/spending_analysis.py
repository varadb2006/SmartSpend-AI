from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class Recommendation(BaseModel):
    title: str
    description: str
    potential_savings: Optional[float] = 0.0

class Insights(BaseModel):
    top_category: str
    second_highest: str
    third_highest: str
    max_growth_category: str
    min_growth_category: str
    most_frequent: str
    highest_single: float
    monthly_waste: float
    total_savings_potential: float
    feature_importances: Optional[Dict[str, float]] = None

class SpendingAnalysisResponse(BaseModel):
    id: int
    generated_at: datetime
    top_category: Optional[str]
    gini_score: Optional[float]
    tree_depth: Optional[int]
    recommendations: List[Recommendation]
    insights: Optional[Insights]
    potential_savings: Optional[float]

    class Config:
        from_attributes = True

class TrainDecisionTreeResponse(BaseModel):
    message: str
    analysis_id: int
