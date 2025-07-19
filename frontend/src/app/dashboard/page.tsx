'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardHeader from '@/components/organisms/DashboardHeader'
import SavingsCard from '@/components/molecules/SavingsCard'
import SubscriptionCard, {
  Subscription as SubscriptionType,
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
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([])
  const [ghostMode, setGhostMode] = useState(false)

  // fetch dashboard, unchanged from your code
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
    const subs = (data.subscriptions as ApiSubscription[]).map((s) => ({
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

  const weeksToGoal = savings.weekly_contribution
    ? Math.ceil((savings.goal - savings.current) / savings.weekly_contribution)
    : 0

  return (
    <div className="min-h-screen bg-teal-50">
      <DashboardHeader />
      <main className="p-6 space-y-8 max-w-4xl mx-auto">
        <SavingsCard
          current={Number(savings.current)}
          goal={Number(savings.goal)}
          weeksToGoal={weeksToGoal}
        />

        <section className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium">Stealth Saving</h2>
          <Toggle
            label="Ghost Mode"
            checked={ghostMode}
            onChange={handleGhostToggle}
          />
        </section>

        <section className="space-y-4">
          <SubscriptionCard subscriptions={subscriptions} />
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Spending Insights</h2>
          <p className="text-gray-600">
            You could save <strong>$25/mo</strong> by cancelling unused
            services.
          </p>
        </section>

        {/* ← Here’s your dummy‐data dropdown */}
        <TransactionsDropdown />
      </main>
    </div>
  )
}