/**
 * Expense Categorization Service
 * 
 * Phase 1: Rule-based categorization using keyword matching
 * Phase 2: TODO - Upgrade to ML classifier (Random Forest)
 */

// Category definitions with associated keywords
const CATEGORY_RULES = {
  'Food & Dining': {
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger',
      'pizza', 'sushi', 'doordash', 'uber eats', 'grubhub', 'chipotle',
      'subway', 'wendy', 'taco', 'bakery', 'diner', 'bistro', 'grill',
      'kitchen', 'food', 'eat', 'lunch', 'dinner', 'breakfast', 'snack',
      'domino', 'kfc', 'popeye', 'panera', 'chick-fil-a', 'dunkin'
    ],
    priority: 1
  },
  'Transportation': {
    keywords: [
      'uber', 'lyft', 'taxi', 'gas', 'shell', 'chevron', 'exxon', 'bp',
      'parking', 'toll', 'metro', 'subway', 'bus', 'train', 'amtrak',
      'airline', 'flight', 'delta', 'united', 'american air', 'southwest',
      'car wash', 'auto', 'vehicle', 'fuel', 'petrol', 'transit'
    ],
    priority: 2
  },
  'Shopping': {
    keywords: [
      'amazon', 'walmart', 'target', 'costco', 'best buy', 'ebay',
      'etsy', 'mall', 'store', 'shop', 'retail', 'clothing', 'shoes',
      'fashion', 'nike', 'adidas', 'zara', 'h&m', 'nordstrom', 'macy',
      'home depot', 'lowes', 'ikea', 'wayfair', 'purchase'
    ],
    priority: 3
  },
  'Entertainment': {
    keywords: [
      'netflix', 'spotify', 'hulu', 'disney', 'hbo', 'movie', 'cinema',
      'theater', 'concert', 'ticket', 'game', 'steam', 'playstation',
      'xbox', 'nintendo', 'twitch', 'youtube', 'apple music', 'audible',
      'bowling', 'arcade', 'club', 'bar', 'pub', 'lounge', 'karaoke'
    ],
    priority: 4
  },
  'Utilities': {
    keywords: [
      'electric', 'power', 'water', 'gas bill', 'internet', 'wifi',
      'comcast', 'at&t', 'verizon', 't-mobile', 'sprint', 'phone bill',
      'utility', 'sewage', 'trash', 'waste', 'cable'
    ],
    priority: 5
  },
  'Healthcare': {
    keywords: [
      'pharmacy', 'cvs', 'walgreens', 'rite aid', 'doctor', 'hospital',
      'clinic', 'medical', 'dental', 'dentist', 'optometrist', 'vision',
      'prescription', 'medicine', 'health', 'therapy', 'urgent care',
      'insurance', 'copay'
    ],
    priority: 6
  },
  'Housing': {
    keywords: [
      'rent', 'mortgage', 'lease', 'apartment', 'landlord', 'property',
      'hoa', 'maintenance', 'repair', 'plumber', 'electrician', 'realtor'
    ],
    priority: 7
  },
  'Subscriptions': {
    keywords: [
      'subscription', 'membership', 'monthly', 'annual', 'recurring',
      'gym', 'fitness', 'planet fitness', 'equinox', 'peloton',
      'adobe', 'microsoft', 'dropbox', 'icloud', 'google one'
    ],
    priority: 8
  },
  'Income': {
    keywords: [
      'payroll', 'salary', 'deposit', 'direct deposit', 'paycheck',
      'refund', 'reimbursement', 'cashback', 'dividend', 'interest',
      'transfer in', 'venmo received', 'zelle received'
    ],
    priority: 0  // Highest priority for income detection
  }
};

/**
 * Categorize a transaction based on merchant name and description
 * @param {string} merchant - The merchant/vendor name
 * @param {string} description - Transaction description (optional)
 * @param {number} amount - Transaction amount (positive = expense, negative = income)
 * @returns {string} Category name
 */
function categorizeTransaction(merchant = '', description = '', amount = 0) {
  // If amount is negative (credit/income), categorize as Income
  if (amount < 0) {
    return 'Income';
  }

  const searchText = `${merchant} ${description}`.toLowerCase();
  
  let bestMatch = null;
  let bestPriority = Infinity;
  
  for (const [category, { keywords, priority }] of Object.entries(CATEGORY_RULES)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        if (priority < bestPriority) {
          bestMatch = category;
          bestPriority = priority;
        }
        break; // Found a match for this category, move to next
      }
    }
  }
  
  return bestMatch || 'Other';
}

/**
 * Get all available categories
 * @returns {Array} List of category objects
 */
function getCategories() {
  return [
    { name: 'Food & Dining', icon: '🍔', color: '#EF4444' },
    { name: 'Transportation', icon: '🚗', color: '#F59E0B' },
    { name: 'Shopping', icon: '🛍️', color: '#8B5CF6' },
    { name: 'Entertainment', icon: '🎬', color: '#EC4899' },
    { name: 'Utilities', icon: '💡', color: '#3B82F6' },
    { name: 'Healthcare', icon: '🏥', color: '#10B981' },
    { name: 'Housing', icon: '🏠', color: '#6366F1' },
    { name: 'Income', icon: '💰', color: '#22C55E' },
    { name: 'Subscriptions', icon: '📱', color: '#F97316' },
    { name: 'Other', icon: '📦', color: '#6B7280' }
  ];
}

/**
 * Batch categorize multiple transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Transactions with category field added
 */
function categorizeTransactions(transactions) {
  return transactions.map(tx => ({
    ...tx,
    category: categorizeTransaction(tx.merchant, tx.description, tx.amount)
  }));
}

export { categorizeTransaction, getCategories, categorizeTransactions, CATEGORY_RULES };
