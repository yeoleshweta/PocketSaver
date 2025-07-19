export interface Transaction {
    id: number
    amount: number
    rounded_diff: number
    created_at: string
  }
  
  // generate 100 random transactions within the last 30 days
  const dummyTransactions: Transaction[] = Array.from({ length: 100 }, (_, i) => {
    const amount = parseFloat((Math.random() * 100).toFixed(2))
    const rounded = Math.ceil(amount)
    const diff = parseFloat((rounded - amount).toFixed(2))
    // random date within last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
    return {
      id: i + 1,
      amount,
      rounded_diff: diff,
      created_at: createdAt,
    }
  })
  
  export default dummyTransactions