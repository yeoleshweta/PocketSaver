// src/components/atoms/GhostToggle.tsx
'use client';

import { useState } from 'react';

export default function GhostToggle() {
  const [isOn, setIsOn] = useState(false);

  const toggle = () => {
    setIsOn((prev) => !prev);
    // TODO: call your PATCH /api/user/ghost endpoint here
  };

  return (
    <button
      onClick={toggle}
      className={`px-3 py-1 rounded ${
        isOn ? 'bg-green-500 text-white' : 'bg-gray-300'
      }`}
    >
      {isOn ? 'On' : 'Off'}
    </button>
  );
}