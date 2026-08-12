'use client'

interface RadarVisualProps {
  size?: number // Size in pixels
  variant?: 'full' | 'half' // Full circle vs Half-Dome Radar
  status?: 'active' | 'scanning' | 'idle'
}

export default function RadarVisual({ size = 72, variant = 'half', status = 'active' }: RadarVisualProps) {
  if (variant === 'half') {
    // 180-Degree Semi-Circular Sonar Dome Display
    return (
      <div 
        className="relative flex flex-col items-center justify-end shrink-0 rounded-t-full bg-[#072720]/10 border-t border-x border-[#072720]/20 overflow-hidden shadow-xs"
        style={{ width: `${size * 1.8}px`, height: `${size}px` }}
      >
        {/* Semi-Circular Concentric Arcs & Grid */}
        <svg 
          className="absolute inset-0 w-full h-full text-[#072720]/20" 
          viewBox="0 0 180 100" 
          fill="none"
        >
          {/* Outer Arc */}
          <path d="M 10 90 A 80 80 0 0 1 170 90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Middle Arc */}
          <path d="M 35 90 A 55 55 0 0 1 145 90" stroke="currentColor" strokeWidth="1.2" />
          {/* Inner Gold Arc */}
          <path d="M 60 90 A 30 30 0 0 1 120 90" stroke="#d4af37" strokeWidth="1.2" strokeOpacity="0.6" />
          
          {/* Radial Angle Lines */}
          <line x1="90" y1="90" x2="90" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="90" y1="90" x2="25" y2="25" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="90" y1="90" x2="155" y2="25" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
          
          {/* Baseline */}
          <line x1="0" y1="95" x2="180" y2="95" stroke="#072720" strokeWidth="2" strokeOpacity="0.2" />
        </svg>

        {/* 180-Degree Oscillating Radar Sweep Beam */}
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[180px] h-[90px] origin-bottom pointer-events-none ${
            status === 'scanning' ? 'animate-radar-sweep-half-fast' : 'animate-radar-sweep-half'
          }`}
          style={{
            background: 'conic-gradient(from 270deg at 50% 100%, transparent 0deg, transparent 310deg, rgba(16, 185, 129, 0.25) 340deg, rgba(212, 175, 55, 0.7) 360deg)'
          }}
        ></div>

        {/* Live Signal Target Blips inside the Dome */}
        {/* Blip 1: Gold Buyer Match */}
        <span 
          className="absolute w-2.5 h-2.5 rounded-full bg-[#d4af37] gold-glow animate-blip"
          style={{ top: '28%', left: '68%' }}
        ></span>

        {/* Blip 2: Mint Live Feed Signal */}
        <span 
          className="absolute w-2 h-2 rounded-full bg-[#10b981] radar-glow animate-blip"
          style={{ top: '48%', left: '32%', animationDelay: '0.9s' }}
        ></span>

        {/* Blip 3: Mid-Arc Signal */}
        <span 
          className="absolute w-1.5 h-1.5 rounded-full bg-[#10b981] animate-blip"
          style={{ top: '22%', left: '42%', animationDelay: '1.5s' }}
        ></span>

        {/* Center Base Pulse Pivot */}
        <div className="relative z-10 w-3 h-3 bg-[#072720] border-2 border-[#d4af37] rounded-full flex items-center justify-center -mb-1.5 shadow-sm">
          <span className="w-1 h-1 bg-[#10b981] rounded-full animate-ping"></span>
        </div>
      </div>
    )
  }

  // Large 360-Degree Executive Sonar Console (Variant = 'full')
  return (
    <div 
      className="relative flex items-center justify-center shrink-0 rounded-full bg-[#072720]/8 p-1 border border-[#072720]/15 overflow-hidden shadow-xs"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* 1. Concentric Background Rings */}
      <svg 
        className="absolute inset-0 w-full h-full text-[#072720]/15" 
        viewBox="0 0 100 100" 
        fill="none"
      >
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="18" stroke="#d4af37" strokeWidth="1.2" strokeOpacity="0.5" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
      </svg>

      {/* 2. Rotating 360 Degree Radar Sweep Beam */}
      <div 
        className={`absolute inset-0 rounded-full pointer-events-none ${
          status === 'scanning' ? 'animate-radar-sweep-fast' : 'animate-radar-sweep'
        }`}
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.15) 320deg, rgba(212, 175, 55, 0.45) 355deg, rgba(16, 185, 129, 0.8) 360deg)'
        }}
      ></div>

      {/* 3. Signal Blips */}
      <span 
        className="absolute w-2 h-2 rounded-full bg-[#d4af37] gold-glow animate-blip"
        style={{ top: '26%', left: '62%' }}
      ></span>
      <span 
        className="absolute w-1.5 h-1.5 rounded-full bg-[#10b981] radar-glow animate-blip"
        style={{ bottom: '30%', left: '28%', animationDelay: '0.8s' }}
      ></span>

      {/* Center Core */}
      <div className="relative z-10 w-2.5 h-2.5 bg-[#072720] border border-[#d4af37] rounded-full flex items-center justify-center shadow-xs">
        <span className="w-1 h-1 bg-[#10b981] rounded-full animate-ping"></span>
      </div>
    </div>
  )
}
