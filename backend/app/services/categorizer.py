import os 
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from xgboost import XGBClassifier

MODEL_PATH = "model_artifacts/xgb_pipeline.joblib"
ENCODER_PATH = "model_artifacts/label_encoder.joblib"

def train_categorizer(df : pd.DataFrame) -> bool:
    train_df = df[df['category'] != "Uncategorized"].copy()

    if len(train_df) < 10:
        return False

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
    pipeline.fit(X,y)

    os.makedirs("model_artifacts", exist_ok=True)
    

    joblib.dump(pipeline, MODEL_PATH) 
    joblib.dump(label_encoder, ENCODER_PATH)

    return True
def predict_categories(df: pd.DataFrame) -> list:
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
        return ["Uncategorized"] * len(df)

    pipeline = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)

    X = df[['description', 'amount']]
    predictions = pipeline.predict(X)
    category_labels = label_encoder.inverse_transform(predictions)
    
    return category_labels.tolist()
