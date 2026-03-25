'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { GrowthPoint } from '@/lib/api'

interface UsersGrowthChartProps {
  data: GrowthPoint[]
}

export function UsersGrowthChart({ data }: UsersGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Growth (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(v: string) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
              labelFormatter={(v) => new Date(String(v)).toLocaleDateString()}
            />
            <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} dot={false} name="New Users" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
