'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardMetrics, getUsersGrowth, getEnergyHistory } from '@/lib/api'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
    refetchInterval: 30000,
  })
}

export function useUsersGrowth() {
  return useQuery({
    queryKey: ['users-growth'],
    queryFn: getUsersGrowth,
  })
}

export function useEnergyHistory() {
  return useQuery({
    queryKey: ['energy-history'],
    queryFn: getEnergyHistory,
  })
}
