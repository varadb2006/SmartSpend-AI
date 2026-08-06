import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

def flag_anomalies(df: pd.DataFrame):
    if len(df) < 5: return [False] * len(df), [0.0] * len(df)

    amounts = df[['amount']].copy()
    scaler = StandardScaler()
    scaled_amounts = scaler.fit_transform(amounts)
    dbscan = DBSCAN(eps=0.5, min_samples=3)
    cluster_labels = dbscan.fit_predict(scaled_amounts)
    anomalies = [True if label == -1 else False for label in cluster_labels]
    scores = [float(abs(val[0])) if label == -1 else 0.0 for val, label in zip(scaled_amounts, cluster_labels)]

    return anomalies, scores