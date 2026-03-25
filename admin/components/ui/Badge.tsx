import { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-700 text-gray-200',
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  warning: 'bg-orange-900/50 text-orange-400 border border-orange-800',
  destructive: 'bg-red-900/50 text-red-400 border border-red-800',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant]),
        className
      )}
      {...props}
    />
  )
}
