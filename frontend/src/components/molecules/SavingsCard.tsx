// frontend/src/components/molecules/SavingsCard.tsx
import React from 'react';

interface Props {
  current: number;
  goal: number;
  weeksToGoal: number;
}

export default function SavingsCard({ current, goal, weeksToGoal }: Props) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;

  return (
    <section className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold">Your Savings</h2>

      {/* Progress Bar */}
      <div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full bg-teal-600"
            style={{ width: `${(progress * 100).toFixed(1)}%` }}
          />
        </div>
        <p className="mt-2 text-sm">
          Saved <strong>${current.toFixed(2)}</strong> of ${goal.toFixed(2)} (
          {(progress * 100).toFixed(1)}%)
        </p>
      </div>

      {/* Weeks to Goal */}
      <p className="text-sm text-gray-600">
        {weeksToGoal} week{weeksToGoal !== 1 ? 's' : ''} to reach your goal
      </p>

      {/* Withdraw / Invest Buttons */}
      <div className="flex gap-4">
        <button
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => {
            /* wire up later */
          }}
        >
          Withdraw
        </button>
        <button
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          onClick={() => {
            /* wire up later */
          }}
        >
          Invest
        </button>
      </div>
    </section>
  );
}