'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, getUserDetail, banUser, resetUserEnergy } from '@/lib/api'
import toast from 'react-hot-toast'

export function useUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => getAdminUsers(page, limit),
  })
}

export function useUserDetail(id: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserDetail(id),
    enabled: !!id,
  })
}

export function useBanUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: banUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User ban status updated')
    },
    onError: () => toast.error('Failed to update ban status'),
  })
}

export function useResetEnergy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetUserEnergy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Energy reset successfully')
    },
    onError: () => toast.error('Failed to reset energy'),
  })
}
