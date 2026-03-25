'use client'

import { Upgrade } from '@/store/useGameStore'

interface UpgradeCardProps {
  upgrade: Upgrade
  currentEnergy: number
  onPurchase: (upgradeId: number) => void
  purchasing?: boolean
}

export default function UpgradeCard({
  upgrade,
  currentEnergy,
  onPurchase,
  purchasing = false,
}: UpgradeCardProps) {
  const canAfford = currentEnergy >= upgrade.cost

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">⬆️</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-semibold truncate">{upgrade.name}</span>
          {upgrade.level > 0 && (
            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
              Lv.{upgrade.level}
            </span>
          )}
        </div>
        <div className="flex gap-3 text-xs text-gray-400">
          {upgrade.multiplier > 1 && (
            <span className="text-yellow-400">×{upgrade.multiplier} tap</span>
          )}
          {upgrade.passive_bonus > 0 && (
            <span className="text-green-400">+{upgrade.passive_bonus}/s</span>
          )}
        </div>
      </div>

      {/* Cost & Buy */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-sm">⚡</span>
          <span className="text-white text-sm font-bold">
            {upgrade.cost.toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => onPurchase(upgrade.id)}
          disabled={!canAfford || purchasing}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
            ${
              canAfford && !purchasing
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 active:scale-95'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {purchasing ? '...' : 'Buy'}
        </button>
      </div>
    </div>
  )
}
