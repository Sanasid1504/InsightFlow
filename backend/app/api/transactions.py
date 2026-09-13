import pandas as pd
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from pymongo import MongoClient
import uuid

from app.schemas import TransactionInput, FraudPrediction
from app.ml.predict import predict_fraud, predict_fraud_batch

router = APIRouter()

client = MongoClient("mongodb://localhost:27017/")
db = client["insightflow_db"]
investigations_collection = db["investigations"]
custom_alerts_collection = db["custom_alerts"]

class InvestigationUpdate(BaseModel):
    txId: str
    type: str = None
    amount: str = None
    oldbalanceOrg: str = None
    newbalanceDest: str = None
    probability: str = None
    riskLevel: str = None
    status: str
    notes: str = None
    priority: str = None

@router.post("/predict")
def predict(transaction: TransactionInput):
    result = predict_fraud(transaction.model_dump())
    
    tx_id = f"TXN-CUST-{uuid.uuid4().hex[:6].upper()}"
    
    custom_alerts_collection.update_one(
        {"txId": tx_id},
        {
            "$set": {
                "txId": tx_id,
                "type": transaction.type,
                "amount": transaction.amount,
                "oldbalanceOrg": transaction.oldbalanceOrg,
                "newbalanceDest": transaction.newbalanceDest,
                "fraud_probability": result["fraud_probability"],
                "risk_level": result["risk_level"],
                "status": "NEW"
            }
        },
        upsert=True
    )
    
    investigations_collection.update_one(
        {"txId": tx_id},
        {"$setOnInsert": {"txId": tx_id, "status": "NEW", "notes": "", "priority": "High" if result["risk_level"] == "HIGH" else "Medium"}},
        upsert=True
    )

    response_data = dict(result)
    response_data["txId"] = tx_id
    return response_data

@router.post("/investigations/update")
def update_investigation(payload: InvestigationUpdate):
    update_data = {
        "txId": payload.txId,
        "type": payload.type,
        "amount": payload.amount,
        "probability": payload.probability,
        "riskLevel": payload.riskLevel,
        "status": payload.status,
        "notes": payload.notes,
        "priority": payload.priority
    }
    cleaned_update_data = {k: v for k, v in update_data.items() if v is not None}

    investigations_collection.update_one(
        {"txId": payload.txId},
        {"$set": cleaned_update_data},
        upsert=True
    )

    custom_alerts_collection.update_one({"txId": payload.txId}, {"$set": cleaned_update_data}, upsert=True)
    return {"success": True, "message": "Investigation updated in MongoDB"}

@router.get("/alerts")
def get_alerts(limit: int = 100):
    csv_path = Path(__file__).resolve().parents[2] / "Transactions Data.csv"
    transactions = []
    
    # 1. Fetch custom alerts from MongoDB
    custom_docs = list(custom_alerts_collection.find({}, {"_id": 0}))
    for doc in custom_docs:
        tx_id = doc.get("txId")
        if not tx_id:
            continue
            
        saved_inv = investigations_collection.find_one({"txId": tx_id}) or {}
        
        try:
            raw_amount = float(doc.get('amount', 0))
        except (ValueError, TypeError):
            raw_amount = 0.0

        try:
            old_org = float(doc.get('oldbalanceOrg', 0))
        except (ValueError, TypeError):
            old_org = 0.0

        try:
            new_dest = float(doc.get('newbalanceDest', raw_amount))
        except (ValueError, TypeError):
            new_dest = raw_amount

        transactions.append({
            "id": tx_id,
            "type": str(doc.get("type", "TRANSFER")),
            "amount": f"₹{raw_amount:,.2f}",
            "rawAmount": raw_amount,
            "riskScore": f"{float(doc.get('fraud_probability', 0)) * 100:.2f}",
            "riskLevel": str(doc.get("risk_level", "LOW")).upper(),
            "status": saved_inv.get("status", doc.get("status", "NEW")),
            "notes": saved_inv.get("notes", ""),
            "priority": saved_inv.get("priority", "High"),
            "oldOrgBal": f"₹{old_org:,.2f}",
            "newOrgBal": f"₹{max(0.0, old_org - raw_amount):,.2f}",
            "oldDestBal": "₹0.00",
            "newDestBal": f"₹{new_dest:,.2f}",
            "step": "1"
        })

    # 2. Fill remaining from dataset CSV
    if csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
            remaining_limit = max(0, limit - len(transactions))
            if remaining_limit > 0 and not df.empty:
                df_sample = df.sample(n=min(remaining_limit, len(df)), random_state=42).reset_index(drop=True)
                df_pred = df_sample.drop(columns=["isFlaggedFraud", "isFraud"], errors="ignore")
                scored = predict_fraud_batch(df_pred).reset_index(drop=True)

                for i, row in scored.iterrows():
                    tx_id = f"TXN-{8000 + i}"
                    saved_record = investigations_collection.find_one({"txId": tx_id}) or {}
                    row_amount = float(row['amount'])

                    transactions.append({
                        "id": tx_id,
                        "type": str(row["type"]),
                        "amount": f"₹{row_amount:,.2f}",
                        "rawAmount": row_amount,
                        "riskScore": f"{float(row['fraud_probability']) * 100:.2f}",
                        "riskLevel": str(row["risk_level"]).upper(),
                        "status": saved_record.get("status", "NEW"),
                        "notes": saved_record.get("notes", ""),
                        "priority": saved_record.get("priority", "Medium"),
                        "oldOrgBal": f"₹{float(row['oldbalanceOrg']):,.2f}",
                        "newOrgBal": f"₹{float(row['newbalanceOrg']):,.2f}",
                        "oldDestBal": f"₹{float(row['oldbalanceDest']):,.2f}",
                        "newDestBal": f"₹{float(row['newbalanceDest']):,.2f}",
                        "step": str(row.get("step", "15"))
                    })
        except Exception:
            pass

    low = sum(1 for t in transactions if t["riskLevel"] == "LOW")
    medium = sum(1 for t in transactions if t["riskLevel"] == "MEDIUM")
    high = sum(1 for t in transactions if t["riskLevel"] == "HIGH")

    return {
        "kpis": {
            "total_alerts": len(transactions),
            "high_risk_alerts": high,
            "transactions_monitored": len(transactions),
            "escalated_cases": high
        },
        "transactions": transactions,
        "risk_distribution": {"low": low, "medium": medium, "high": high}
    }