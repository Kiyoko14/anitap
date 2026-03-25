'use client'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AbuseFlag } from '@/lib/api'

interface AbuseTableProps {
  flags: AbuseFlag[]
  onBan: (userId: number) => void
  isBanning: boolean
}

const flagTypeLabels: Record<AbuseFlag['flag_type'], string> = {
  high_tap_rate: 'High Tap Rate',
  fake_referral: 'Fake Referral',
}

const flagTypeVariants: Record<AbuseFlag['flag_type'], 'destructive' | 'warning'> = {
  high_tap_rate: 'destructive',
  fake_referral: 'warning',
}

const severityVariants: Record<AbuseFlag['severity'], 'destructive' | 'warning' | 'default'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'default',
}

export function AbuseTable({ flags, onBan, isBanning }: AbuseTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Flag Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Detected At</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flags.map((flag, index) => (
          <TableRow key={`${flag.user_id}-${index}`}>
            <TableCell className="font-medium text-white">{flag.username}</TableCell>
            <TableCell>
              <Badge variant={flagTypeVariants[flag.flag_type]}>
                {flagTypeLabels[flag.flag_type]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={severityVariants[flag.severity]}>
                {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>{new Date(flag.detected_at).toLocaleString()}</TableCell>
            <TableCell className="max-w-xs truncate text-gray-400">{flag.details}</TableCell>
            <TableCell>
              <Button variant="destructive" size="sm" onClick={() => onBan(flag.user_id)} isLoading={isBanning}>
                Ban User
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
