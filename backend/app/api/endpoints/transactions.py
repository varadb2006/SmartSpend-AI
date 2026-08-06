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
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionPredictRequest, TransactionPredictResponse, TransactionPreview, TransactionUploadSummary
from app.api.deps import get_current_user
from app.services.categorizer import train_categorizer, predict_categories, predict_categories_with_confidence
from app.services.anamoly_detector import flag_anomalies
from app.services.forecaster import forecast_next_month
from pydantic import BaseModel
import difflib
import uuid

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

def background_detect_anomalies(user_id: int):
    print(f"✓ Starting background anomaly detection for user {user_id}")
    db = SessionLocal()
    try:
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type.in_(["debit", "DEBIT", "expense", "EXPENSE", "Debit", "Expense"])
        ).all()
        
        if len(transactions) >= 5:
            df = pd.DataFrame([{"amount": t.amount} for t in transactions])
            anomaly_flags, anomaly_scores = flag_anomalies(df)
            
            for idx, transaction in enumerate(transactions):
                transaction.is_anomaly = anomaly_flags[idx]
                transaction.anomaly_score = anomaly_scores[idx]
            
            db.commit()
            print(f"✓ Background anomaly detection complete.")
    except Exception as e:
        print(f"Error in background anomaly detection: {e}")
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
    background_tasks.add_task(background_detect_anomalies, current_user.id)
        
    return db_transaction

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), skip: int = 0, limit: int = 100):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.id.desc()).offset(skip).limit(limit).all()
    return transactions

@router.post("/upload/preview", response_model=List[TransactionPreview])
async def upload_preview(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # 1. Fuzzy Column Matching
    col_map = {}
    target_cols = {
        "date": ["date", "transaction date", "txn date", "date of transaction"],
        "description": ["description", "narration", "merchant", "particulars", "details"],
        "amount": ["amount", "txn amount", "value", "debit", "credit"],
        "transaction_type": ["transaction_type", "type", "txn type"],
        "category": ["category", "expense type"]
    }
    
    for df_col in df.columns:
        df_col_lower = str(df_col).lower().strip()
        matched = False
        for target, aliases in target_cols.items():
            if target in col_map.values(): continue
            matches = difflib.get_close_matches(df_col_lower, aliases, n=1, cutoff=0.6)
            if matches:
                col_map[df_col] = target
                matched = True
                break
        if not matched and "amount" not in col_map.values():
            if "amt" in df_col_lower: col_map[df_col] = "amount"
            
    df = df.rename(columns=col_map)
    
    # Check minimum requirements
    required = ["date", "description", "amount"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns (even after fuzzy matching): {', '.join(missing)}")

    # 2. Data Cleaning
    original_count = len(df)
    # Drop rows missing critical data
    df = df.dropna(subset=["date", "amount"])
    # Drop duplicates
    df = df.drop_duplicates(subset=["date", "description", "amount"])
    
    # Normalize Date
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.strftime("%Y-%m-%d")
    df = df.dropna(subset=["date"])

    # Normalize Amount & Type
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    
    if "transaction_type" not in df.columns:
        df["transaction_type"] = df["amount"].apply(lambda x: "DEBIT" if x < 0 else "CREDIT")
    else:
        df["transaction_type"] = df["transaction_type"].fillna("").astype(str).str.upper()
        df["transaction_type"] = df.apply(lambda row: "DEBIT" if row["amount"] < 0 else (row["transaction_type"] if row["transaction_type"] else "DEBIT"), axis=1)

    df["amount"] = df["amount"].abs()
    df["description"] = df["description"].fillna("Unknown").astype(str).str.strip()

    if "category" not in df.columns:
        df["category"] = ""
    df["category"] = df["category"].fillna("").astype(str).str.strip()

    # 3. Predict Missing Categories
    missing_mask = df["category"] == ""
    
    previews = []
    if missing_mask.any():
        ml_df = df[missing_mask].copy()
        predictions = predict_categories_with_confidence(ml_df)
        
        pred_idx = 0
        for idx, row in df.iterrows():
            is_missing = row["category"] == ""
            cat = predictions[pred_idx]["category"] if is_missing else row["category"]
            conf = predictions[pred_idx]["confidence"] if is_missing else None
            status = "AI Predicted" if is_missing else "Provided"
            if is_missing: pred_idx += 1
            
            previews.append(TransactionPreview(
                id=str(uuid.uuid4()),
                date=row["date"],
                description=row["description"],
                amount=row["amount"],
                type=row["transaction_type"],
                category=cat,
                confidence=conf,
                status=status,
                is_corrected=False
            ))
    else:
        for idx, row in df.iterrows():
            previews.append(TransactionPreview(
                id=str(uuid.uuid4()),
                date=row["date"],
                description=row["description"],
                amount=row["amount"],
                type=row["transaction_type"],
                category=row["category"],
                confidence=None,
                status="Provided",
                is_corrected=False
            ))

    return previews

@router.post("/upload/confirm", response_model=TransactionUploadSummary)
def upload_confirm(
    transactions: List[TransactionPreview], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    total_imported = 0
    ai_categorized = 0
    user_corrected = 0
    total_conf = 0.0
    
    for t in transactions:
        # Save to DB
        db_transaction = Transaction(
            user_id=current_user.id,
            transaction_date=t.date,
            description=t.description,
            amount=t.amount,
            transaction_type=t.type.upper(),
            category=t.category,
            predicted_category=t.category if t.status == "AI Predicted" else None,
            prediction_confidence=t.confidence,
            category_confirmed=t.is_corrected,
            confirmed_by_user=True,
            prediction_correct=not t.is_corrected if t.status == "AI Predicted" else None,
            prediction_time=datetime.utcnow().isoformat() + "Z" if t.status == "AI Predicted" else None
        )
        db.add(db_transaction)
        total_imported += 1
        
        if t.status == "AI Predicted":
            ai_categorized += 1
            if t.confidence is not None:
                total_conf += t.confidence
        if t.is_corrected:
            user_corrected += 1

    db.commit()

    model_updated = False
    if user_corrected > 0:
        background_tasks.add_task(background_train_model, current_user.id)
        model_updated = True

    background_tasks.add_task(background_detect_anomalies, current_user.id)

    avg_conf = (total_conf / ai_categorized) if ai_categorized > 0 else 0.0

    return TransactionUploadSummary(
        rows_found=len(transactions),
        imported=total_imported,
        duplicates_removed=0, # Calculated in preview
        invalid_rows=0, # Calculated in preview
        ai_categorized=ai_categorized,
        user_corrected=user_corrected,
        average_confidence=avg_conf,
        model_updated=model_updated
    )

@router.post("/train-categorizer")
def trigger_model_training(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

    background_tasks.add_task(background_detect_anomalies, current_user.id)

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
    background_tasks.add_task(background_detect_anomalies, current_user.id)
    
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