"use client";

import { useState, useEffect, useCallback } from "react";
import { SpendingSummary, Budget, Category } from "@/types/transaction";
import BudgetModal from "./BudgetModal";

export default function SpendingInsights() {
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Parallel fetch for speed
      const [summaryRes, budgetsRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/api/spending-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/budgets`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/categories`),
      ]);

      if (summaryRes.ok) setSpendingSummary(await summaryRes.json());
      if (budgetsRes.ok) setBudgets(await budgetsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch (err) {
      console.error("Failed to fetch insights data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetBudget = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsModalOpen(true);
  };

  const getBudgetForCategory = (catName: string): number | null => {
    const b = budgets.find((b) => b.category === catName);
    return b ? parseFloat(b.monthly_limit) : null;
  };

  const totalSpent = spendingSummary.reduce(
    (sum, s) => sum + parseFloat(s.total_spent || "0"),
    0
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Merge categories that have spending OR have a budget
  const allrelevantCategories = new Set([
    ...spendingSummary.map((s) => s.category),
    ...budgets.map((b) => b.category),
  ]);

  // Sort by spending (desc) then alphabetical
  const sortedCategories = Array.from(allrelevantCategories).sort((a, b) => {
    const spentA = parseFloat(
      spendingSummary.find((s) => s.category === a)?.total_spent || "0"
    );
    const spentB = parseFloat(
      spendingSummary.find((s) => s.category === b)?.total_spent || "0"
    );
    return spentB - spentA || a.localeCompare(b);
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            📊 Budget & Spending
          </h3>
          <p className="text-emerald-100 text-sm mt-1">
            Track your monthly limits
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCategory("");
            setIsModalOpen(true);
          }}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Set Budget
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Total Spent */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            Total Spent This Month
          </p>
          <p className="text-3xl font-bold text-gray-900">
            ${totalSpent.toFixed(2)}
          </p>
        </div>

        {/* Category List */}
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No spending or budgets yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((catName) => {
              const summary = spendingSummary.find(
                (s) => s.category === catName
              );
              const budgetLimit = getBudgetForCategory(catName);
              const spent = summary ? parseFloat(summary.total_spent) : 0;
              const saved = summary ? parseFloat(summary.total_round_up) : 0;

              // Find category metadata (icon/color)
              const catMeta = categories.find((c) => c.name === catName) ||
                summary || { icon: "📦", color: "#6B7280" };

              // Calculate progress
              const progress = budgetLimit ? (spent / budgetLimit) * 100 : 0;
              const isOverBudget = budgetLimit ? spent > budgetLimit : false;
              const barColor = isOverBudget ? "#EF4444" : catMeta.color;

              return (
                <div key={catName} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl bg-gray-50 p-1.5 rounded-md">
                        {catMeta.icon}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 leading-tight">
                          {catName}
                        </p>
                        {budgetLimit ? (
                          <p
                            className={`text-xs ${
                              isOverBudget
                                ? "text-red-500 font-semibold"
                                : "text-gray-500"
                            }`}
                          >
                            {isOverBudget ? "⚠️ Over Budget" : "On Track"}
                          </p>
                        ) : (
                          <button
                            onClick={() => handleSetBudget(catName)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                          >
                            Set Budget
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${spent.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {budgetLimit
                          ? `/ $${budgetLimit.toFixed(0)}`
                          : "No Limit"}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar container */}
                  <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
                    {/* Background tick marks or logic could go here */}

                    {/* Actual Progress */}
                    {budgetLimit ? (
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    ) : (
                      // If no budget, simple bar relative to total spent (or just full width faint color)
                      <div
                        className="h-full rounded-full opacity-30"
                        style={{
                          width: "100%",
                          backgroundColor: catMeta.color,
                        }}
                      />
                    )}
                  </div>

                  {/* Footer Stats */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-gray-400">
                      {summary?.transaction_count || 0} transactions
                    </span>
                    {saved > 0 && (
                      <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                        +${saved.toFixed(2)} saved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        currentCategory={selectedCategory}
        onBudgetSet={fetchData}
      />
    </div>
  );
}
