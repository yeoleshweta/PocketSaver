import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

# 1. Load your historical data
df = pd.read_excel("../yahoo_data.xlsx", parse_dates=["Date"])

# 1a. Rename Excel columns so code below can just use "Close"
df.rename(columns={
    "Close*": "Close",
    "Adj Close**": "Adj_Close"
}, inplace=True)

df.sort_values("Date", inplace=True)

# 2. Feature engineering (example)
df["days"] = (df.Date - df.Date.min()).dt.days
df["log_return"] = df["Close"].pct_change().apply(lambda x: np.log1p(x))
df.dropna(inplace=True)

# 3. Build 30-day ahead target
HORIZON = 30
df[f"Close_t+{HORIZON}"] = df["Close"].shift(-HORIZON)
df.dropna(inplace=True)

# 4. Prepare X/y
X = df[["days", "Close"]]
y = df[f"Close_t+{HORIZON}"]

# 5. Split + scale
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler().fit(X_train)
X_train_s = scaler.transform(X_train)

# 6. Train
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train_s, y_train)

# 7. Save artifacts
os.makedirs("saved_models", exist_ok=True)
joblib.dump(model, "saved_models/stock_forecast.pkl")
joblib.dump(scaler, "saved_models/scaler.pkl")

print("✅ Trained model and scaler saved.")