from typing import List
import pandas as pd
import io
from fastapi import APIRouter, Depends,UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.api.deps import get_current_user
from app.services.categorizer import train_categorizer, predict_categories
from app.services.anamoly_detector import flag_anomalies

router = APIRouter()

@router.post("/", response_model=TransactionResponse)
def create_transaction( transaction_in : TransactionCreate, db:Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    db_transaction = Transaction( **transaction_in.model_dump(), user_id = current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user:  User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return transactions

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), db : Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    contents = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else :
            raise HTTPException(status_code=400, detail="Only .csv and .xlsx filea are allowed")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    required_columns = {"Date", "DEscription", "Amount", "Transaction_Type"}
    if not required_columns.issubset(df.columns):
        raise HTTPException( status_code=400, detail=f"Missing required columns. File must contain: {', '.join(required_columns)}")

    ml_df = pd.DataFrame({"description" : df["Description"].astype(str), "amount" : pd.to_numeric(df["Amount"], errors='coerce').fillna(0.0)})
    predicted_categories = predict_categories(ml_df)
    transaction_Added =0
    for index, row in df.iterrows():
        provided_category = row.get("Category")
        if pd.isna(provided_category) or str(provided_category).strip() == "":
            final_category = predicted_categories[index]
        else:
            final_category= str(provided_category)

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
    
    return {
        "message": "File processed successfully", 
        "total_processed": transaction_Added
    }

@router.post("/train-categorizer")
def trigger_model_training(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions found to train on.")
    df = pd.DataFrame([{"description": t.description,"amount": t.amount,"category": t.category} for t in transactions])
    success = train_categorizer(df)
    if not success:
        raise HTTPException(status_code=400, detail="Not enough categorized data to train the model. Minimum 10 categorized transactions required.")

    return {"message": "XGBoost categorizer trained successfully!"}

@router.post("/detect-anomalies")
def trigger_anomaly_detection(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id,Transaction.transaction_type == "EXPENSE").all()
    if len(transactions) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 expenses to run anomaly detection.")
    df = pd.DataFrame([{"amount": t.amount} for t in transactions])
    anomaly_flags = flag_anomalies(df)
    anomalies_found = 0
    for idx, transaction in enumerate(transactions):
        transaction.is_anomaly = anomaly_flags[idx]
        if anomaly_flags[idx]:
            anomalies_found += 1

    db.commit()

    return {"message": "Anomaly detection complete","total_analyzed": len(transactions), "anomalies_found": anomalies_found }