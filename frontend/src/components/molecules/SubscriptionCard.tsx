// frontend/src/components/molecules/SubscriptionsList.tsx
import React from 'react';

export interface Subscription {
  name: string;
  cost: number;
  lastUsed: string;
  suggestCancel: boolean;
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
}

export default function SubscriptionsList({
  subscriptions,
}: SubscriptionsListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Subscriptions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscriptions.map((sub) => (
          <div
            key={sub.name}
            className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-medium">{sub.name}</h3>
              <p className="text-sm text-gray-500">${sub.cost.toFixed(2)}/mo</p>
              <p className="text-xs text-gray-400">Last used: {sub.lastUsed}</p>
            </div>
            {sub.suggestCancel && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                Cancel?
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}