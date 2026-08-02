# Project Requirements Document (PRD)
## SmartSpend AI: Intelligent Personal Finance Advisor

---

## 1. Executive Summary
SmartSpend AI is an intelligent personal finance management application. It ingests daily financial transactions through manual entry or bulk Excel upload, automatically categorizes expenses, forecasts future expenditures, flags anomalous transactions, groups spending personas, and generates actionable, human-readable budget recommendations using strictly syllabus-approved classical Machine Learning algorithms.

## 2. Technical Stack & Deployment Strategy
*   **Frontend UI:** React.js (Vite), TailwindCSS, Recharts. **Deployment:** Vercel.
*   **Backend API:** Python (FastAPI / Flask) with CORS configured. **Deployment:** Render (Free Tier).
*   **Database:** SQLite3 (Local Development) -> PostgreSQL via Neon.tech (Production) using SQLAlchemy.
*   **Machine Learning:** Scikit-Learn, XGBoost, Pandas, NumPy.
*   **Configuration:** Environment variables via `.env` (`python-dotenv` & `import.meta.env`).

## 3. Functional Requirements (FR) & ML Architecture

*   **FR-1: Dual Data Ingestion Module:** 
    *   Manual logging via interactive UI form.
    *   Batch Excel/CSV upload with strict backend validation (`Date`, `Description`, `Amount`, `Transaction_Type`).
*   **FR-2: Expense Categorization:**
    *   Model: **XGBoost**. Automatically maps merchant descriptions to categories. Evaluated via Confusion Matrix, Precision, Recall, F-measure, and ROC/AUC.
*   **FR-3: Monthly Spending Forecast:**
    *   Model: **Support Vector Regression (SVR)**. Forecasts next month's spending based on historical time-series data. Evaluated via K-Fold Cross Validation to manage the Bias-Variance trade-off.
*   **FR-4: Anomaly Detection:**
    *   Model: **DBSCAN (Density-Based Clustering)**. Dynamically groups normal behavior and isolates low-density transaction points as "Noise" to flag abnormal spending without hardcoded rules.
*   **FR-5: User Persona Segmentation:**
    *   Models: **Principal Component Analysis (PCA) + Expectation-Maximization (EM) Algorithm**. PCA reduces dimensionality of user spending features, and the EM Algorithm groups users into probabilistic behavioral clusters.
*   **FR-6: Recommendation Engine:**
    *   Model: **Decision Tree (using Gini Index)**. Calculates the impurity of budget ratios to extract exact, transparent, human-readable savings rules (e.g., "If Shopping > 35%, trigger alert").

## 4. Non-Functional Requirements (NFR)
*   **Performance:** Single transaction ML inference must complete in <200ms. Batch validation for 1,000 rows must complete in <2 seconds.
*   **Security:** Database URIs and secret keys must never be hardcoded; they must be managed via `.env`.

## 5. Data Sources (Training Data)
To ensure robust generalization, models will be initially trained on Kaggle datasets before processing live user data:
*   **Categorization & Anomalies:** Kaggle "Personal Transactions Data"
*   **Forecasting & Segmentation:** Kaggle "Personal Finance ML Dataset"