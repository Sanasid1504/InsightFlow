# InsightFlow

**Enterprise Fraud Detection & Investigation Platform**

InsightFlow is a machine-learning-powered fraud detection and investigation platform designed to help investigators identify, analyze, and manage suspicious financial transactions.

It combines a **Random Forest fraud detection model**, FastAPI backend, MongoDB persistence, and a React-based investigation dashboard.

## Core Workflow

```
Transaction
     ↓
ML Prediction
     ↓
Risk Assessment
     ↓
Alert Generation
     ↓
Investigation
     ↓
Resolution
```

## Key Features

- **Real-Time Fraud Prediction** — Detects potentially fraudulent transactions using a trained Random Forest model (an ensemble of decision trees).
- **Risk Assessment** — Classifies transactions into Low, Medium, and High risk levels.
- **Investigator Dashboard** — Provides KPIs, risk distribution, transaction statistics, and fraud activity insights.
- **Alerts & Investigation Queue** — Manage suspicious transactions with status, priority, and investigator notes.
- **Transaction Explorer** — Filter and inspect transactions, amounts, account balances, and transaction types.
- **Analytics Suite** — Visualizes fraud trends, transaction types, risk distribution, and amount patterns.
- **Transaction Analysis** — Allows investigators to submit transaction details and receive an ML-based risk assessment.
- **Feature Importance Insights** — Surfaces which transaction attributes (amount, balance changes, transaction type, etc.) most influence the model's fraud predictions, aiding investigator trust and explainability.

## System Architecture

```
React + TypeScript
        │
        ▼
     FastAPI
        │
   ┌────┴─────┐
   ▼          ▼
ML Model   MongoDB
   │          │
   ▼          ▼
Fraud       Alerts
Risk        Investigations
Score       Notes
```

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI

### Machine Learning
- Scikit-learn
- **Random Forest Classifier**
- Joblib
- PaySim dataset

### Database
- MongoDB

## Project Structure

```
InsightFlow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ml/
│   │   ├── main.py
│   │   └── schemas.py
│   ├── models/
│   ├── fraud_model_rf.pkl
│   ├── retrain_model.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

## Machine Learning

InsightFlow uses the **PaySim financial transaction dataset** and a trained **Random Forest Classifier** to identify suspicious transaction patterns.

A Random Forest is an ensemble of many Decision Trees, each trained on a random bootstrap sample of the data and a random subset of features at every split. Their individual predictions are combined by majority vote, which makes the final fraud prediction significantly more stable and less prone to overfitting than a single Decision Tree.

**Key transaction attributes include:**
- `step`
- `type`
- `amount`
- `oldbalanceOrg`
- `newbalanceOrig`
- `oldbalanceDest`
- `newbalanceDest`

The system also performs feature engineering on balance information before generating the prediction.

**Model configuration highlights:**
- `n_estimators` — number of trees in the forest, tuned for a balance between accuracy and inference speed.
- `max_depth` / `min_samples_split` / `min_samples_leaf` — control individual tree complexity to avoid overfitting.
- `max_features` — restricts each split to a random subset of features, decorrelating the trees.
- `class_weight='balanced'` — accounts for the natural class imbalance in fraud data (fraudulent transactions are rare).
- `oob_score=True` — provides a built-in, no-extra-cost validation estimate using each tree's out-of-bag rows.

**Why Random Forest over a single Decision Tree:**
- Reduces variance and overfitting by averaging many trees instead of relying on one.
- More robust to noisy or imbalanced transaction data.
- Provides reliable feature importance scores, useful for investigator-facing explainability.
- Generally improves generalization to unseen transaction patterns without extensive manual tuning.

## Purpose

InsightFlow demonstrates an end-to-end fraud detection workflow that connects machine learning, backend APIs, database persistence, and an investigator-focused frontend into a single platform.

### Resources
- Readme

### Languages
- TypeScript
- Python
