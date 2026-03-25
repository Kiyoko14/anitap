'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authTelegram, getUser, loadTokenFromStorage, setAuthToken } from '@/lib/api'
import { getInitData, getTelegramWebApp } from '@/lib/telegram'
import { useGameStore } from '@/store/useGameStore'

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const { setToken, setUser } = useGameStore()

  useEffect(() => {
    async function init() {
      try {
        const tg = getTelegramWebApp()
        if (tg) {
          tg.ready()
          tg.expand()
        }

        // Try existing token first
        const existingToken = loadTokenFromStorage()
        if (existingToken) {
          setAuthToken(existingToken)
          setToken(existingToken)
          try {
            const user = await getUser()
            setUser(user)
            setLoading(false)
            return
          } catch {
            // Token expired, re-auth
          }
        }

        // Authenticate with Telegram initData
        const initData = getInitData()
        if (!initData) {
          // Dev mode fallback - use mock data
          console.warn('No Telegram initData found, using dev mode')
          setLoading(false)
          return
        }

        const { token } = await authTelegram(initData)
        setAuthToken(token)
        setToken(token)

        const user = await getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth error:', err)
        toast.error('Failed to authenticate. Please restart the app.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [setToken, setUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
          <div className="text-white text-xl font-bold animate-pulse">AniTap</div>
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
