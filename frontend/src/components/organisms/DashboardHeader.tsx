// frontend/src/components/organisms/DashboardHeader.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="flex justify-between items-center bg-teal-600 text-white p-4">
      <h1 className="text-2xl font-bold">PocketSaver</h1>
      <div className="flex items-center space-x-4">
        <span>{user?.email}</span>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
}