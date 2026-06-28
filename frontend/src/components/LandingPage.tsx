import { motion } from 'framer-motion'
import { ArrowRight, Flower, Leaf, Shield, Sparkles } from 'lucide-react'

/* ── SVG botanical shapes ─────────────────────────────── */
const Petal = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 40 60" className={className} style={style} fill="currentColor">
    <ellipse cx="20" cy="30" rx="12" ry="28" />
  </svg>
)

const FloralCircle = ({ size = 120, color = '#f97316', delay = 0 }: { size?: number; color?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, duration: 0.8, type: 'spring', stiffness: 120 }}
    className="absolute pointer-events-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full gentle-sway">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <ellipse
          key={i}
          cx={50 + 28 * Math.cos((angle * Math.PI) / 180)}
          cy={50 + 28 * Math.sin((angle * Math.PI) / 180)}
          rx="13" ry="22"
          transform={`rotate(${angle}, ${50 + 28 * Math.cos((angle * Math.PI) / 180)}, ${50 + 28 * Math.sin((angle * Math.PI) / 180)})`}
          fill={color}
          opacity="0.7"
        />
      ))}
      <circle cx="50" cy="50" r="14" fill={color} opacity="0.9" />
    </svg>
  </motion.div>
)

/* ── Floating petal particle ──────────────────────────── */
function FallingPetal({ left, delay, duration, color, size = 14 }: {
  left: number; delay: number; duration: number; color: string; size?: number
}) {
  return (
    <div
      className="pointer-events-none absolute top-0"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <Petal
        className={`${delay % 2 === 0 ? 'petal-fall' : 'petal-sway'}`}
        style={{
          width: size,
          height: size * 1.5,
          color,
          opacity: 0.7,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
        }}
      />
    </div>
  )
}

const PETALS = [
  { left: 5,  delay: 0,   dur: 9,  color: '#f97316', size: 14 },
  { left: 12, delay: 1.5, dur: 11, color: '#fbbf24', size: 10 },
  { left: 22, delay: 0.5, dur: 8,  color: '#fb923c', size: 16 },
  { left: 35, delay: 2,   dur: 10, color: '#f43f5e', size: 12 },
  { left: 48, delay: 0.8, dur: 9,  color: '#fcd34d', size: 18 },
  { left: 58, delay: 3,   dur: 12, color: '#f97316', size: 11 },
  { left: 68, delay: 1,   dur: 10, color: '#fb923c', size: 15 },
  { left: 78, delay: 2.5, dur: 8,  color: '#fbbf24', size: 13 },
  { left: 88, delay: 0.3, dur: 11, color: '#f43f5e', size: 9  },
  { left: 95, delay: 1.8, dur: 9,  color: '#fcd34d', size: 17 },
]

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #fffbf4 0%, #fef6e4 35%, #fff0d8 65%, #fefaf0 100%)',
      }}
    >
      {/* ── Falling petals ──────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PETALS.map((p, i) => (
          <FallingPetal key={i} left={p.left} delay={p.delay} duration={p.dur} color={p.color} size={p.size} />
        ))}
      </div>

      {/* ── Corner botanical decorations ─────────── */}
      {/* Top-left cluster */}
      <div className="absolute top-0 left-0 pointer-events-none">
        <FloralCircle size={160} color="#fbbf24" delay={0.2} />
        <FloralCircle size={90}  color="#fb923c" delay={0.4} />
        <motion.div
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute top-4 left-4"
        >
          <svg viewBox="0 0 200 200" width="240" height="240" className="opacity-75">
            {/* Big leaf */}
            <ellipse cx="80" cy="120" rx="30" ry="70" transform="rotate(-35, 80, 120)" fill="#86efac" opacity="0.6"/>
            <ellipse cx="140" cy="90" rx="22" ry="55" transform="rotate(20, 140, 90)" fill="#4ade80" opacity="0.5"/>
            <ellipse cx="60" cy="80" rx="18" ry="45" transform="rotate(-55, 60, 80)" fill="#bbf7d0" opacity="0.55"/>
            {/* Flowers */}
            <circle cx="110" cy="60" r="14" fill="#f97316" opacity="0.85"/>
            <circle cx="110" cy="60" r="7" fill="#fcd34d"/>
            <circle cx="70" cy="40" r="10" fill="#fb923c" opacity="0.8"/>
            <circle cx="70" cy="40" r="5" fill="#fef08a"/>
            <circle cx="145" cy="110" r="12" fill="#f43f5e" opacity="0.75"/>
            <circle cx="145" cy="110" r="6" fill="#fcd34d"/>
            {/* Vine line */}
            <path d="M30 180 Q80 120 120 80 Q150 50 170 20" stroke="#86efac" strokeWidth="2.5" fill="none" opacity="0.5"/>
          </svg>
        </motion.div>
      </div>

      {/* Top-right cluster */}
      <div className="absolute top-0 right-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="absolute top-4 right-4"
        >
          <svg viewBox="0 0 200 200" width="240" height="240" className="opacity-75 scale-x-[-1]">
            <ellipse cx="80" cy="120" rx="30" ry="70" transform="rotate(-35, 80, 120)" fill="#fdba74" opacity="0.55"/>
            <ellipse cx="140" cy="90" rx="22" ry="55" transform="rotate(20, 140, 90)" fill="#fca5a5" opacity="0.45"/>
            <ellipse cx="60" cy="80" rx="18" ry="45" transform="rotate(-55, 60, 80)" fill="#fde68a" opacity="0.5"/>
            <circle cx="110" cy="60" r="14" fill="#f97316" opacity="0.85"/>
            <circle cx="110" cy="60" r="7" fill="#fcd34d"/>
            <circle cx="70" cy="40" r="10" fill="#f43f5e" opacity="0.8"/>
            <circle cx="70" cy="40" r="5" fill="#fef08a"/>
            <circle cx="145" cy="110" r="12" fill="#fb923c" opacity="0.75"/>
            <circle cx="145" cy="110" r="6" fill="#fcd34d"/>
            <path d="M30 180 Q80 120 120 80 Q150 50 170 20" stroke="#fbbf24" strokeWidth="2.5" fill="none" opacity="0.45"/>
          </svg>
        </motion.div>
      </div>

      {/* Bottom decorations */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1.2 }}
        >
          <svg viewBox="0 0 800 160" width="100%" height="160">
            {/* Ground grass / rolling hills */}
            <ellipse cx="200" cy="160" rx="260" ry="80" fill="#86efac" opacity="0.35"/>
            <ellipse cx="600" cy="160" rx="280" ry="70" fill="#4ade80" opacity="0.3"/>
            <ellipse cx="400" cy="160" rx="320" ry="90" fill="#bbf7d0" opacity="0.4"/>
            {/* Small flowers on the ground */}
            {[80,160,250,340,420,500,590,670,740].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={140 - (i % 3) * 8} r={6 + (i % 3) * 2} fill={['#f97316','#fbbf24','#f43f5e','#fb923c'][i%4]} opacity="0.8"/>
                <circle cx={x} cy={140 - (i % 3) * 8} r={3 + (i % 3)} fill="#fef08a"/>
                <line x1={x} y1={140 - (i%3)*8 + 7} x2={x} y2="160" stroke="#4ade80" strokeWidth="1.5"/>
              </g>
            ))}
          </svg>
        </motion.div>
      </div>

      {/* ── Main content ─────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-20 max-w-3xl">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-white/70 px-5 py-2.5 text-sm font-semibold text-orange-600 shadow-sm backdrop-blur-sm"
        >
          <Flower className="h-4 w-4 text-amber-500" />
          Crafted for developers who care about UX
          <Leaf className="h-3.5 w-3.5 text-green-500" />
        </motion.div>

        {/* Website name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, type: 'spring', stiffness: 100 }}
          className="village-float mb-6"
        >
          <h1 className="text-7xl font-black tracking-[-0.04em] md:text-9xl leading-none select-none">
            <span style={{
              background: 'linear-gradient(135deg, #c2410c 0%, #f97316 30%, #fbbf24 60%, #fb923c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 24px rgba(249,115,22,0.25))',
            }}>UX</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 50%, #fcd34d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 24px rgba(251,191,36,0.25))',
            }}>Guardian</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="mb-10 max-w-xl text-lg leading-8 text-stone-500 md:text-xl"
        >
          Audit your website's UX, accessibility & SEO with AI-powered insights and fix-ready code suggestions.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mb-10 flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Shield, text: 'WCAG Accessibility', color: 'bg-green-50/80 border-green-200/60 text-green-700' },
            { icon: Sparkles, text: 'AI Fix Suggestions', color: 'bg-orange-50/80 border-orange-200/60 text-orange-700' },
            { icon: Leaf, text: 'SEO Analysis', color: 'bg-amber-50/80 border-amber-200/60 text-amber-700' },
          ].map(({ icon: Icon, text, color }) => (
            <span key={text} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm ${color}`}>
              <Icon className="h-3.5 w-3.5" /> {text}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(249,115,22,0.35)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetStarted}
          className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-10 py-5 text-lg font-black text-white shadow-xl shadow-orange-400/40 transition-all"
        >
          Start Your Audit
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </motion.button>

        {/* Decorative flower row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-14 flex items-center gap-4 text-2xl select-none"
        >
          {['🌸','🌻','🌼','🌺','🌷','🌼','🌻','🌸'].map((f, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.3}s` }} className="gentle-sway inline-block">
              {f}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
