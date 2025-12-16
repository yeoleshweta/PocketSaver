'use client'

import React from 'react'

// Define the expected user interface
interface User {
  id?: string | number;
  email?: string;
  name?: string;
  username?: string;
}

interface Props {
  roundUpSavings: number;
  user: User | null; // Allow null for when user is not logged in
}

export default function DashboardHeader({ roundUpSavings, user }: Props) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            PocketSaver Dashboard
          </h1>
          {user?.email && (
            <p className="text-sm text-gray-500">
              Welcome back, {user.name || user.email}
            </p>
          )}
        </div>
        
        {/* Round-Up Savings Highlight */}
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Round-Up Savings</div>
          <div className="text-3xl font-bold text-green-600">
            ${roundUpSavings.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            Saved from spare change
          </div>
        </div>
      </div>
    </div>
  )
}
