'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useSubscription() {
  const subscription = useQuery(api.subscriptions.getMySubscription)

  const plan = subscription?.plan || 'free'
  const isActive = !subscription || subscription.status === 'active'

  return {
    subscription,
    plan,
    isActive,
    isPro: plan === 'pro' || plan === 'enterprise',
    isEnterprise: plan === 'enterprise',
    isFree: plan === 'free',
    isLoading: subscription === undefined,
  }
}

export function useCanAddClient() {
  return useQuery(api.subscriptions.canAddClient)
}

export function useCanRunBot() {
  return useQuery(api.subscriptions.canRunBot)
}
