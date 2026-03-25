'use client'

interface EnergyBarProps {
  current: number
  max?: number
  passiveRate: number
}

export default function EnergyBar({ current, max = 10000, passiveRate }: EnergyBarProps) {
  const percentage = Math.min((current / max) * 100, 100)

  return (
    <div className="w-full px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">⚡</span>
          <span className="text-white font-bold text-lg">
            {current.toLocaleString()}
          </span>
          <span className="text-gray-400 text-sm">/ {max.toLocaleString()}</span>
        </div>
        {passiveRate > 0 && (
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <span>+{passiveRate}/s</span>
          </div>
        )}
      </div>

      <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
