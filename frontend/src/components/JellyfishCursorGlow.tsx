'use client'

import { useState, useEffect } from 'react'

export default function JellyfishCursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Direct Instantaneous Jellyfish Glow Halo (Zero Trail/Lag) */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none opacity-75"
        style={{
          width: '420px',
          height: '420px',
          left: `${pos.x - 210}px`,
          top: `${pos.y - 210}px`,
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(7, 39, 32, 0.05) 50%, transparent 80%)'
        }}
      />
    </div>
  )
}
