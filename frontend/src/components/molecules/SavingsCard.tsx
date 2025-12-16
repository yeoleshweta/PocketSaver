// frontend/src/components/molecules/SavingsCard.tsx
import React from 'react';

interface Props {
  current: number;
  goal: number;
  weeksToGoal: number;
  roundUpSavings?: number; // New prop for round-up savings display
}

export default function SavingsCard({ 
  current, 
  goal, 
  weeksToGoal, 
  roundUpSavings = 0 
}: Props) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Savings
      </h3>

      {/* Round-Up Savings Display - NEW SECTION */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-700">
            Round-Up Savings
          </span>
          <span className="text-lg font-bold text-green-800">
            ${roundUpSavings.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Total saved from transaction round-ups
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {(progress * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Saved <strong>${current.toFixed(2)}</strong> of ${goal.toFixed(2)} (
          {(progress * 100).toFixed(1)}%)
        </p>
      </div>

      {/* Weeks to Goal */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          {weeksToGoal} week{weeksToGoal !== 1 ? 's' : ''} to reach your goal
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
          Withdraw
        </button>
        <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
          Invest
        </button>
      </div>
    </div>
  );
}
