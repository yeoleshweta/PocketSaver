import React from 'react';

interface ToggleProps {
  enabled: boolean;           // The current toggle state
  onChange: (enabled: boolean) => void;  // Function to handle state changes
  label?: string;            // Optional label text
  disabled?: boolean;        // Optional disabled state
}

export default function Toggle({ 
  enabled, 
  onChange, 
  label = '', 
  disabled = false 
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  return (
    <div className="flex items-center">
      {label && (
        <label className="mr-3 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        type="button"
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={handleClick}
        disabled={disabled}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
