import { create } from 'zustand'

export interface User {
  id: number
  telegram_id: string
  username: string
  energy: number
  tap_value: number
  passive_rate: number
  referral_count: number
  referral_earnings: number
}

export interface Upgrade {
  id: number
  name: string
  cost: number
  multiplier: number
  passive_bonus: number
  level: number
}

export interface LeaderboardEntry {
  rank: number
  username: string
  energy: number
  telegram_id: string
}

interface GameState {
  token: string | null
  user: User | null
  energy: number
  tapValue: number
  passiveRate: number
  upgrades: Upgrade[]
  leaderboard: LeaderboardEntry[]
  setToken: (token: string) => void
  setUser: (user: User) => void
  addEnergy: (amount: number) => void
  setEnergy: (energy: number) => void
  setUpgrades: (upgrades: Upgrade[]) => void
  setLeaderboard: (entries: LeaderboardEntry[]) => void
  updateTapValue: (val: number) => void
  updatePassiveRate: (rate: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  token: null,
  user: null,
  energy: 0,
  tapValue: 1,
  passiveRate: 0,
  upgrades: [],
  leaderboard: [],

  setToken: (token) => set({ token }),
  setUser: (user) =>
    set({
      user,
      energy: user.energy,
      tapValue: user.tap_value,
      passiveRate: user.passive_rate,
    }),
  addEnergy: (amount) =>
    set((state) => ({ energy: state.energy + amount })),
  setEnergy: (energy) => set({ energy }),
  setUpgrades: (upgrades) => set({ upgrades }),
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  updateTapValue: (val) => set({ tapValue: val }),
  updatePassiveRate: (rate) => set({ passiveRate: rate }),
}))
