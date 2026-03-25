'use client'

import { Users, Zap, MousePointerClick, UserPlus, Activity } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { UsersGrowthChart } from '@/components/UsersGrowthChart'
import { EnergyChart } from '@/components/EnergyChart'
import { useDashboardMetrics, useUsersGrowth, useEnergyHistory } from '@/hooks/useDashboard'
import { Card, CardContent } from '@/components/ui/Card'

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
            <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-800" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-80 animate-pulse rounded-lg bg-gray-800" />
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: growth, isLoading: growthLoading } = useUsersGrowth()
  const { data: energy, isLoading: energyLoading } = useEnergyHistory()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-gray-400">Game metrics and analytics overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Total Users" value={metrics?.total_users ?? 0} icon={Users} color="violet" />
            <MetricCard title="Active (24h)" value={metrics?.active_users_24h ?? 0} icon={Activity} color="emerald" />
            <MetricCard title="Total Energy" value={metrics?.total_energy ?? 0} icon={Zap} color="orange" />
            <MetricCard title="Total Taps" value={metrics?.total_taps ?? 0} icon={MousePointerClick} color="blue" />
            <MetricCard title="Referrals" value={metrics?.referral_count ?? 0} icon={UserPlus} color="pink" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {growthLoading ? <ChartSkeleton /> : <UsersGrowthChart data={growth ?? []} />}
        {energyLoading ? <ChartSkeleton /> : <EnergyChart data={energy ?? []} />}
      </div>
    </div>
  )
}
