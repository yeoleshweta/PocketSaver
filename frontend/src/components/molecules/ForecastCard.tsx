"use client";

import { useState } from "react";

export default function ForecastCard() {
  const [balance, setBalance] = useState("5000");
  const [horizon, setHorizon] = useState("30");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forecast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_balance: parseFloat(balance),
            horizon: parseInt(horizon),
          }),
        }
      );

      if (!res.ok) throw new Error("Prediction failed");

      const data = await res.json();
      setPrediction(data.predicted_amount);
    } catch {
      setError("Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (days: string) => {
    if (days === "7") return "Next Week";
    if (days === "30") return "Next Month";
    return "Next Quarter";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          🔮 Future Balance AI
        </h3>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Personalized
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Checking Balance ($)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Forecast Horizon
          </label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7">7 Days (Next Week)</option>
            <option value="30">30 Days (Next Month)</option>
            <option value="90">90 Days (Next Quarter)</option>
          </select>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all disabled:opacity-50 shadow-sm"
        >
          {loading
            ? "Analyzing Spending Patterns..."
            : "Predict Future Balance"}
        </button>

        {prediction !== null && (
          <div className="mt-4 p-4 bg-gradient-to-b from-indigo-50 to-white rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm text-indigo-600 mb-1 font-medium">
              Projected Balance in {getDayLabel(horizon)}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              ${prediction.toFixed(2)}
            </p>

            <div className="mt-2 flex items-center gap-2">
              {prediction > parseFloat(balance) ? (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                  On Track (Savings Growing) 📈
                </span>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                  High Spending Detected ⚠️
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
