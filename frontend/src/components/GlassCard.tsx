import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  float?: boolean
  onClick?: () => void
}

export function GlassCard({
  children,
  className = '',
  glowColor = 'rgba(249,115,22,0.2)',
  float = false,
  onClick,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [shimmerPos, setShimmerPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -14, y: dx * 14 }) // More aggressive tilt
    setShimmerPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <motion.div
      ref={cardRef}
      animate={float ? { y: [0, -8, 0] } : {}}
      transition={float ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.025 : 1})`,
        boxShadow: isHovered
          ? `0 30px 80px ${glowColor}, 0 12px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)`
          : `0 8px 32px rgba(249,115,22,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)`,
        transition: 'box-shadow 0.3s ease, transform 0.08s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`glass rounded-3xl relative overflow-hidden cursor-default ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setIsHovered(false) }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
    >
      {/* Radial shimmer that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${shimmerPos.x}% ${shimmerPos.y}%, rgba(255,255,255,0.35) 0%, transparent 60%)`,
        }}
      />
      {/* Top gloss streak */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      {/* Aurora border glow on hover */}
      {isHovered && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-amber-300/60 shadow-[inset_0_0_20px_rgba(251,191,36,0.12)]" />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}
