// frontend/src/app/dashboard/page.tsx
'use client';

import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardHeader from '../../components/organisms/DashboardHeader';
import SavingsOverview from '../../components/molecules/SavingsCard';
import GoalProgress from '../../components/molecules/GoalProgress';
import GhostToggle from '../../components/atoms/GhostToggle';
import SubscriptionsList, {
  Subscription,
} from '../../components/molecules/SubscriptionCard';

export default function DashboardPage() {
  // TODO: replace these stubs with SWR + fetch to /api/dashboard
  const current = 340.75;
  const goal = 2000;
  const weekly = 10;
  const weeksToGoal = Math.ceil((goal - current) / weekly);
  const subscriptions: Subscription[] = [
    { name: 'Netflix', cost: 15.99, lastUsed: '2025-06-10', suggestCancel: false },
    { name: 'Adobe CC', cost: 52.99, lastUsed: '2025-01-20', suggestCancel: true },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-teal-50">
        <DashboardHeader />

        <main className="p-6 space-y-8 max-w-4xl mx-auto">
          <SavingsOverview current={current} goal={goal} weeksToGoal={weeksToGoal} />

          <GoalProgress current={current} target={goal} label="Total Progress" />

          <section className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium">Stealth Saving</h2>
            <GhostToggle />
          </section>

          <SubscriptionsList subscriptions={subscriptions} />

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Spending Insights</h2>
            <p className="text-gray-600">
              You could save <strong>$25/mo</strong> by cancelling unused services.
            </p>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}