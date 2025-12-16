const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const register = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// NEW: Fetch transactions with round-up data
export const fetchTransactions = async (token: string) => {
  const response = await fetch(`${API_BASE}/api/transactions`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// NEW: Add transaction with round-up calculation
export const addTransaction = async (token: string, amount: number) => {
  const response = await fetch(`${API_BASE}/api/transactions`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });
  return response.json();
};

// NEW: Calculate total round-up savings
export const calculateTotalRoundUpSavings = (transactions: Array<{rounded_diff: number}>) => {
  return transactions.reduce((total, transaction) => total + transaction.rounded_diff, 0);
};
