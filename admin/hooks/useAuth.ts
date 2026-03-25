'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from '@/lib/api'
import { setToken } from '@/lib/auth'
import toast from 'react-hot-toast'

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { token } = await loginAdmin(email, password)
      setToken(token)
      router.push('/dashboard')
      toast.success('Logged in successfully')
    } catch {
      toast.error('Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading }
}
