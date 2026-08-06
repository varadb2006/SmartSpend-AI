import os 
import json
import joblib
import pandas as pd
from datetime import datetime
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score
from xgboost import XGBClassifier

MODEL_PATH = "model_artifacts/xgb_pipeline.joblib"
ENCODER_PATH = "model_artifacts/label_encoder.joblib"
METADATA_PATH = "model_artifacts/metadata.json"

def train_categorizer(df : pd.DataFrame) -> bool:
    df['category'] = df['category'].fillna("Uncategorized").astype(str).str.strip()
    train_df = df[~df['category'].str.lower().isin(["uncategorized", "", "none", "nan"])].copy()

    if len(train_df) < 10 or train_df['category'].nunique() < 2:
        return False

    train_df['description'] = train_df['description'].fillna("").astype(str)

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(train_df['category'])

    preprocessor = ColumnTransformer(transformers=[
        ('text', TfidfVectorizer(max_features=500), 'description'), 
        ('num', StandardScaler(), ['amount'])
    ])

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor), 
        ('classifier', XGBClassifier(n_estimators=100, random_state=42))
    ])

    X = train_df[['description', 'amount']]
    pipeline.fit(X, y)

    # Compute metrics on training set
    y_pred = pipeline.predict(X)
    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y, y_pred, average='weighted', zero_division=0)

    os.makedirs("model_artifacts", exist_ok=True)
    
    joblib.dump(pipeline, MODEL_PATH) 
    joblib.dump(label_encoder, ENCODER_PATH)

    # Save metadata
    metadata = {
        "model_version": "1.0.0",
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "training_rows": len(train_df),
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall)
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f)

    return True

def predict_categories(df: pd.DataFrame) -> list:
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
        return ["Uncategorized"] * len(df)

    pipeline = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)

    df['description'] = df['description'].fillna("").astype(str)
    
    X = df[['description', 'amount']]
    predictions = pipeline.predict(X)
    category_labels = label_encoder.inverse_transform(predictions)
    
    return category_labels.tolist()

def predict_categories_with_confidence(df: pd.DataFrame):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
        return [{"category": "Uncategorized", "confidence": 0.0} for _ in range(len(df))]

    pipeline = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)

    df['description'] = df['description'].fillna("").astype(str)
    
    X = df[['description', 'amount']]
    probabilities = pipeline.predict_proba(X)
    
    results = []
    for proba in probabilities:
        max_prob = max(proba)
        class_idx = proba.tolist().index(max_prob)
        category_label = label_encoder.inverse_transform([class_idx])[0]
        results.append({
            "category": category_label,
            "confidence": float(max_prob)
        })
        
    return results