'use client'

import Link from 'next/link'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminUser } from '@/lib/api'
import { Eye } from 'lucide-react'

interface UserTableProps {
  users: AdminUser[]
  onBan: (userId: number) => void
  onResetEnergy: (userId: number) => void
  isBanning: boolean
  isResetting: boolean
}

export function UserTable({ users, onBan, onResetEnergy, isBanning, isResetting }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Telegram ID</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Energy</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Referrals</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-mono text-xs text-gray-400">{user.telegram_id}</TableCell>
            <TableCell className="font-medium text-white">{user.username || '—'}</TableCell>
            <TableCell>{user.energy.toLocaleString()}</TableCell>
            <TableCell>{user.level}</TableCell>
            <TableCell>{user.referrals}</TableCell>
            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant={user.is_banned ? 'destructive' : 'success'}>
                {user.is_banned ? 'Banned' : 'Active'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant={user.is_banned ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={() => onBan(user.id)}
                  isLoading={isBanning}
                >
                  {user.is_banned ? 'Unban' : 'Ban'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResetEnergy(user.id)}
                  isLoading={isResetting}
                >
                  Reset
                </Button>
                <Link href={`/users/${user.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
