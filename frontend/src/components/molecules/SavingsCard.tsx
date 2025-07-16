// frontend/src/components/molecules/SavingsOverview.tsx
import React from 'react';

interface SavingsOverviewProps {
  current: number;
  goal: number;
  weeksToGoal: number;
}

export default function SavingsOverview({
  current,
  goal,
  weeksToGoal,
}: SavingsOverviewProps) {
  const percent = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">Your Savings</h2>
      <div className="flex justify-between mb-2">
        <span>${current.toFixed(2)}</span>
        <span>${goal.toFixed(2)}</span>
      </div>
      <div className="bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: '#008080' }}
        />
      </div>
      <p className="text-sm text-gray-600">~{weeksToGoal} weeks to goal</p>
    </div>
  );
}