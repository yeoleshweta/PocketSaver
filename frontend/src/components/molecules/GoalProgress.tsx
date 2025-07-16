// frontend/src/components/molecules/GoalProgress.tsx
import React from 'react';

interface GoalProgressProps {
  current: number;
  target: number;
  label?: string;
}

export default function GoalProgress({
  current,
  target,
  label = 'Progress',
}: GoalProgressProps) {
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-1">{label}</h3>
      <div className="flex justify-between text-sm text-gray-700 mb-1">
        <span>{Math.floor(percent)}%</span>
        <span>
          ${current.toFixed(2)} / ${target.toFixed(2)}
        </span>
      </div>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: '#FFD700' }}
        />
      </div>
    </div>
  );
}