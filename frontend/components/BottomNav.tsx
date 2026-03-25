'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/game', label: 'Game', icon: '🎮' },
  { href: '/upgrades', label: 'Upgrades', icon: '⬆️' },
  { href: '/referral', label: 'Referral', icon: '👥' },
  { href: '/leaderboard', label: 'Top', icon: '🏆' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800">
      <div className="max-w-sm mx-auto flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-all duration-200 ${
                isActive
                  ? 'text-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-purple-400 mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
