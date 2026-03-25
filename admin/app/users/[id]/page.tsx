'use client'

import { useParams, useRouter } from 'next/navigation'
import { useUserDetail } from '@/hooks/useUsers'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { ArrowLeft } from 'lucide-react'

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-xl bg-gray-800" />
      <div className="h-40 animate-pulse rounded-xl bg-gray-800" />
      <div className="h-40 animate-pulse rounded-xl bg-gray-800" />
    </div>
  )
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = Number(params.id)

  const { data: user, isLoading, error } = useUserDetail(userId)

  if (isLoading) return <DetailSkeleton />
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-red-400">Failed to load user details</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username || `User #${user.id}`}</h1>
          <p className="text-gray-400">User Details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: 'ID', value: user.id },
              { label: 'Telegram ID', value: user.telegram_id },
              { label: 'Username', value: user.username || '—' },
              { label: 'Energy', value: user.energy.toLocaleString() },
              { label: 'Level', value: user.level },
              { label: 'Referrals', value: user.referrals },
              { label: 'Joined', value: new Date(user.created_at).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-white">{value}</p>
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Status</p>
              <Badge variant={user.is_banned ? 'destructive' : 'success'}>
                {user.is_banned ? 'Banned' : 'Active'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upgrades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {user.upgrades.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No upgrades purchased</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Upgrade Name</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.upgrades.map((upgrade) => (
                  <TableRow key={upgrade.name}>
                    <TableCell className="font-medium text-white">{upgrade.name}</TableCell>
                    <TableCell>{upgrade.level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {user.activity_logs.length === 0 ? (
            <p className="text-center text-gray-400">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {user.activity_logs.map((log, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-violet-500" />
                  <div>
                    <p className="text-sm text-white">{log.action}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
