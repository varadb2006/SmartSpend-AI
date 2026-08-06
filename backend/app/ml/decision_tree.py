import pandas as pd
import numpy as np
import os
from sklearn.tree import DecisionTreeClassifier, export_graphviz
from sklearn.preprocessing import LabelEncoder
import matplotlib
matplotlib.use('Agg') # For headless environments
import matplotlib.pyplot as plt
from sklearn import tree

def preprocess_data(df: pd.DataFrame):
    if df.empty:
        return None, None, None, None

    # Convert date
    df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
    df['month'] = df['transaction_date'].dt.month.fillna(0).astype(int)
    df['day_of_week'] = df['transaction_date'].dt.dayofweek.fillna(0).astype(int)

    # Encode categorical features
    le_cat = LabelEncoder()
    df['category_encoded'] = le_cat.fit_transform(df['category'].fillna('Unknown'))
    
    le_desc = LabelEncoder()
    df['merchant_encoded'] = le_desc.fit_transform(df['description'].fillna('Unknown'))

    df['type_encoded'] = df['transaction_type'].apply(lambda x: 1 if str(x).upper() == 'EXPENSE' or str(x).upper() == 'DEBIT' else 0)

    # Recurring feature: if merchant appears more than once in the data
    merchant_counts = df['description'].value_counts()
    df['is_recurring'] = df['description'].apply(lambda x: 1 if merchant_counts.get(x, 0) > 1 else 0)

    # Define Target: Spending Level based on percentiles of EXPENSES
    expenses = df[df['type_encoded'] == 1]['amount']
    if len(expenses) < 5:
        # Not enough data for meaningful percentiles
        p25, p75 = 500, 2000
    else:
        p25 = expenses.quantile(0.25)
        p75 = expenses.quantile(0.75)
        
    def get_spending_level(amt, is_expense):
        if not is_expense:
            return 'Safe Spending'
        if amt < p25:
            return 'Safe Spending'
        elif amt > p75:
            return 'Overspending'
        else:
            return 'Moderate Spending'

    df['spending_level'] = df.apply(lambda row: get_spending_level(row['amount'], row['type_encoded']), axis=1)
    
    # Let's map target to int for training, but keep string for visualization
    le_target = LabelEncoder()
    # Explicitly fit so order is known or just let it fit
    # We will just pass the string labels to the classifier, it handles strings.

    features = ['amount', 'category_encoded', 'merchant_encoded', 'month', 'day_of_week', 'is_recurring', 'type_encoded']
    
    X = df[features]
    y = df['spending_level']
    
    return X, y, features, df

def train_and_generate_tree(df: pd.DataFrame, user_id: int):
    X, y, feature_names, processed_df = preprocess_data(df)
    
    if X is None or len(X) < 5:
        return None

    # Train Decision Tree
    clf = DecisionTreeClassifier(criterion='gini', max_depth=4, random_state=42)
    clf.fit(X, y)

    # Generate Image
    os.makedirs("model_artifacts", exist_ok=True)
    img_path = f"model_artifacts/decision_tree_{user_id}.png"
    dot_path = f"model_artifacts/decision_tree_{user_id}.dot"
    
    # Plot PNG
    plt.figure(figsize=(16, 10))
    tree.plot_tree(clf, feature_names=feature_names, class_names=clf.classes_, filled=True, rounded=True, fontsize=10, impurity=False, proportion=False)
    plt.savefig(img_path, format='png', bbox_inches='tight')
    plt.close()

    # Export DOT
    export_graphviz(clf, out_file=dot_path, feature_names=feature_names, class_names=clf.classes_, filled=True, rounded=True)

    # Calculate Gini and Importances
    importances = clf.feature_importances_
    # Let's pick the max feature importance as a proxy for "gini score" representing tree purity impact
    best_feature_idx = np.argmax(importances)
    gini_score = importances[best_feature_idx]
    best_feature_name = feature_names[best_feature_idx]

    return {
        "tree_depth": clf.get_depth(),
        "gini_score": gini_score,
        "best_feature": best_feature_name,
        "importances": dict(zip(feature_names, importances)),
        "img_path": img_path,
        "dot_path": dot_path,
        "processed_df": processed_df
    }
