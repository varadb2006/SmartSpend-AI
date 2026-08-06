from typing import List
import pandas as pd
import io
import os
import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionPredictRequest, TransactionPredictResponse
from app.api.deps import get_current_user
from app.services.categorizer import train_categorizer, predict_categories, predict_categories_with_confidence
from app.services.anamoly_detector import flag_anomalies
from app.services.forecaster import forecast_next_month
from pydantic import BaseModel

router = APIRouter()

class CategoryUpdate(BaseModel):
    category: str

def background_train_model(user_id: int):
    print(f"✓ Starting background model training for user {user_id}")
    db = SessionLocal()
    try:
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        if transactions:
            df = pd.DataFrame([{"description": t.description, "amount": t.amount, "category": t.category} for t in transactions])
            train_categorizer(df)
            print("✓ Background model training completed.")
    finally:
        db.close()

@router.post("/predict-category", response_model=TransactionPredictResponse)
def predict_category(req: TransactionPredictRequest):
    ml_df = pd.DataFrame([{"description": req.description, "amount": float(req.amount)}])
    res = predict_categories_with_confidence(ml_df)[0]
    return TransactionPredictResponse(predicted_category=res["category"], confidence=res["confidence"])

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    transaction_in: TransactionCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    print(f"✓ Transaction received: {transaction_in.description} | {transaction_in.amount}")
    
    transaction_data = transaction_in.model_dump()
    db_transaction = Transaction(**transaction_data, user_id=current_user.id)
    
    if db_transaction.predicted_category:
        db_transaction.prediction_time = datetime.utcnow().isoformat() + "Z"
        if db_transaction.predicted_category == "Uncategorized":
            db_transaction.prediction_correct = False
        elif db_transaction.prediction_confidence is not None and db_transaction.prediction_confidence < 0.60:
            db_transaction.prediction_correct = False
        elif db_transaction.predicted_category == db_transaction.category:
            db_transaction.prediction_correct = True
        else:
            db_transaction.prediction_correct = False

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    print("✓ Database updated with new transaction")
    
    if transaction_in.category_confirmed:
        background_tasks.add_task(background_train_model, current_user.id)
        
    return db_transaction

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), skip: int = 0, limit: int = 100):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.id.desc()).offset(skip).limit(limit).all()
    return transactions

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contents = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are allowed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    required_columns = {"Date", "Description", "Amount", "Transaction_Type"}
    if not required_columns.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"Missing required columns. File must contain: {', '.join(required_columns)}")

    ml_df = pd.DataFrame({
        "description": df["Description"].astype(str), 
        "amount": pd.to_numeric(df["Amount"], errors='coerce').fillna(0.0)
    })
    
    predicted_categories = predict_categories(ml_df)
    transaction_Added = 0
    
    for i, (index, row) in enumerate(df.iterrows()):
        provided_category = row.get("Category")
        if pd.isna(provided_category) or str(provided_category).strip() == "":
            final_category = predicted_categories[i] 
        else:
            final_category = str(provided_category)

        db_transaction = Transaction(
            user_id=current_user.id,
            transaction_date=str(row["Date"]),
            description=str(row["Description"]),
            amount=float(row["Amount"]),
            transaction_type=str(row["Transaction_Type"]).upper(),
            category=final_category
        )
        db.add(db_transaction)
        transaction_Added += 1

    db.commit()
    return {"message": "File processed successfully", "total_processed": transaction_Added}

@router.post("/train-categorizer")
def trigger_model_training(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print("✓ Model training started manually")
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions found to train on.")
    
    df = pd.DataFrame([{"description": t.description,"amount": t.amount,"category": t.category} for t in transactions])
    
    success = train_categorizer(df)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Not enough data. Minimum 10 categorized transactions and at least 2 distinct categories required."
        )

    uncategorized_txs = [t for t in transactions if not t.category or t.category.strip() == "" or t.category.strip().lower() == "uncategorized"]
    if uncategorized_txs:
        uncat_df = pd.DataFrame([{"description": t.description, "amount": t.amount} for t in uncategorized_txs])
        preds = predict_categories(uncat_df)
        
        for idx, t in enumerate(uncategorized_txs):
            t.category = preds[idx]
        
        db.commit()

    return {"message": "XGBoost categorizer trained successfully!"}

@router.post("/detect-anomalies")
def trigger_anomaly_detection(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print("✓ Anomaly detection started")
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type.in_(["debit", "DEBIT", "expense", "EXPENSE", "Debit", "Expense"])
    ).all()
    
    if len(transactions) < 5:
        return {"message": "Need at least 5 expenses to run anomaly detection.", "total_analyzed": len(transactions), "anomalies_found": 0}
        
    df = pd.DataFrame([{"amount": t.amount} for t in transactions])
    anomaly_flags, anomaly_scores = flag_anomalies(df)
    
    anomalies_found = 0
    for idx, transaction in enumerate(transactions):
        transaction.is_anomaly = anomaly_flags[idx]
        transaction.anomaly_score = anomaly_scores[idx]
        if anomaly_flags[idx]:
            anomalies_found += 1

    db.commit()
    print(f"✓ Anomaly detection complete. {anomalies_found} anomalies found.")
    return {"message": "Anomaly detection complete","total_analyzed": len(transactions), "anomalies_found": anomalies_found}

@router.get("/forecast")
def get_spending_forecast(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type.in_(["debit", "DEBIT", "expense", "EXPENSE", "Debit", "Expense"])
    ).all()
    
    if not transactions:
        return {"forecasted_amount": 0.0, "message": "No expense data available."}

    df = pd.DataFrame([{"transaction_date": t.transaction_date, "amount": t.amount} for t in transactions])
    predicted_amount = forecast_next_month(df)

    if predicted_amount == 0.0:
        return {"forecasted_amount": 0.0, "message": "Need at least 3 months of historical data to generate a reliable forecast."}

    return {"forecasted_amount": predicted_amount, "message": "Forecast generated successfully."}

@router.put("/{transaction_id}/category")
def update_transaction_category(
    transaction_id: int, 
    update_data: CategoryUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    transaction.category = update_data.category
    db.commit()
    db.refresh(transaction)
    
    background_tasks.add_task(background_train_model, current_user.id)
    
    return {
        "message": "Category updated successfully", 
        "transaction_id": transaction.id,
        "description": transaction.description,
        "updated_category": transaction.category
    }

@router.get("/model/metadata")
def get_model_metadata(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    path = "model_artifacts/metadata.json"
    meta = {"model_version": None, "trained_at": None, "training_rows": 0}
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
            meta["model_version"] = data.get("model_version")
            meta["trained_at"] = data.get("trained_at")
            meta["training_rows"] = data.get("training_rows", 0)

    predictions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.predicted_category.isnot(None)
    ).all()

    total_preds = len(predictions)
    tp = 0
    fp = 0
    fn = 0
    for p in predictions:
        if p.prediction_correct is True:
            tp += 1
        else:
            if p.predicted_category == "Uncategorized" or (p.prediction_confidence is not None and p.prediction_confidence < 0.60):
                fn += 1
            else:
                fp += 1

    accuracy = tp / total_preds if total_preds > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    return {
        **meta,
        "total_predictions": total_preds,
        "correct_predictions": tp,
        "incorrect_predictions": total_preds - tp,
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }