'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardHeader from '@/components/organisms/DashboardHeader'
import SavingsCard from '@/components/molecules/SavingsCard'
import SubscriptionCard, {
  Subscription,
} from '@/components/molecules/SubscriptionCard'
import Toggle from '@/components/atoms/Toggle'
import TransactionsDropdown from '@/components/organisms/TransactionsDropdown'

interface Savings {
  current: number
  goal: number
  weekly_contribution: number
  ghost_mode: boolean
}

interface ApiSubscription {
  name: string
  cost: number
  last_used: string
  suggest_cancel: boolean
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.replace('/')
  }, [isLoading, user, router])

  const [savings, setSavings] = useState<Savings>({
    current: 0,
    goal: 0,
    weekly_contribution: 0,
    ghost_mode: false,
  })
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [ghostMode, setGhostMode] = useState(false)
  const [roundUpSavings, setRoundUpSavings] = useState(0)

  const fetchDashboard = useCallback(async () => {
    if (!token) return
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (!res.ok) return
    const data = await res.json()
    setSavings(data.savings)
    setGhostMode(data.savings.ghost_mode)
    
    const subs: Subscription[] = (data.subscriptions as ApiSubscription[]).map((s) => ({
      name: s.name,
      cost: s.cost,
      lastUsed: s.last_used,
      suggestCancel: s.suggest_cancel,
    }))
    setSubscriptions(subs)
  }, [token])

  useEffect(() => {
    if (user && token) fetchDashboard()
  }, [user, token, fetchDashboard])

  const handleGhostToggle = async (enabled: boolean) => {
    if (!token) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/ghost`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled }),
    })
    setGhostMode(enabled)
  }

  const handleTotalSavingsUpdate = useCallback((total: number) => {
    setRoundUpSavings(total)
  }, [])

  const weeksToGoal = savings.weekly_contribution
    ? Math.ceil((savings.goal - savings.current) / savings.weekly_contribution)
    : 0

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FIXED: Properly pass user prop with correct typing */}
      <DashboardHeader roundUpSavings={roundUpSavings} user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <SavingsCard
              current={savings.current}
              goal={savings.goal}
              weeksToGoal={weeksToGoal}
              roundUpSavings={roundUpSavings}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stealth Saving
            </h3>
            <Toggle
              enabled={ghostMode}
              onChange={handleGhostToggle}
              label="Ghost Mode"
            />
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spending Insights
            </h3>
            <div className="space-y-3">
              {subscriptions.map((subscription, idx) => (
                <SubscriptionCard 
                  key={idx} 
                  subscription={subscription}
                />
              ))}
              <p className="text-gray-600 text-sm mt-4">
                You could save <strong>$25/mo</strong> by cancelling unused
                services.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <TransactionsDropdown onTotalSavingsUpdate={handleTotalSavingsUpdate} />
          </div>
          
        </div>
      </div>
    </div>
  )
}
