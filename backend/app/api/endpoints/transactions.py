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

    transaction_Added =0
    for _, row in df.iterrows():
        category = row.get("Category", "Uncategorized")
        if pd.isna(category):
            category = "Uncategorized"

        db_transaction = Transaction(
            user_id=current_user.id,
            transaction_date=str(row["Date"]),
            description=str(row["Description"]),
            amount=float(row["Amount"]),
            transaction_type=str(row["Transaction_Type"]).upper(),
            category=str(category)
        )
        db.add(db_transaction)
        transaction_Added += 1

    db.commit()
    
    return {
        "message": "File processed successfully", 
        "total_processed": transaction_Added
    }