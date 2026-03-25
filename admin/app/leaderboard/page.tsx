'use client'

import { useQuery } from '@tanstack/react-query'
import { getAdminLeaderboard } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  return (
    <span className={clsx('font-bold', rank <= 3 ? 'text-xl' : 'text-gray-300')}>
      {medal ?? `#${rank}`}
    </span>
  )
}

export default function LeaderboardPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getAdminLeaderboard,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="mt-1 text-gray-400">Top players by energy generated</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} isLoading={isFetching}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Energy</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((entry) => (
                  <TableRow key={entry.user_id}>
                    <TableCell><RankBadge rank={entry.rank} /></TableCell>
                    <TableCell className="font-medium text-white">{entry.username}</TableCell>
                    <TableCell className="font-mono">{entry.energy.toLocaleString()}</TableCell>
                    <TableCell>{entry.level}</TableCell>
                  </TableRow>
                ))}
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
