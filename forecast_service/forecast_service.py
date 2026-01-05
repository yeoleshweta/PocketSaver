# forecast_service/forecast_service.py

from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import datetime

app = FastAPI(title="PocketSaver Forecast")

# Load artifacts
model = joblib.load("saved_models/stock_forecast.pkl")
scaler = joblib.load("saved_models/scaler.pkl")

class PredictRequest(BaseModel):
    current_balance: float
    horizon: int

@app.post("/predict")
def predict(req: PredictRequest):
    # Infer date features from "today" for the prediction
    # In a real app we might pass the date, but for now we assume "today"
    today = datetime.datetime.now()
    
    features = [[
        today.day,           # day_of_month
        today.weekday(),     # day_of_week
        req.current_balance, # current_balance
        req.horizon          # horizon
    ]]
    
    x_s = scaler.transform(features)
    pred_balance = model.predict(x_s)[0]
    
    return {"predicted_amount": float(pred_balance)}