"use client";

import { useState } from "react";

export default function ForecastCard() {
  const [price, setPrice] = useState("4500");
  const [horizon, setHorizon] = useState("7");
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
            days_since_start: 100, // Dummy value for the model
            current_price: parseFloat(price),
            horizon: parseInt(horizon),
          }),
        }
      );

      if (!res.ok) throw new Error("Prediction failed");

      const data = await res.json();
      setPrediction(data.predicted_price);
    } catch (err) {
      setError("Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          📈 AI Stock Predictor
        </h3>
        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Beta
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current SPX Price ($)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Forecast Horizon (Days)
          </label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing Market..." : "Generate Prediction"}
        </button>

        {prediction !== null && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm text-green-600 mb-1">Predicted Price</p>
            <p className="text-2xl font-bold text-green-700">
              ${prediction.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Estimated change:{" "}
              {(
                ((prediction - parseFloat(price)) / parseFloat(price)) *
                100
              ).toFixed(2)}
              %
            </p>
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
