'use client'

import { useState, useEffect } from 'react'
import dummyTransactions, { Transaction, calculateTotalSavings } from '@/data/dummyTransactions'

interface Props {
  onTotalSavingsUpdate?: (total: number) => void; // Callback to update parent with total
}

export default function TransactionsDropdown({ onTotalSavingsUpdate }: Props) {
  const [txns, setTxns] = useState<Transaction[]>([])
  const [totalSavings, setTotalSavings] = useState(0)

  useEffect(() => {
    setTxns(dummyTransactions)
    const total = calculateTotalSavings(dummyTransactions)
    setTotalSavings(total)
    
    // Notify parent component of the total savings
    if (onTotalSavingsUpdate) {
      onTotalSavingsUpdate(total)
    }
  }, [onTotalSavingsUpdate])

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Last 100 Transactions</h3>
        
        {/* Total Savings Summary - NEW */}
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Round-Up Savings</div>
          <div className="text-lg font-bold text-green-600">
            ${totalSavings.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2">Date</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-right p-2">Round-Up</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2 text-gray-600">
                  {new Date(t.created_at).toLocaleDateString()}{' '}
                  {new Date(t.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-2 text-right font-medium">
                  ${t.amount.toFixed(2)}
                </td>
                <td className="p-2 text-right font-medium text-green-600">
                  ${t.rounded_diff.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer - NEW */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {txns.length} transactions processed
          </span>
          <span className="font-semibold text-green-600">
            Total saved: ${totalSavings.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
