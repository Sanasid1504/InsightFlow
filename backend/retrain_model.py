import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import joblib

# Load data
df = pd.read_csv("Transactions Data.csv")

# Clean nulls
df_model = df.drop(columns=['nameOrig', 'nameDest', 'isFlaggedFraud'])
df_model = df_model.dropna()

# Feature engineering
df_model['errorBalanceOrig'] = df_model['newbalanceOrig'] + df_model['amount'] - df_model['oldbalanceOrg']
df_model['errorBalanceDest'] = df_model['oldbalanceDest'] + df_model['amount'] - df_model['newbalanceDest']

X = df_model.drop(columns=['isFraud'])
y = df_model['isFraud']

categorical_cols = ['type']
numeric_cols = [c for c in X.columns if c not in categorical_cols]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

preprocessor = ColumnTransformer(transformers=[
    ('num', StandardScaler(), numeric_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
])

rf = Pipeline(steps=[
    ('prep', preprocessor),
    ('clf', RandomForestClassifier(n_estimators=100, max_depth=10,n_jobs=-1, class_weight='balanced', random_state=42))
])

rf.fit(X_train, y_train)

# Save it — using THIS environment's library versions
joblib.dump(rf, 'app/models/fraud_model_rf.pkl')
print("Model retrained and saved successfully.")