import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
import datetime

# 1. Generate Synthetic Personal Finance Data
# Simulating 2 years of daily balances
def generate_financial_data(days=730):
    date_rng = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')
    
    data = []
    balance = 5000 # Starting balance
    
    for date in date_rng:
        day = date.day
        
        # Monthly Rent (1st)
        if day == 1:
            balance -= 1500
            
        # Bi-weekly Salary (15th and 30th)
        if day == 15 or day == 30:
            balance += 2500
            
        # Weekly Groceries (Random day, say Saturdays)
        if date.dayofweek == 5: # Saturday
            balance -= np.random.randint(100, 200)
            
        # Daily random spending (Coffee, lunch, etc.)
        daily_spend = np.random.randint(20, 80)
        balance -= daily_spend
        
        # Add basic trend (savings growth)
        # balance += 5 
        
        data.append({
            'date': date,
            'day_of_month': day,
            'day_of_week': date.dayofweek,
            'balance': balance
        })
        
    return pd.DataFrame(data)

print("📊 Generating synthetic financial history...")
df = generate_financial_data()
print(f"   Created {len(df)} days of transaction history.")

# 2. Prepare Training Data for Forecast
# We want to predict balance X days in the future
# Feature: [Current Balance, Day of Month, Day of Week, Horizon]
# Target: [Predicted Balance]

X_list = []
y_list = []

horizons = [7, 30, 90] # We will train the model to understand these horizons

for i in range(len(df) - 90): # Leave buffer for max horizon
    current_row = df.iloc[i]
    
    for h in horizons:
        future_row = df.iloc[i + h]
        
        features = [
            current_row['day_of_month'],
            current_row['day_of_week'],
            current_row['balance'],
            h # Horizon is a feature now!
        ]
        
        target = future_row['balance']
        
        X_list.append(features)
        y_list.append(target)

X = np.array(X_list)
y = np.array(y_list)

# 3. Split + Scale
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler().fit(X_train)
X_train_s = scaler.transform(X_train)
X_test_s = scaler.transform(X_test)

# 4. Train Model
print("🧠 Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train_s, y_train)

score = model.score(X_test_s, y_test)
print(f"✅ Model Trained! R^2 Score: {score:.4f}")

# 5. Save Artifacts
os.makedirs("saved_models", exist_ok=True)
joblib.dump(model, "saved_models/stock_forecast.pkl") # Keeping filename same for ease, but logic is changed
joblib.dump(scaler, "saved_models/scaler.pkl")

print("💾 Saved model artifacts to 'saved_models/'")