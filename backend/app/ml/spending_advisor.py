import pandas as pd
from typing import Dict, List, Any

def generate_insights(df: pd.DataFrame) -> Dict[str, Any]:
    # Filter only expenses
    expenses = df[df['transaction_type'].str.upper().isin(['EXPENSE', 'DEBIT'])]
    
    if expenses.empty:
        return {
            "top_category": "N/A", "second_highest": "N/A", "third_highest": "N/A",
            "max_growth_category": "N/A", "min_growth_category": "N/A",
            "most_frequent": "N/A", "highest_single": 0, "monthly_waste": 0,
            "total_savings_potential": 0
        }

    # Group by category
    cat_spend = expenses.groupby('category')['amount'].sum().sort_values(ascending=False)
    
    top_cat = cat_spend.index[0] if len(cat_spend) > 0 else "N/A"
    second_cat = cat_spend.index[1] if len(cat_spend) > 1 else "N/A"
    third_cat = cat_spend.index[2] if len(cat_spend) > 2 else "N/A"

    # Most frequent expense
    most_frequent = expenses['description'].value_counts().index[0] if len(expenses) > 0 else "N/A"
    
    # Highest single expense
    highest_single = expenses['amount'].max() if len(expenses) > 0 else 0

    # Growth (dummy logic since we need month-over-month)
    # We group by month and category
    expenses['month'] = pd.to_datetime(expenses['transaction_date'], errors='coerce').dt.month
    monthly_cat = expenses.groupby(['month', 'category'])['amount'].sum().unstack(fill_value=0)
    
    max_growth_cat = "N/A"
    min_growth_cat = "N/A"
    if len(monthly_cat) > 1:
        # Compare last two months
        last_two = monthly_cat.iloc[-2:]
        growth = last_two.iloc[1] - last_two.iloc[0]
        max_growth_cat = growth.idxmax() if len(growth) > 0 else "N/A"
        min_growth_cat = growth.idxmin() if len(growth) > 0 else "N/A"

    # Savings / waste estimates (heuristic: 10% of top 3 discretionary categories)
    # Let's say top category has 15% waste
    monthly_waste = float(cat_spend.get(top_cat, 0)) * 0.15 if top_cat != "N/A" else 0
    total_savings_potential = float(cat_spend.sum()) * 0.10 # 10% of total spend

    return {
        "top_category": top_cat,
        "second_highest": second_cat,
        "third_highest": third_cat,
        "max_growth_category": max_growth_cat,
        "min_growth_category": min_growth_cat,
        "most_frequent": most_frequent,
        "highest_single": highest_single,
        "monthly_waste": monthly_waste,
        "total_savings_potential": total_savings_potential
    }

def generate_recommendations(df: pd.DataFrame, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
    recs = []
    
    top_cat = insights.get("top_category")
    if top_cat and top_cat != "N/A":
        cat_amount = df[(df['transaction_type'].str.upper().isin(['EXPENSE', 'DEBIT'])) & (df['category'] == top_cat)]['amount'].sum()
        total_amount = df[df['transaction_type'].str.upper().isin(['EXPENSE', 'DEBIT'])]['amount'].sum()
        perc = (cat_amount / total_amount * 100) if total_amount > 0 else 0
        savings = cat_amount * 0.20
        recs.append({
            "title": f"Reduce {top_cat} Expenses",
            "description": f"You spend {perc:.0f}% of your income on {top_cat}. Reducing it by 20% can save you significantly.",
            "potential_savings": float(savings)
        })

    if insights.get("max_growth_category") and insights.get("max_growth_category") != "N/A":
        recs.append({
            "title": f"Monitor {insights['max_growth_category']}",
            "description": f"{insights['max_growth_category']} expenses have increased compared to previous months. Consider setting a strict budget.",
            "potential_savings": float(insights.get("monthly_waste", 0) * 0.5)
        })

    # Subscriptions heuristic (recurring)
    merchant_counts = df['description'].value_counts()
    recurring_merchants = merchant_counts[merchant_counts > 1].index.tolist()
    if recurring_merchants:
        recs.append({
            "title": "Review Subscriptions",
            "description": f"You have recurring payments (e.g., {recurring_merchants[0]}). Cancelling unused ones can increase savings.",
            "potential_savings": 500.0 # Example flat amount
        })

    if not recs:
        recs.append({
            "title": "Start Budgeting",
            "description": "Track your daily expenses to identify areas where you can save.",
            "potential_savings": 0
        })

    return recs
