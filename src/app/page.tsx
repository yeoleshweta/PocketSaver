'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { SavingsGoalCard } from '@/components/savings-goal-card';
import { GhostSavingCard } from '@/components/ghost-saving-card';
import { SubscriptionManager } from '@/components/subscription-manager';
import { SpendingInsights } from '@/components/spending-insights';
import { UntargetedSavingsCard } from '@/components/untargeted-savings-card';

export default function Home() {
  const [dashboardData, setDashboardData] = useState({
    savingsGoal: 2000,
    currentSavings: 750,
    weeklyContribution: 20,
    isGhostSavingActive: true,
    ghostSavings: 55.23,
    untargetedSavings: 1250.75,
  });

  const handleGhostSavingToggle = (isActive: boolean) => {
    setDashboardData(prev => ({ ...prev, isGhostSavingActive: isActive }));
  };

  const handleGoalUpdate = (data: { goal: number; weeklyContribution: number }) => {
    setDashboardData(prev => ({
      ...prev,
      savingsGoal: data.goal,
      weeklyContribution: data.weeklyContribution,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />
      <main className="p-4 md:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-1">
            <UntargetedSavingsCard amount={dashboardData.untargetedSavings} />
          </div>

          <div className="lg:col-span-2">
            <SavingsGoalCard 
              goal={dashboardData.savingsGoal}
              current={dashboardData.currentSavings}
              weeklyContribution={dashboardData.weeklyContribution}
              onGoalUpdate={handleGoalUpdate}
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

          <div className="lg:col-span-3">
            <SpendingInsights />
          </div>

        </div>
      </main>
    </div>
  );
}
