"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/organisms/DashboardHeader";
import SavingsCard from "@/components/molecules/SavingsCard";
import SubscriptionCard, {
  Subscription,
} from "@/components/molecules/SubscriptionCard";
import Toggle from "@/components/atoms/Toggle";
import CategorizedTransactions from "@/components/organisms/CategorizedTransactions";
import SpendingInsights from "@/components/molecules/SpendingInsights";
import ForecastCard from "@/components/molecules/ForecastCard";

interface Savings {
  current: number;
  goal: number;
  weekly_contribution: number;
  ghost_mode: boolean;
}

interface ApiSubscription {
  name: string;
  cost: number;
  last_used: string;
  suggest_cancel: boolean;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.replace("/");
  }, [isLoading, user, router]);

  const [savings, setSavings] = useState<Savings>({
    current: 0,
    goal: 0,
    weekly_contribution: 0,
    ghost_mode: false,
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [ghostMode, setGhostMode] = useState(false);
  const [roundUpSavings, setRoundUpSavings] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">(
    "overview"
  );

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) return;
    const data = await res.json();
    setSavings(data.savings);
    setGhostMode(data.savings.ghost_mode);

    const subs: Subscription[] = (data.subscriptions as ApiSubscription[]).map(
      (s) => ({
        name: s.name,
        cost: s.cost,
        lastUsed: s.last_used,
        suggestCancel: s.suggest_cancel,
      })
    );
    setSubscriptions(subs);
  }, [token]);

  useEffect(() => {
    if (user && token) fetchDashboard();
  }, [user, token, fetchDashboard]);

  const handleGhostToggle = async (enabled: boolean) => {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/ghost`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled }),
    });
    setGhostMode(enabled);
  };

  const handleTotalSavingsUpdate = useCallback((total: number) => {
    setRoundUpSavings(total);
  }, []);

  const weeksToGoal = savings.weekly_contribution
    ? Math.ceil((savings.goal - savings.current) / savings.weekly_contribution)
    : 0;

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <DashboardHeader roundUpSavings={roundUpSavings} user={user} />

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-2 bg-white rounded-xl shadow-sm p-1.5 w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "transactions"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            💳 Transactions
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" ? (
          /* Overview Tab */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Savings Card - Full width on mobile, 2 cols on desktop */}
            <div className="lg:col-span-2">
              <SavingsCard
                current={savings.current}
                goal={savings.goal}
                weeksToGoal={weeksToGoal}
                roundUpSavings={roundUpSavings}
              />
            </div>

            {/* Ghost Mode Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                👻 Stealth Saving
              </h3>
              <Toggle
                enabled={ghostMode}
                onChange={handleGhostToggle}
                label="Ghost Mode"
              />
              <p className="text-xs text-gray-500 mt-3">
                Hide investment notifications from prying eyes
              </p>
            </div>

            {/* Spending Insights - New Component */}
            <div className="lg:col-span-2">
              <SpendingInsights />
            </div>

            {/* Subscriptions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📱 Subscriptions
              </h3>
              <div className="space-y-3">
                {subscriptions.map((subscription, idx) => (
                  <SubscriptionCard key={idx} subscription={subscription} />
                ))}
                {subscriptions.length > 0 && (
                  <p className="text-gray-600 text-sm mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    💡 You could save{" "}
                    <strong className="text-amber-700">$25/mo</strong> by
                    cancelling unused services.
                  </p>
                )}
              </div>
            </div>

            {/* AI Forecast */}
            <div className="lg:col-span-3">
              <ForecastCard />
            </div>
          </div>
        ) : (
          /* Transactions Tab */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CategorizedTransactions
                onTotalSavingsUpdate={handleTotalSavingsUpdate}
              />
            </div>
            <div className="space-y-6">
              <SpendingInsights />
              <ForecastCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
