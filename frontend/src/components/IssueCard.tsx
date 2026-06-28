import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Clock, Code2, ScanSearch, TrendingDown, Wrench, Eye, CheckCircle2, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { CodeDiffViewer } from './CodeDiffViewer'
import { VisualPreviewModal } from './VisualPreviewModal'
import { GlassCard } from './GlassCard'
import { useStore, type Issue } from '../store'
import { calculateIssueImpact, formatCurrency } from '../lib/impact-calculator'

const severityConfig: Record<string, { badge: string; glow: string; border: string }> = {
  critical: { badge: 'border-red-300/60 bg-red-50/80 text-red-700', glow: 'rgba(239,68,68,0.12)', border: 'border-red-200/50' },
  high:     { badge: 'border-orange-300/60 bg-orange-50/80 text-orange-700', glow: 'rgba(249,115,22,0.12)', border: 'border-orange-200/50' },
  medium:   { badge: 'border-amber-300/60 bg-amber-50/80 text-amber-700', glow: 'rgba(251,191,36,0.12)', border: 'border-amber-200/50' },
  low:      { badge: 'border-sky-300/60 bg-sky-50/80 text-sky-700', glow: 'rgba(14,165,233,0.1)', border: 'border-sky-200/50' },
}

export function IssueCard({ issue }: { issue: Issue }) {
  const [showFix, setShowFix] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCalculation, setShowCalculation] = useState(false)
  const [isApplied, setIsApplied] = useState(issue.is_applied ?? false)
  const cfg = severityConfig[issue.severity.toLowerCase()] ?? severityConfig.low
  
  const { businessContext } = useStore()
  
  const impact = businessContext.isConfigured ? calculateIssueImpact(issue, businessContext) : null
  
  const potentialOrders = businessContext.isConfigured ? businessContext.monthlyTraffic * (businessContext.conversionRate / 100) : 0
  const potentialRevenue = potentialOrders * businessContext.averageOrderValue

  return (
    <motion.article layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <GlassCard className={`overflow-hidden ${cfg.border}`} glowColor={cfg.glow}>
        {/* Header */}
        <div className="border-b border-amber-100/50 bg-gradient-to-r from-white/30 to-transparent p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${cfg.badge}`}>
                  {issue.severity}
                </span>
                <span className="rounded-full border border-stone-200/60 bg-stone-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
                  {issue.category}
                </span>
                {impact && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-rose-50/80 px-3 py-1 text-xs font-bold text-rose-700">
                    <TrendingDown className="h-3.5 w-3.5" /> 
                    {formatCurrency(impact.estimatedRisk)}/mo at risk
                  </span>
                )}
                {impact && (
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider
                    ${impact.fixPriority === 'High' ? 'border-orange-300/60 bg-orange-100/80 text-orange-700' :
                      impact.fixPriority === 'Medium' ? 'border-amber-300/60 bg-amber-100/80 text-amber-700' :
                      'border-stone-300/60 bg-stone-100/80 text-stone-700'
                    }`}
                  >
                    Priority: {impact.fixPriority}
                  </span>
                )}
                {isApplied && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xl font-black tracking-tight text-stone-800">{issue.title}</h4>
                {issue.selector && (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-200/50 bg-stone-50/80 px-3 py-1.5 text-xs text-stone-500">
                    <ScanSearch className="h-3.5 w-3.5" /> {issue.selector}
                  </p>
                )}
              </div>
            </div>

            {impact && (
              <div className="grid gap-3 sm:grid-cols-2 mt-4 xl:mt-0 xl:min-w-[280px]">
                <GlassCard className="p-4 border-rose-100 bg-rose-50/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/80">Est. Revenue at Risk</p>
                  <p className="mt-1.5 text-2xl font-black text-stone-900 tracking-tight">{formatCurrency(impact.estimatedRisk)} <span className="text-sm font-semibold text-stone-500">/ mo</span></p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Confidence</p>
                  <p className="mt-1.5 text-2xl font-black text-indigo-600">{impact.confidence}%</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Estimated Effect</p>
                  <p className="mt-1.5 text-lg font-bold text-stone-800">{(impact.dropoffRate * 100).toFixed(1)}% <span className="text-sm font-normal text-stone-500">drop</span></p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Fix Time</p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-lg font-bold text-stone-800">
                    <Clock className="h-4 w-4 text-orange-500" /> {issue.estimated_fix_time || '15 mins'}
                  </p>
                </GlassCard>
              </div>
            )}
            
            {!impact && (
              <div className="grid gap-3 sm:grid-cols-2 mt-4 xl:mt-0">
                {issue.confidence_score !== undefined && (
                  <GlassCard className="min-w-[130px] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">AI Confidence</p>
                    <p className="mt-2.5 text-3xl font-black text-emerald-600">{issue.confidence_score}%</p>
                  </GlassCard>
                )}
                {issue.estimated_fix_time && (
                  <GlassCard className="min-w-[130px] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Fix Time</p>
                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-base font-bold text-stone-700">
                      <Clock className="h-4 w-4 text-orange-500" /> {issue.estimated_fix_time}
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className={`rounded-3xl border ${cfg.border} bg-white/50 p-5`}>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0 rounded-full bg-red-100 p-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h5 className="mb-2 text-base font-bold text-stone-800">Issue Identified</h5>
                <p className="leading-7 text-stone-600">{issue.description}</p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowFix(!showFix)}
                    className="flex items-center gap-2 rounded-full border border-orange-200/60 bg-orange-50/80 px-5 py-2.5 text-sm font-bold text-orange-700 transition hover:bg-orange-100/80"
                  >
                    <Wrench className="h-4 w-4" />
                    {showFix ? 'Hide Fix' : 'View Fix'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/80 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100/80"
                  >
                    <Eye className="h-4 w-4" />
                    Visual Preview
                  </motion.button>
                  {impact && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setShowCalculation(!showCalculation)}
                      className="flex items-center gap-2 rounded-full border border-stone-200/60 bg-white/70 px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                    >
                      <Calculator className="h-4 w-4 text-indigo-500" />
                      Show Calculation
                      {showCalculation ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {showCalculation && impact && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 pt-5 border-t border-stone-200/50">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">Calculation Breakdown</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400">Monthly Visitors</p>
                        <p className="font-mono text-sm font-medium text-stone-700">{businessContext.monthlyTraffic.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400">Conversion Rate</p>
                        <p className="font-mono text-sm font-medium text-stone-700">{businessContext.conversionRate}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400">Orders</p>
                        <p className="font-mono text-sm font-medium text-stone-700">{Math.round(potentialOrders).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400">Avg Order Value</p>
                        <p className="font-mono text-sm font-medium text-stone-700">{formatCurrency(businessContext.averageOrderValue)}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 font-mono text-sm">
                      <div className="flex justify-between text-stone-500 mb-1">
                        <span>Potential Revenue:</span>
                        <span className="font-medium text-stone-800">{formatCurrency(potentialRevenue)}</span>
                      </div>
                      <div className="flex justify-between text-stone-500 mb-2 pb-2 border-b border-stone-200/50">
                        <span>{issue.category} Drop:</span>
                        <span className="font-medium text-rose-600">× {(impact.dropoffRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-stone-800 font-bold">
                        <span>Estimated Risk:</span>
                        <span>{formatCurrency(impact.estimatedRisk)} / month</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showFix && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
                  <GlassCard className="p-5" glowColor="rgba(249,115,22,0.1)">
                    <h5 className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-600">Recommendation</h5>
                    <p className="leading-7 text-stone-600">{issue.recommendation}</p>
                  </GlassCard>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-stone-500">
                        <Code2 className="h-4 w-4" /> Code Fix
                      </h5>
                      <span className="rounded-full border border-stone-200/50 bg-stone-50/80 px-3 py-1 text-xs text-stone-500">
                        Suggested implementation
                      </span>
                    </div>
                    <CodeDiffViewer oldCode={issue.code_snippet} newCode={issue.fixed_code} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <VisualPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            issue={issue}
            onApplied={() => setIsApplied(true)}
          />
        </div>
      </GlassCard>
    </motion.article>
  )
}
