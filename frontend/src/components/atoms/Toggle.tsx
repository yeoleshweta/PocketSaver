'use client';

import React from 'react';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (newState: boolean) => void;
}

export default function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center cursor-pointer select-none">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-300 rounded-full peer-focus:ring-2 peer-focus:ring-blue-400 peer-checked:bg-blue-600 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition peer-checked:translate-x-5" />
      </div>
      {label && <span className="ml-3 text-gray-700">{label}</span>}
    </label>
  );
}