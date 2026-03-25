'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings, Trophy, Shield, LogOut, Zap, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { useAuthContext } from '@/providers/AuthProvider'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/economy', label: 'Economy', icon: Settings },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/abuse', label: 'Abuse Monitor', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuthContext()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white">AniTap Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-800 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-md bg-gray-900 p-2 text-gray-400 lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-900 transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gray-900 border-r border-gray-800">
        <NavContent />
      </aside>
    </>
  )
}
