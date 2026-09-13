from pydantic import BaseModel


class TransactionInput(BaseModel):

    step: int

    type: str

    amount: float

    oldbalanceOrg: float

    newbalanceOrig: float

    oldbalanceDest: float

    newbalanceDest: float


class FraudPrediction(BaseModel):

    isFraud: int

    fraud_probability: float

    risk_level: str