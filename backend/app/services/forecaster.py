import pandas as pd
import numpy as np
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler

def forecast_next_month(df: pd.DataFrame) -> float:
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    monthly_totals = df.groupby(df['transaction_date'].dt.to_period('M'))['amount'].sum().reset_index()
    if len(monthly_totals) < 3:
        return 0.0

    monthly_totals['time_index'] = np.arange(len(monthly_totals))
    
    X = monthly_totals[['time_index']]
    y = monthly_totals['amount']
    
    X_scaler = StandardScaler()
    y_scaler = StandardScaler()

    X_scaled = X_scaler.fit_transform(X)
    y_scaled = y_scaler.fit_transform(y.values.reshape(-1, 1)).ravel()

    svr_model = SVR(kernel='rbf', C=100, gamma=0.1, epsilon=0.1)
    svr_model.fit(X_scaled, y_scaled)
    
    next_month_index = np.array([[len(monthly_totals)]])
    next_month_scaled = X_scaler.transform(next_month_index)    
    predicted_scaled = svr_model.predict(next_month_scaled)
    predicted_amount = y_scaler.inverse_transform(predicted_scaled.reshape(-1, 1))[0][0]
    
    return max(round(float(predicted_amount), 2), 0.0)