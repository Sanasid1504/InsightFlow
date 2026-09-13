InsightFlow

Enterprise Fraud Detection & Investigation Platform

InsightFlow is a machine-learning-powered fraud detection and investigation platform designed to help investigators identify, analyze, and manage suspicious financial transactions.

It combines a **Decision Tree fraud detection model**, **FastAPI backend**, **MongoDB persistence**, and a **React-based investigation dashboard**.

Core Workflow

```text
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

Key Features

* **Real-Time Fraud Prediction** — Detects potentially fraudulent transactions using a trained Decision Tree model.
* **Risk Assessment** — Classifies transactions into Low, Medium, and High risk levels.
* **Investigator Dashboard** — Provides KPIs, risk distribution, transaction statistics, and fraud activity insights.
* **Alerts & Investigation Queue** — Manage suspicious transactions with status, priority, and investigator notes.
* **Transaction Explorer** — Filter and inspect transactions, amounts, account balances, and transaction types.
* **Analytics Suite** — Visualizes fraud trends, transaction types, risk distribution, and amount patterns.
* **Transaction Analysis** — Allows investigators to submit transaction details and receive an ML-based risk assessment.
* **Audit Support** — Maintains investigation updates and generates investigation-related reports.

System Architecture

```text
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

Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

**Backend**

* Python
* FastAPI
* Uvicorn
* Pandas
* NumPy

**Machine Learning**

* Scikit-learn
* Decision Tree Classifier
* Joblib
* PaySim dataset

**Database**

* MongoDB

## Project Structure

```text
InsightFlow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ml/
│   │   ├── main.py
│   │   └── schemas.py
│   ├── models/
│   ├── fraud_model_dtree.pkl
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

## API

| Method | Endpoint                     | Purpose                               |
| ------ | ---------------------------- | ------------------------------------- |
| POST   | `/api/predict`               | Fraud prediction and risk assessment  |
| GET    | `/api/alerts`                | Retrieve investigation alerts         |
| POST   | `/api/investigations/update` | Update investigation status and notes |

## Machine Learning

InsightFlow uses the **PaySim financial transaction dataset** and a trained Decision Tree Classifier to identify suspicious transaction patterns.

Key transaction attributes include:

```text
step
type
amount
oldbalanceOrg
newbalanceOrig
oldbalanceDest
newbalanceDest
```

The system also performs feature engineering on balance information before generating the prediction.

Purpose

InsightFlow demonstrates an end-to-end fraud detection workflow that connects **machine learning, backend APIs, database persistence, and an investigator-focused frontend** into a single platform.
