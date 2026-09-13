import joblib
import pandas as pd
from pathlib import Path
from fastapi import HTTPException

MODEL_PATH = (
    Path(__file__)
    .resolve()
    .parents[2]
    / "fraud_model_dtree.pkl"
)

try:
    model = joblib.load(MODEL_PATH)
    print(f"Fraud model loaded successfully: {MODEL_PATH}")
except Exception as e:
    model = None
    print(f"ERROR: Could not load fraud model: {e}")


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Required fields
    required_columns = [
        "step",
        "type",
        "amount",
        "oldbalanceOrg",
        "newbalanceOrig",
        "oldbalanceDest",
        "newbalanceDest",
    ]

    missing = [
        col for col in required_columns if col not in df.columns
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {missing}"
        )

    df = df.dropna()

    if "errorBalanceOrig" not in df.columns:
        df["errorBalanceOrig"] = (
            df["newbalanceOrig"]
            + df["amount"]
            - df["oldbalanceOrg"]
        )

    if "errorBalanceDest" not in df.columns:
        df["errorBalanceDest"] = (
            df["oldbalanceDest"]
            + df["amount"]
            - df["newbalanceDest"]
        )

    model_cols = [
        "step",
        "type",
        "amount",
        "oldbalanceOrg",
        "newbalanceOrig",
        "oldbalanceDest",
        "newbalanceDest",
        "errorBalanceOrig",
        "errorBalanceDest",
    ]

    return df[model_cols]


def get_risk_level(probability: float) -> str:
    # Adjusted thresholds to ensure medium risk can be triggered by fractional tree leaves
    if probability > 0.50:
        return "HIGH"
    elif probability > 0.01:
        return "MEDIUM"
    else:
        return "LOW"


def predict_fraud(transaction: dict) -> dict:
    if model is None:
        raise HTTPException(
            status_code=500,
            detail="Fraud detection model is not loaded on the server."
        )

    try:
        df = pd.DataFrame([transaction])
        df_prepared = prepare_features(df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transaction input: {str(e)}"
        )

    if df_prepared.empty:
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction input."
        )

    try:
        probabilities = model.predict_proba(df_prepared)
        prob = float(probabilities[:, 1][0])
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Model inference failed: {str(e)}"
        )

    prediction = int(prob > 0.5)
    risk_level = get_risk_level(prob)

    return {
        "isFraud": prediction,
        "fraud_probability": round(prob, 4),
        "risk_level": risk_level
    }


def predict_fraud_batch(transactions_df: pd.DataFrame) -> pd.DataFrame:
    if model is None:
        raise HTTPException(
            status_code=500,
            detail="Fraud detection model is not loaded on the server."
        )

    df_cleaned = transactions_df.dropna().copy()

    if df_cleaned.empty:
        return df_cleaned

    df_prepared = prepare_features(df_cleaned)

    if df_prepared.empty:
        return df_cleaned.head(0)

    try:
        probabilities = model.predict_proba(df_prepared)
        probs = probabilities[:, 1]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch model inference failed: {str(e)}"
        )

    result_df = df_cleaned.copy()
    result_df["fraud_probability"] = probs.round(4)
    result_df["isFraud"] = (probs > 0.5).astype(int)
    result_df["risk_level"] = [get_risk_level(p) for p in probs]

    return result_df