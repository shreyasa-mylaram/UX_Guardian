import type { FormEvent } from 'react'
import { ArrowRight, Bot, Search, ShieldCheck, Sparkles, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './GlassCard'

interface AuditFormProps {
  url: string
  loading: boolean
  onUrlChange: (url: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const valueProps = [
  { icon: ShieldCheck, text: 'Spot accessibility, UX & SEO issues in one scan', color: 'text-orange-500' },
  { icon: Eye, text: 'See code fixes with side-by-side visual before & after', color: 'text-amber-500' },
  { icon: Bot, text: 'Chat with your audit to understand what to fix first', color: 'text-rose-500' },
]

export function AuditForm({ url, loading, onUrlChange, onSubmit }: AuditFormProps) {
  return (
    <div className="flex min-h-[78vh] items-center justify-center">
      <div className="grid w-full items-center gap-12 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Left: Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-300/50 bg-orange-50/80 px-4 py-2 text-sm font-medium text-orange-600 shadow-sm backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Audit faster. Understand deeper. Fix with confidence.
          </motion.div>

          <div className="max-w-4xl space-y-5">
            <h2 className="text-5xl font-black tracking-[-0.04em] text-stone-900 md:text-7xl leading-none">
              Turn messy audits into{' '}
              <span className="gradient-text">clean fixes.</span>
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-stone-500 md:text-xl">
              UX Guardian combines automated scanning, AI explanations, and fix-ready code
              suggestions so your team ships faster.
            </p>
          </div>

          {/* URL form */}
          <form onSubmit={onSubmit} className="max-w-3xl">
            <GlassCard className="p-2.5 pulse-glow" glowColor="rgba(249,115,22,0.2)">
              <div className="flex flex-col gap-2.5 lg:flex-row">
                <label className="group relative flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400 transition group-focus-within:text-orange-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="Enter a URL like https://example.com"
                    required
                    className="h-14 w-full rounded-2xl border border-amber-200/50 bg-white/70 pl-14 pr-5 text-base text-stone-900 outline-none placeholder:text-stone-400 transition focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 backdrop-blur-sm"
                  />
                </label>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-7 text-base font-bold text-white shadow-lg shadow-orange-400/40 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Auditing…' : 'Start Audit'}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </GlassCard>
          </form>

          {/* Value props */}
          <div className="grid gap-3 md:grid-cols-3">
            {valueProps.map(({ icon: Icon, text, color }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              >
                <GlassCard className="p-4 h-full" float>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${color}`} />
                    <p className="text-sm leading-6 text-stone-600">{text}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Preview card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-orange-300/30 via-amber-200/20 to-yellow-200/20 blur-3xl" />
          <GlassCard className="relative p-6" float glowColor="rgba(251,191,36,0.2)">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-400/70">Preview Workflow</p>
                <h3 className="mt-1.5 text-2xl font-black text-stone-800">What your team gets</h3>
              </div>
              <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                Ship faster
              </div>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-5" glowColor="rgba(249,115,22,0.1)">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-100 p-3 text-orange-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">Issue Explorer</p>
                    <p className="text-sm text-stone-500">Severity, business impact, fix time.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Accessibility', 'WCAG 2.2', 'emerald'], 
                    ['UX', 'Heuristics', 'orange'], 
                    ['SEO', 'Core Vitals', 'rose']
                  ].map(([label, value, color]) => (
                    <div key={label} className={`rounded-2xl border border-${color}-200/60 bg-${color}-50/70 p-3 text-center flex flex-col justify-center`}>
                      <p className={`text-xs uppercase tracking-widest text-${color}-500/80 mb-1`}>{label}</p>
                      <p className={`text-sm font-bold text-${color}-700 leading-tight`}>{value}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-5" glowColor="rgba(251,191,36,0.1)">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-500">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">AI Assistant</p>
                    <p className="text-sm text-stone-500">Explain, prioritize, guide.</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-stone-100/80 px-4 py-2.5 text-sm text-stone-700">
                    Which issue should I fix first?
                  </div>
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-amber-50/80 px-4 py-2.5 text-sm text-stone-700">
                    Start with the high-severity accessibility issue — clearest win for score improvement! 🎯
                  </div>
                </div>
              </GlassCard>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
