import sqlite3

db_path = r"c:\Users\Abhishek\OneDrive\Desktop\SmartSpend-AI\backend\smartspend.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns = [
    ("prediction_correct", "BOOLEAN DEFAULT NULL"),
    ("prediction_time", "VARCHAR"),
]

for col_name, col_type in columns:
    try:
        cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col_name} {col_type};")
        print(f"Added {col_name}")
    except sqlite3.OperationalError as e:
        print(f"Skipped {col_name}: {e}")

conn.commit()
conn.close()
print("Migration 2 completed.")
