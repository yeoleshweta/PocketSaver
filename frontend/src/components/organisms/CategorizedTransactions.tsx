"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, Category, SpendingSummary } from "@/types/transaction";

interface Props {
  onTotalSavingsUpdate?: (total: number) => void;
}

export default function CategorizedTransactions({
  onTotalSavingsUpdate,
}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTx, setNewTx] = useState({
    amount: "",
    merchant: "",
    description: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [API_URL]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const categoryParam =
        selectedCategory !== "All"
          ? `&category=${encodeURIComponent(selectedCategory)}`
          : "";
      const res = await fetch(
        `${API_URL}/api/transactions?limit=50${categoryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);

        // Calculate total round-up savings
        const totalRoundUp = data.reduce(
          (sum: number, tx: Transaction) => sum + Number(tx.rounded_diff),
          0
        );
        onTotalSavingsUpdate?.(totalRoundUp);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL, selectedCategory, onTotalSavingsUpdate]);

  // Fetch spending summary
  const fetchSpendingSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/spending-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpendingSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch spending summary:", err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchSpendingSummary();
  }, [fetchCategories, fetchTransactions, fetchSpendingSummary]);

  // Add new transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTx.amount) return;

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(newTx.amount),
          merchant: newTx.merchant || null,
          description: newTx.description || null,
        }),
      });

      if (res.ok) {
        setNewTx({ amount: "", merchant: "", description: "" });
        setShowAddForm(false);
        fetchTransactions();
        fetchSpendingSummary();
      }
    } catch (err) {
      console.error("Failed to add transaction:", err);
    }
  };

  // Seed sample transactions
  const handleSeedTransactions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTransactions();
        fetchSpendingSummary();
      }
    } catch (err) {
      console.error("Failed to seed transactions:", err);
    }
  };

  // Get category info
  const getCategoryInfo = (categoryName: string) => {
    return (
      categories.find((c) => c.name === categoryName) || {
        icon: "📦",
        color: "#6B7280",
      }
    );
  };

  const totalSpent = spendingSummary.reduce(
    (sum, s) => sum + parseFloat(s.total_spent || "0"),
    0
  );
  const totalRoundUp = spendingSummary.reduce(
    (sum, s) => sum + parseFloat(s.total_round_up || "0"),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            💳 Transactions
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              + Add
            </button>
            {transactions.length === 0 && (
              <button
                onClick={handleSeedTransactions}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                🌱 Seed Demo Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spending Summary */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total Spent
            </p>
            <p className="text-xl font-bold text-gray-900">
              ${totalSpent.toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 uppercase tracking-wide">
              Round-Up Savings
            </p>
            <p className="text-xl font-bold text-green-700">
              ${totalRoundUp.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="flex flex-wrap gap-2">
          {spendingSummary.slice(0, 4).map((summary) => (
            <div
              key={summary.category}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${summary.color}15`,
                color: summary.color,
              }}
            >
              <span>{summary.icon}</span>
              <span>${parseFloat(summary.total_spent).toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTransaction}
          className="p-4 bg-blue-50 border-b"
        >
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Merchant"
              value={newTx.merchant}
              onChange={(e) => setNewTx({ ...newTx, merchant: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTx.description}
              onChange={(e) =>
                setNewTx({ ...newTx, description: e.target.value })
              }
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Transaction
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-600 px-4 py-2 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Category Filter */}
      <div className="p-4 border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === "All"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                selectedCategory === cat.name
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={
                selectedCategory === cat.name
                  ? { backgroundColor: cat.color }
                  : {}
              }
            >
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>No transactions yet. Add one or seed demo data!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Saved</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const catInfo = getCategoryInfo(tx.category);
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${catInfo.color}15`,
                          color: catInfo.color,
                        }}
                      >
                        {catInfo.icon} {tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {tx.merchant || "Unknown"}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {tx.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ${Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      +${Number(tx.rounded_diff).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600 flex justify-between items-center">
        <span>{transactions.length} transactions</span>
        <span className="font-medium text-green-600">
          Auto-categorized with AI 🤖
        </span>
      </div>
    </div>
  );
}
