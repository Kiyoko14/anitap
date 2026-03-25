'use client'

import { useState, useCallback } from 'react'

interface TapButtonProps {
  tapValue: number
  onClick: () => void
  disabled?: boolean
}

export default function TapButton({ tapValue, onClick, disabled = false }: TapButtonProps) {
  const [pressed, setPressed] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      setPressed(true)
      setTimeout(() => setPressed(false), 100)

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      setRipples((prev) => [...prev, { id, x, y }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)

      onClick()
    },
    [disabled, onClick]
  )

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <div className="absolute w-60 h-60 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse" />

      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-52 h-52 rounded-full overflow-hidden
          bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500
          shadow-[0_0_40px_rgba(168,85,247,0.4)]
          transition-transform duration-100 select-none
          ${pressed ? 'scale-95' : 'scale-100'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
          focus:outline-none
        `}
      >
        {/* Inner design */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-700 to-pink-600 opacity-60" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/30 to-transparent" />

        {/* Anime face / icon */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <span className="text-5xl select-none">⚡</span>
          <span className="text-white font-bold text-sm mt-1">+{tapValue}</span>
        </div>

        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/20 animate-ping"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
          />
        ))}
      </button>
    </div>
  )
}
