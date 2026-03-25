'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getToken, removeToken, setupAuthInterceptor } from '@/lib/auth'

interface AuthContextType {
  token: string | null
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const logout = () => {
    removeToken()
    setToken(null)
    router.push('/login')
  }

  useEffect(() => {
    setupAuthInterceptor(() => {
      router.push('/login')
    })
  }, [router])

  useEffect(() => {
    const stored = getToken()
    setToken(stored)
    setIsLoading(false)

    if (!stored && pathname !== '/login') {
      router.push('/login')
    }
  }, [pathname, router])

  return (
    <AuthContext.Provider value={{ token, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
