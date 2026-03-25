'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { LeaderboardSkeleton } from '@/components/Skeleton'
import { getLeaderboard } from '@/lib/api'
import toast from 'react-hot-toast'

export default function LeaderboardPage() {
  const { user, leaderboard, setLeaderboard, token } = useGameStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    getLeaderboard()
      .then(setLeaderboard)
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [token, setLeaderboard])

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Leaderboard
      </h1>
      <p className="text-gray-400 text-sm mb-6">Top 100 AniTap players</p>

      {loading ? (
        <LeaderboardSkeleton />
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <div className="text-4xl mb-4">🏆</div>
          <p>No rankings yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isCurrentUser = user?.telegram_id === entry.telegram_id
            const medal = getMedalEmoji(entry.rank)

            return (
              <div
                key={entry.telegram_id}
                className={`
                  rounded-xl p-3 flex items-center gap-3 border transition-all
                  ${
                    isCurrentUser
                      ? 'bg-purple-900/30 border-purple-700/50'
                      : 'bg-gray-900 border-gray-800'
                  }
                `}
              >
                {/* Rank */}
                <div className="w-9 flex items-center justify-center flex-shrink-0">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-gray-400 font-mono text-sm">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {entry.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-medium truncate ${
                        isCurrentUser ? 'text-purple-300' : 'text-white'
                      }`}
                    >
                      {entry.username || 'Anonymous'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-purple-400 flex-shrink-0">
                        (you)
                      </span>
                    )}
                  </div>
                </div>

                {/* Energy */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-yellow-400 text-sm">⚡</span>
                  <span className="text-white font-bold text-sm">
                    {entry.energy.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
