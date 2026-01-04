# forecast_service/forecast_service.py

from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="PocketSaver Forecast")

# Load artifacts
model = joblib.load("saved_models/stock_forecast.pkl")
scaler = joblib.load("saved_models/scaler.pkl")

class PredictRequest(BaseModel):
    days_since_start: int
    current_price: float
    horizon: int

@app.post("/predict")
def predict(req: PredictRequest):
    x = np.array([[req.days_since_start, req.current_price]])
    x_s = scaler.transform(x)
    pred_price = model.predict(x_s)[0]
    return {"predicted_price": float(pred_price)}