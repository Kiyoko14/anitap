'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEconomyConfig, updateEconomyConfig, EconomyConfig } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

function JsonEditor({ label, value, onChange }: { label: string; value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  const [raw, setRaw] = useState(JSON.stringify(value, null, 2))
  const [error, setError] = useState('')

  const handleChange = (text: string) => {
    setRaw(text)
    try {
      const parsed = JSON.parse(text)
      setError('')
      onChange(parsed)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default function EconomyPage() {
  const queryClient = useQueryClient()
  const { data: config, isLoading } = useQuery({
    queryKey: ['economy-config'],
    queryFn: getEconomyConfig,
  })

  const [form, setForm] = useState<EconomyConfig>({
    base_tap: 1,
    referral_percent: 10,
    upgrade_costs: {},
    passive_rates: {},
  })

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  const { mutate: save, isPending } = useMutation({
    mutationFn: updateEconomyConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['economy-config'] })
      toast.success('Economy config updated')
    },
    onError: () => toast.error('Failed to update config'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-800" />
        <div className="h-80 animate-pulse rounded-xl bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Economy Config</h1>
        <p className="mt-1 text-gray-400">Configure game economy parameters</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Game Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="base_tap"
              type="number"
              label="Base Tap Value"
              value={form.base_tap}
              onChange={(e) => setForm({ ...form, base_tap: Number(e.target.value) })}
              min={1}
            />
            <Input
              id="referral_percent"
              type="number"
              label="Referral Percent (%)"
              value={form.referral_percent}
              onChange={(e) => setForm({ ...form, referral_percent: Math.min(100, Math.max(0, Number(e.target.value))) })}
              min={0}
              max={100}
            />
          </div>

          <JsonEditor
            label="Upgrade Costs"
            value={form.upgrade_costs}
            onChange={(v) => setForm({ ...form, upgrade_costs: v })}
          />

          <JsonEditor
            label="Passive Rates"
            value={form.passive_rates}
            onChange={(v) => setForm({ ...form, passive_rates: v })}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={() => save(form)} isLoading={isPending}>
            Save Configuration
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
