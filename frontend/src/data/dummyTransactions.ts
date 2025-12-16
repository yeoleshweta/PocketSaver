// Transaction interface definition
export interface Transaction {
  id: number;
  amount: number;
  rounded_diff: number;
  created_at: string;
}

/**
 * Utility function to calculate the rounded-up difference (savings) for a transaction amount
 * @param amount - The original transaction amount
 * @returns The difference between the rounded-up amount and the original amount
 */
function calculateRoundedDiff(amount: number): number {
  const rounded = Math.ceil(amount);
  return parseFloat((rounded - amount).toFixed(2));
}

/**
 * Utility function to generate a random date within the last specified number of days
 * @param daysBack - Number of days to go back from current date
 * @returns ISO string representation of the random date
 */
function getRandomDateWithinDays(daysBack: number): string {
  const daysAgo = Math.floor(Math.random() * daysBack);
  const randomDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return randomDate.toISOString();
}

/**
 * Generate 100 random transactions within the last 30 days
 * Each transaction includes a random amount and calculated rounded-up difference
 */
const dummyTransactions: Transaction[] = Array.from({ length: 100 }, (_, index) => {
  // Generate random amount between $0.01 and $99.99
  const amount = parseFloat((Math.random() * 99.99 + 0.01).toFixed(2));
  
  // Calculate the rounded-up difference (this is the "savings" from round-up)
  const rounded_diff = calculateRoundedDiff(amount);
  
  // Generate random date within the last 30 days
  const created_at = getRandomDateWithinDays(30);
  
  return {
    id: index + 1,
    amount,
    rounded_diff,
    created_at,
  };
});

/**
 * Utility function to calculate total savings from all transactions
 * @param transactions - Array of transactions to calculate savings from
 * @returns Total rounded-up savings amount
 */
export function calculateTotalSavings(transactions: Transaction[]): number {
  return parseFloat(
    transactions
      .reduce((total, transaction) => total + transaction.rounded_diff, 0)
      .toFixed(2)
  );
}

/**
 * Utility function to get transactions within a specific date range
 * @param transactions - Array of transactions to filter
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Filtered array of transactions
 */
export function getTransactionsByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}

/**
 * Utility function to get transactions sorted by date (newest first)
 * @param transactions - Array of transactions to sort
 * @returns Sorted array of transactions
 */
export function getSortedTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// Export the dummy transactions as default
export default dummyTransactions;

// Named exports for easier importing
export { dummyTransactions as transactions };
