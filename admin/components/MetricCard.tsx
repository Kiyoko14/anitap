import { Card, CardContent } from '@/components/ui/Card'
import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  color?: 'violet' | 'emerald' | 'blue' | 'orange' | 'pink'
}

const colorClasses = {
  violet: 'bg-violet-600/20 text-violet-400',
  emerald: 'bg-emerald-600/20 text-emerald-400',
  blue: 'bg-blue-600/20 text-blue-400',
  orange: 'bg-orange-600/20 text-orange-400',
  pink: 'bg-pink-600/20 text-pink-400',
}

export function MetricCard({ title, value, icon: Icon, trend, color = 'violet' }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <p className={clsx('mt-1 text-xs', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {trend >= 0 ? '+' : ''}{trend}% from yesterday
              </p>
            )}
          </div>
          <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
