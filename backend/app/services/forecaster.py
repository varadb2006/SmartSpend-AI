import pandas as pd
import numpy as np
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler

def forecast_next_month(df: pd.DataFrame) -> float:
    print(f"✓ Forecaster received {len(df)} transactions")
    
    # Enforce format to prevent silent coercions to NaT
    df['transaction_date'] = pd.to_datetime(df['transaction_date'], format="%Y-%m-%d", errors='coerce') 
    df = df.dropna(subset=['transaction_date'])
    
    monthly_totals = df.groupby(df['transaction_date'].dt.to_period('M'))['amount'].sum().reset_index()
    
    print(f"✓ Months detected: {len(monthly_totals)}")
    if len(monthly_totals) < 3:
        print("✓ Skipping prediction: Need at least 3 months of historical data")
        return 0.0

    # FIX: Use a simple average if we have less than 6 months to avoid SVR overfitting
    if len(monthly_totals) < 6:
        print("✓ Using Simple Moving Average for small dataset")
        predicted_amount = monthly_totals['amount'].tail(3).mean()
        return max(round(float(predicted_amount), 2), 0.0)

    print(f"✓ Transactions used for training SVR: {len(df)}")
    monthly_totals['time_index'] = np.arange(len(monthly_totals))
    
    X = monthly_totals[['time_index']]
    y = monthly_totals['amount']
    
    X_scaler = StandardScaler()
    y_scaler = StandardScaler()

    X_scaled = X_scaler.fit_transform(X)
    y_scaled = y_scaler.fit_transform(y.values.reshape(-1, 1)).ravel()

    # Adjusted hyperparameters for better generalization
    svr_model = SVR(kernel='rbf', C=10, gamma=0.1, epsilon=0.1) 
    svr_model.fit(X_scaled, y_scaled)
    
    next_month_index = np.array([[len(monthly_totals)]])
    next_month_scaled = X_scaler.transform(next_month_index)
    predicted_scaled = svr_model.predict(next_month_scaled)
    
    predicted_amount = y_scaler.inverse_transform(predicted_scaled.reshape(-1, 1))[0][0]
    final_amount = max(round(float(predicted_amount), 2), 0.0)
    
    print(f"✓ Prediction result = {final_amount}")
    return final_amount