import React from 'react';

// Define the expected subscription interface
export interface Subscription {
  name: string;
  cost: number;
  lastUsed: string;      // camelCase
  suggestCancel: boolean; // camelCase
}

interface Props {
  subscription: Subscription;
}

export default function SubscriptionCard({ subscription }: Props) {
  const { name, cost, lastUsed, suggestCancel } = subscription;
  
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <p className="text-sm text-gray-500">
          Last used: {new Date(lastUsed).toLocaleDateString()}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900">
          ${cost.toFixed(2)}/mo
        </span>
        
        {suggestCancel && (
          <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
