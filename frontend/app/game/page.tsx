'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import TapButton from '@/components/TapButton'
import EnergyBar from '@/components/EnergyBar'
import { postTap, syncUser } from '@/lib/api'
import { hapticImpact } from '@/lib/telegram'

interface FloatLabel {
  id: number
  x: number
  y: number
  value: number
}

export default function GamePage() {
  const { energy, tapValue, passiveRate, addEnergy, setEnergy, updatePassiveRate, updateTapValue, token } = useGameStore()
  const pendingTapsRef = useRef(0)
  const tapAreaRef = useRef<HTMLDivElement>(null)
  const [floatLabels, setFloatLabels] = useState<FloatLabel[]>([])

  // Send batched taps every 5 seconds
  useEffect(() => {
    if (!token) return
    const interval = setInterval(async () => {
      if (pendingTapsRef.current > 0) {
        const count = pendingTapsRef.current
        pendingTapsRef.current = 0
        try {
          const res = await postTap(count)
          setEnergy(res.energy)
        } catch (err) {
          console.error('Tap sync error:', err)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [token, setEnergy])

  // Sync state every 10 seconds
  useEffect(() => {
    if (!token) return
    const interval = setInterval(async () => {
      try {
        const res = await syncUser()
        setEnergy(res.energy)
        updateTapValue(res.tap_value)
        updatePassiveRate(res.passive_rate)
      } catch (err) {
        console.error('Sync error:', err)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [token, setEnergy, updateTapValue, updatePassiveRate])

  // Passive income tick
  useEffect(() => {
    if (passiveRate <= 0) return
    const interval = setInterval(() => {
      addEnergy(passiveRate)
    }, 1000)
    return () => clearInterval(interval)
  }, [passiveRate, addEnergy])

  const handleTap = useCallback(() => {
    addEnergy(tapValue)
    pendingTapsRef.current += 1
    hapticImpact('light')

    // Float label at random offset from center
    const rect = tapAreaRef.current?.getBoundingClientRect()
    const cx = rect ? rect.width / 2 : 100
    const cy = rect ? rect.height / 2 : 100
    const offsetX = (Math.random() - 0.5) * 80
    const offsetY = (Math.random() - 0.5) * 80
    const id = Date.now() + Math.random()
    setFloatLabels((prev) => [...prev, { id, x: cx + offsetX, y: cy + offsetY, value: tapValue }])
    setTimeout(() => {
      setFloatLabels((prev) => prev.filter((l) => l.id !== id))
    }, 800)
  }, [tapValue, addEnergy])

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 select-none">
      {/* Header */}
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
          AniTap ⚡
        </h1>
      </div>

      {/* Energy Bar */}
      <EnergyBar current={energy} passiveRate={passiveRate} />

      {/* Tap Area */}
      <div
        ref={tapAreaRef}
        className="relative flex-1 flex items-center justify-center"
      >
        {/* Float labels */}
        {floatLabels.map((label) => (
          <div
            key={label.id}
            className="absolute pointer-events-none text-yellow-400 font-bold text-xl z-20"
            style={{
              left: label.x - 20,
              top: label.y - 40,
              animation: 'floatUp 0.8s ease-out forwards',
            }}
          >
            +{label.value}
          </div>
        ))}

        <TapButton
          tapValue={tapValue}
          onClick={handleTap}
          disabled={false}
        />
      </div>

      {/* Stats row */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Per Tap</div>
          <div className="text-purple-400 font-bold">+{tapValue}</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Passive</div>
          <div className="text-green-400 font-bold">+{passiveRate}/s</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Total</div>
          <div className="text-yellow-400 font-bold">{energy.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
