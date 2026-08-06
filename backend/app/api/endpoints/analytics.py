from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd
import json
import os
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.spending_analysis import SpendingAnalysis
from app.api.deps import get_current_user
from app.schemas.spending_analysis import SpendingAnalysisResponse, TrainDecisionTreeResponse
from app.ml.decision_tree import train_and_generate_tree
from app.ml.spending_advisor import generate_insights, generate_recommendations

router = APIRouter()

@router.post("/train-decision-tree", response_model=TrainDecisionTreeResponse)
def train_decision_tree(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch user transactions
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not transactions or len(transactions) < 5:
        raise HTTPException(status_code=400, detail="Not enough transactions to train the model. Minimum 5 required.")

    df = pd.DataFrame([{
        "amount": t.amount,
        "category": t.category,
        "description": t.description,
        "transaction_date": t.transaction_date,
        "transaction_type": t.transaction_type
    } for t in transactions])

    # Train model & generate tree
    tree_result = train_and_generate_tree(df, current_user.id)
    if not tree_result:
        raise HTTPException(status_code=400, detail="Failed to train Decision Tree.")

    # Generate insights and recommendations
    processed_df = tree_result['processed_df']
    insights = generate_insights(processed_df)
    insights["feature_importances"] = tree_result.get("importances", {})
    recommendations = generate_recommendations(processed_df, insights)

    # Save to database
    analysis = SpendingAnalysis(
        user_id=current_user.id,
        top_category=insights.get("top_category"),
        gini_score=tree_result.get("gini_score"),
        tree_depth=tree_result.get("tree_depth"),
        recommendations_json=json.dumps(recommendations),
        insights_json=json.dumps(insights),
        potential_savings=insights.get("total_savings_potential")
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return TrainDecisionTreeResponse(message="Decision Tree trained successfully.", analysis_id=analysis.id)

@router.get("/spending-analysis", response_model=SpendingAnalysisResponse)
def get_spending_analysis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = db.query(SpendingAnalysis).filter(SpendingAnalysis.user_id == current_user.id).order_by(SpendingAnalysis.id.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No spending analysis found. Please run analysis first.")
    
    return SpendingAnalysisResponse(
        id=analysis.id,
        generated_at=analysis.generated_at,
        top_category=analysis.top_category,
        gini_score=analysis.gini_score,
        tree_depth=analysis.tree_depth,
        recommendations=json.loads(analysis.recommendations_json) if analysis.recommendations_json else [],
        insights=json.loads(analysis.insights_json) if analysis.insights_json else None,
        potential_savings=analysis.potential_savings
    )

@router.get("/decision-tree")
def get_decision_tree_image(current_user: User = Depends(get_current_user)):
    img_path = f"model_artifacts/decision_tree_{current_user.id}.png"
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Decision tree image not found. Please run analysis first.")
    
    return FileResponse(img_path, media_type="image/png")

@router.get("/savings-recommendations")
def get_savings_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = db.query(SpendingAnalysis).filter(SpendingAnalysis.user_id == current_user.id).order_by(SpendingAnalysis.id.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No spending analysis found. Please run analysis first.")
    
    return json.loads(analysis.recommendations_json) if analysis.recommendations_json else []
