import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score, precision_recall_fscore_support
from xgboost import XGBClassifier
import joblib
import json
import os

def train():
    print("Loading dataset...")
    # Load the Kaggle dataset
    df = pd.read_csv('../../data/aug_personal_transactions_with_UserId.csv')
    
    # We only care about transactions that have a Category and Description
    df = df.dropna(subset=['Description', 'Category'])
    
    print(f"Total valid transactions: {len(df)}")
    
    X = df['Description'].astype(str)
    y = df['Category']
    
    # 1. Encode Target Categories
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # 2. Extract Text Features
    vectorizer = TfidfVectorizer(max_features=1000, ngram_range=(1, 2), stop_words='english')
    X_vec = vectorizer.fit_transform(X)
    
    # 3. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X_vec, y_encoded, test_size=0.2, random_state=42)
    
    print("Training XGBoost Classifier...")
    # 4. Train XGBoost Model
    xgb = XGBClassifier(
        n_estimators=100, 
        learning_rate=0.1, 
        max_depth=5, 
        random_state=42, 
        objective='multi:softprob'
    )
    xgb.fit(X_train, y_train)
    
    print("Evaluating Model...")
    # 5. Evaluation (Strict Syllabus Metrics)
    y_pred = xgb.predict(X_test)
    y_pred_proba = xgb.predict_proba(X_test)
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    
    # Precision, Recall, F-measure
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    
    # ROC/AUC
    try:
        roc_auc = roc_auc_score(y_test, y_pred_proba, multi_class='ovr')
    except Exception as e:
        roc_auc = "N/A (Error calculating AUC)"
        
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n--- Model Evaluation ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F-measure: {f1:.4f}")
    print(f"ROC/AUC:   {roc_auc}")
    print("\nConfusion Matrix:")
    print(cm)
    
    # 6. Serialization
    os.makedirs('../models/artifacts', exist_ok=True)
    
    # Save the artifacts
    joblib.dump(xgb, '../models/artifacts/xgb_model.pkl')
    joblib.dump(vectorizer, '../models/artifacts/tfidf_vectorizer.pkl')
    joblib.dump(le, '../models/artifacts/label_encoder.pkl')
    
    print("\nModels successfully saved to backend/models/artifacts/")

if __name__ == "__main__":
    train()
