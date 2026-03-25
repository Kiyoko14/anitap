'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EnergyPoint } from '@/lib/api'

interface EnergyChartProps {
  data: EnergyPoint[]
}

export function EnergyChart({ data }: EnergyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Generation Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area type="monotone" dataKey="energy" stroke="#7C3AED" fill="url(#energyGradient)" strokeWidth={2} name="Energy" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
