'use client'

import { useState, useEffect } from 'react'
import dummyTransactions, { Transaction } from '@/data/dummyTransactions'

export default function TransactionsDropdown() {
  const [txns, setTxns] = useState<Transaction[]>([])

  useEffect(() => {
    setTxns(dummyTransactions)
  }, [])

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Last 100 Transactions</h2>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full table-auto text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Round-Up</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr
                key={t.id}
                className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <td className="px-4 py-2">
                  {new Date(t.created_at).toLocaleDateString()}{' '}
                  {new Date(t.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-2">${t.amount.toFixed(2)}</td>
                <td className="px-4 py-2">${t.rounded_diff.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}