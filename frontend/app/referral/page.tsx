'use client'

import { useGameStore } from '@/store/useGameStore'
import toast from 'react-hot-toast'

export default function ReferralPage() {
  const { user } = useGameStore()

  const referralLink = user
    ? `https://t.me/AniTapBot?start=ref_${user.id}`
    : 'https://t.me/AniTapBot'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const shareLink = () => {
    if (typeof window !== 'undefined') {
      const tgWindow = window as unknown as { Telegram?: { WebApp?: { openTelegramLink: (url: string) => void } } }
      if (tgWindow.Telegram?.WebApp?.openTelegramLink) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on AniTap and earn energy! ⚡')}`
        tgWindow.Telegram.WebApp.openTelegramLink(shareUrl)
        return
      }
    }
    copyLink()
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Referral
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        Invite friends and earn bonus energy
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {user?.referral_count ?? 0}
          </div>
          <div className="text-gray-400 text-sm mt-1">Friends Invited</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-yellow-400">⚡</span>
            <span className="text-3xl font-bold text-yellow-400">
              {(user?.referral_earnings ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="text-gray-400 text-sm mt-1">Earned</div>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Your Referral Link</div>
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <p className="text-purple-300 text-sm font-mono break-all">{referralLink}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            📋 Copy
          </button>
          <button
            onClick={shareLink}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            📤 Share
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="text-white font-semibold mb-3">How it works</div>
        <div className="space-y-3">
          {[
            { icon: '🔗', text: 'Share your referral link with friends' },
            { icon: '👋', text: 'Friend joins AniTap via your link' },
            { icon: '⚡', text: 'You both earn bonus energy!' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl">{step.icon}</span>
              <span className="text-gray-300 text-sm">{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
