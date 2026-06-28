import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2, Sparkles } from 'lucide-react'
import { GlassCard } from './GlassCard'

const steps = [
  'Connecting to Website',
  'Capturing Full-Page Screenshot',
  'Extracting HTML & DOM Tree',
  'Running WCAG 2.2 Accessibility Checks',
  'Evaluating UX Heuristics',
  'Generating Fixes with Gemini AI',
  'Preparing Final Report',
]

export function ScanProgress({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Glow behind card */}
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-orange-300/25 via-amber-200/15 to-yellow-200/20 blur-3xl" />

      <GlassCard className="relative p-8" glowColor="rgba(249,115,22,0.2)">
        {/* Scan beam animation strip */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[32px] overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-orange-400 to-transparent scan-beam" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/50 bg-orange-50/80 px-4 py-2 text-sm font-medium text-orange-600 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Scan in progress
        </div>

        <h3 className="mt-5 flex items-center gap-3 text-3xl font-black text-stone-800">
          <div className="rounded-2xl bg-orange-100 p-2">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
          Auditing your website
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
          UX Guardian is collecting signals across accessibility, UX, and SEO, then preparing
          prioritized issues and code-level fix suggestions.
        </p>

        <div className="mt-8 space-y-3">
          {steps.map((step, i) => {
            const isCompleted = i < stepIndex
            const isActive = i === stepIndex
            const isPending = i > stepIndex

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all ${
                  isActive
                    ? 'border-orange-300/60 bg-gradient-to-r from-orange-50/80 to-amber-50/70 shadow-sm'
                    : isCompleted
                    ? 'border-emerald-200/50 bg-emerald-50/40'
                    : 'border-amber-100/40 bg-white/30'
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-stone-300" />
                  )}
                </div>
                <span className={`text-sm font-semibold ${
                  isCompleted ? 'text-emerald-700' : isActive ? 'text-orange-700' : 'text-stone-400'
                }`}>
                  {step}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.div
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-orange-400"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
