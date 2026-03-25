'use client'

import { useQuery } from '@tanstack/react-query'
import { getAbuseFlags } from '@/lib/api'
import { AbuseTable } from '@/components/AbuseTable'
import { Card, CardContent } from '@/components/ui/Card'
import { useBanUser } from '@/hooks/useUsers'
import { Shield } from 'lucide-react'

export default function AbusePage() {
  const { data: flags, isLoading, error } = useQuery({
    queryKey: ['abuse-flags'],
    queryFn: getAbuseFlags,
    refetchInterval: 60000,
  })

  const { mutate: ban, isPending: isBanning } = useBanUser()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Abuse Monitor</h1>
          <p className="text-gray-400">
            {flags ? `${flags.length} active flag${flags.length !== 1 ? 's' : ''}` : 'Monitoring...'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">Failed to load abuse flags</div>
          ) : flags?.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No abuse flags detected</div>
          ) : (
            <AbuseTable flags={flags ?? []} onBan={ban} isBanning={isBanning} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
