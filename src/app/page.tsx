'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { SavingsGoalCard } from '@/components/savings-goal-card';
import { GhostSavingCard } from '@/components/ghost-saving-card';
import { SubscriptionManager } from '@/components/subscription-manager';
import { SpendingInsights } from '@/components/spending-insights';

export default function Home() {
  const [dashboardData, setDashboardData] = useState({
    savingsGoal: 2000,
    currentSavings: 750,
    weeklyContribution: 20,
    isGhostSavingActive: true,
    ghostSavings: 55.23,
  });

  const handleGhostSavingToggle = (isActive: boolean) => {
    setDashboardData(prev => ({ ...prev, isGhostSavingActive: isActive }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />
      <main className="p-4 md:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2">
            <SavingsGoalCard 
              goal={dashboardData.savingsGoal}
              current={dashboardData.currentSavings}
              weeklyContribution={dashboardData.weeklyContribution}
            />
          </div>

          <div className="lg:col-span-1">
            <GhostSavingCard 
              isActive={dashboardData.isGhostSavingActive}
              onToggle={handleGhostSavingToggle}
              amount={dashboardData.ghostSavings}
            />
          </div>

          <div className="lg:col-span-2">
            <SubscriptionManager />
          </div>

          <div className="lg:col-span-1">
            <SpendingInsights />
          </div>

        </div>
      </main>
    </div>
  );
}
