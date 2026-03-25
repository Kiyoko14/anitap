'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import UpgradeCard from '@/components/UpgradeCard'
import { UpgradeCardSkeleton } from '@/components/Skeleton'
import { getUpgrades, purchaseUpgrade } from '@/lib/api'
import toast from 'react-hot-toast'

export default function UpgradesPage() {
  const { energy, upgrades, setUpgrades, setEnergy, token } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    getUpgrades()
      .then(setUpgrades)
      .catch(() => toast.error('Failed to load upgrades'))
      .finally(() => setLoading(false))
  }, [token, setUpgrades])

  const handlePurchase = async (upgradeId: number) => {
    const upgrade = upgrades.find((u) => u.id === upgradeId)
    if (!upgrade) return
    if (energy < upgrade.cost) {
      toast.error('Not enough energy!')
      return
    }

    setPurchasingId(upgradeId)
    // Optimistic deduct
    const prevEnergy = energy
    setEnergy(energy - upgrade.cost)

    try {
      const res = await purchaseUpgrade(upgradeId)
      setEnergy(res.energy)
      setUpgrades(
        upgrades.map((u) => (u.id === upgradeId ? res.upgrade : u))
      )
      toast.success(`${upgrade.name} upgraded!`)
    } catch {
      // Revert optimistic update
      setEnergy(prevEnergy)
      toast.error('Purchase failed. Try again.')
    } finally {
      setPurchasingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Upgrades
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        Boost your tap power and passive income
      </p>

      {/* Energy display */}
      <div className="flex items-center gap-2 mb-6 bg-gray-900 rounded-xl p-3 border border-gray-800">
        <span className="text-yellow-400">⚡</span>
        <span className="text-white font-bold">{energy.toLocaleString()}</span>
        <span className="text-gray-400 text-sm">available</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <UpgradeCardSkeleton key={i} />
          ))}
        </div>
      ) : upgrades.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <div className="text-4xl mb-4">🔮</div>
          <p>No upgrades available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upgrades.map((upgrade) => (
            <UpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              currentEnergy={energy}
              onPurchase={handlePurchase}
              purchasing={purchasingId === upgrade.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
