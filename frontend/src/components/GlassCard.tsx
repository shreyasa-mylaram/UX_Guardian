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
  const [isHovered, setIsHovered] = useState(false)
  const [shimmerPos, setShimmerPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
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
        transform: `scale(${isHovered ? 1.02 : 1})`,
        boxShadow: isHovered
          ? `0 20px 40px ${glowColor}, 0 8px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)`
          : `0 8px 32px rgba(249,115,22,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)`,
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      }}
      className={`glass rounded-3xl relative overflow-hidden cursor-default ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
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
