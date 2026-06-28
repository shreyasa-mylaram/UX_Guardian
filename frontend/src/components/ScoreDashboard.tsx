import { AlertTriangle, ShieldCheck, Sparkles, TimerReset, DollarSign, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { Issue } from '../store'
import { getIssueBreakdown } from '../lib/audit-utils'
import { calculateIssueImpact, formatCurrency } from '../lib/impact-calculator'
import { useStore } from '../store'
import { GlassCard } from './GlassCard'
import { BusinessImpactForm } from './BusinessImpactForm'
import { ExecutiveSummary } from './ExecutiveSummary'
import { IndustryBenchmarkChart } from './IndustryBenchmarkChart'

interface ScoreDashboardProps {
  overall: number | null
  issues: Issue[]
}

function ScoreRing({ value, size = 120 }: { value: number | null; size?: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const pct = ((value ?? 0) / 100) * circ
  const color = (value ?? 0) >= 80 ? '#10b981' : (value ?? 0) >= 60 ? '#f97316' : '#f43f5e'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-2xl font-black text-stone-800"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {value ?? '--'}
        </motion.span>
        <span className="text-xs text-stone-500">/100</span>
      </div>
    </div>
  )
}

export function ScoreDashboard({ overall, issues }: ScoreDashboardProps) {
  const { businessContext } = useStore()
  const breakdown = getIssueBreakdown(issues)
  const urgentIssues = issues.filter((i) => ['critical', 'high'].includes(i.severity.toLowerCase())).length
  const quickWins = issues.filter((i) => i.estimated_fix_time?.toLowerCase().includes('min')).length

  let totalRisk = 0
  let avgConfidence = 0
  if (businessContext.isConfigured) {
    issues.forEach(issue => {
      const impact = calculateIssueImpact(issue, businessContext)
      totalRisk += impact.estimatedRisk
      avgConfidence += impact.confidence
    })
    if (issues.length > 0) avgConfidence = Math.round(avgConfidence / issues.length)
  }

  return (
    <div className="space-y-6">
      {/* Cmd+K Hint Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <p className="text-sm font-medium text-indigo-200">
            <strong>Conversational UX Enabled:</strong> Press <kbd className="rounded bg-indigo-500/20 px-2 py-1 font-mono text-indigo-300">Cmd + K</kbd> to talk to UX Guardian and generate UI dynamically.
          </p>
        </div>
      </motion.div>

      <BusinessImpactForm />
      
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
      {/* Score card */}
      <GlassCard className="p-6" glowColor="rgba(249,115,22,0.15)">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400/70">Audit Overview</p>
            <h3 className="mt-1.5 text-2xl font-black text-stone-800">Website health snapshot</h3>
          </div>
          <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-600">
            Ready to triage
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm text-stone-500">Overall Score</p>
            <p className="text-xs text-stone-400 mt-1">Scan completed</p>
          </div>
          <ScoreRing value={overall} size={130} />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: AlertTriangle, label: 'Urgent Fixes', value: urgentIssues, sub: 'Critical or high', color: 'text-orange-500', bg: 'bg-orange-50/80 border-orange-200/50' },
            { icon: ShieldCheck, label: 'Accessibility', value: breakdown[0].count, sub: 'Usability blockers', color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-200/50' },
            { icon: TimerReset, label: 'Quick Wins', value: quickWins, sub: 'Fixed in minutes', color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-200/50' },
            { icon: Activity, label: 'Avg Confidence', value: businessContext.isConfigured ? `${avgConfidence}%` : '--', sub: 'Scoring certainty', color: 'text-indigo-500', bg: 'bg-indigo-50/80 border-indigo-200/50' },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <GlassCard key={label} className={`p-4 border ${bg}`}>
              <div className="mb-2.5 flex items-center gap-2 text-stone-500 text-sm">
                <Icon className={`h-4 w-4 ${color}`} />{label}
              </div>
              <p className="text-2xl font-black text-stone-800">{value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-500">{sub}</p>
            </GlassCard>
          ))}
        </div>
      </GlassCard>

      {/* Bar chart card */}
      <GlassCard className="p-6" glowColor="rgba(251,191,36,0.15)">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400/70">Issue Breakdown</p>
            <h3 className="mt-1.5 text-2xl font-black text-stone-800">Where friction is coming from</h3>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/50 bg-orange-50/80 px-3 py-1.5 text-xs font-medium text-orange-600">
            <Sparkles className="h-3.5 w-3.5" /> Live data
          </div>
        </div>

        <div className="mt-8 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown} barSize={48}>
              <CartesianGrid stroke="rgba(251,191,36,0.12)" vertical={false} />
              <XAxis dataKey="shortName" stroke="#a8a29e" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#a8a29e" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(249,115,22,0.06)' }}
                contentStyle={{
                  borderRadius: 16,
                  border: '1px solid rgba(251,191,36,0.25)',
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(12px)',
                  color: '#1c1917',
                }}
              />
              <Bar dataKey="count" radius={[14, 14, 4, 4]}>
                {breakdown.map((entry: any) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {breakdown.map((item: any) => (
            <GlassCard key={item.name} className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                <p className="font-bold text-stone-800 text-sm">{item.name}</p>
              </div>
              <p className="mt-2.5 text-3xl font-black text-stone-800">{item.count}</p>
              <p className="mt-1 text-xs text-stone-500">Detected issues</p>
            </GlassCard>
          ))}
        </div>

        {businessContext.isConfigured && (
          <GlassCard className="mt-4 p-5 border-rose-200/50 bg-gradient-to-r from-rose-50/60 to-orange-50/60" glowColor="rgba(244,63,94,0.1)">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Business Impact</span>
                </div>
                <p className="text-sm text-stone-600 mb-2">Estimated Monthly Revenue at Risk</p>
                <p className="text-4xl font-black text-stone-900 tracking-tight">{formatCurrency(totalRisk)}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-stone-600 border border-stone-200/50">
                  Avg Confidence: {avgConfidence}%
                </span>
                <p className="mt-2 text-xs text-stone-400 max-w-[140px]">
                  Based on Accessibility, UX, SEO, Performance
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </GlassCard>
    </div>
    
    <IndustryBenchmarkChart />
    <ExecutiveSummary />
    </div>
  )
}
