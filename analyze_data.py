import pandas as pd

datasets = [
    "data/updated_personal_transactions.csv",
    "data/synthetic_personal_finance_dataset.csv"
]

for ds in datasets:
    try:
        df = pd.read_csv(ds)
        print(f"Dataset: {ds}")
        print(f"Records: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        if 'Category' in df.columns:
            print(f"Categories: {df['Category'].nunique()}")
        elif 'category' in df.columns:
            print(f"Categories: {df['category'].nunique()}")
        print("-" * 40)
    except Exception as e:
        print(f"Error reading {ds}: {e}")
