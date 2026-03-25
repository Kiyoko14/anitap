'use client'

import { useState } from 'react'
import { useUsers, useBanUser, useResetEnergy } from '@/hooks/useUsers'
import { UserTable } from '@/components/UserTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800" />
      ))}
    </div>
  )
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 20

  const { data, isLoading, error } = useUsers(page, limit)
  const { mutate: ban, isPending: isBanning } = useBanUser()
  const { mutate: resetEnergy, isPending: isResetting } = useResetEnergy()

  const totalPages = data ? Math.ceil(data.total / limit) : 1

  const filteredUsers = data?.users.filter((u) =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.telegram_id.includes(search)
  ) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-1 text-gray-400">
          {data ? `${data.total.toLocaleString()} total users` : 'Loading...'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by username or Telegram ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">Failed to load users</div>
          ) : (
            <UserTable
              users={filteredUsers}
              onBan={ban}
              onResetEnergy={resetEnergy}
              isBanning={isBanning}
              isResetting={isResetting}
            />
          )}
        </CardContent>
      </Card>

      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
