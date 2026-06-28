import { useStore } from '../store'
import { calculateIssueImpact, formatCurrency } from '../lib/impact-calculator'
import { GlassCard } from './GlassCard'
import { Bot, Sparkles } from 'lucide-react'

export function ExecutiveSummary() {
  const { audit, businessContext } = useStore()
  const issues = audit?.issues || []

  if (!businessContext.isConfigured || issues.length === 0) return null

  let totalRisk = 0
  const categoryImpact: Record<string, number> = {}

  issues.forEach(issue => {
    const { estimatedRisk } = calculateIssueImpact(issue, businessContext)
    totalRisk += estimatedRisk
    categoryImpact[issue.category] = (categoryImpact[issue.category] || 0) + estimatedRisk
  })

  // Find the top contributing category
  const topCategory = Object.entries(categoryImpact).sort((a, b) => b[1] - a[1])[0]?.[0] || 'UX'

  // Calculate top 3 issues reduction
  const sortedIssues = [...issues].sort((a, b) => {
    return calculateIssueImpact(b, businessContext).estimatedRisk - calculateIssueImpact(a, businessContext).estimatedRisk
  })
  
  const top3Risk = sortedIssues.slice(0, 3).reduce((acc, issue) => acc + calculateIssueImpact(issue, businessContext).estimatedRisk, 0)
  const top3ReductionPct = totalRisk > 0 ? Math.round((top3Risk / totalRisk) * 100) : 0

  return (
    <GlassCard className="p-5 mt-6 border-amber-200/40 bg-gradient-to-r from-amber-50/50 to-orange-50/50" glowColor="rgba(249,115,22,0.1)">
      <div className="flex gap-4">
        <div className="rounded-2xl bg-white/60 p-3 text-orange-500 shadow-sm border border-amber-100/50 h-fit">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-bold text-stone-800">Executive Summary</h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
              <Sparkles className="h-3 w-3" /> Auto-Generated
            </span>
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            "Your website is estimated to be at risk of approximately <strong className="text-stone-800">{formatCurrency(totalRisk)}/month</strong>. 
            The largest contributors are <strong className="text-stone-800 lowercase">{topCategory}</strong> issues. 
            Fixing the top three issues could reduce the estimated revenue risk by around <strong className="text-stone-800">{top3ReductionPct}%</strong>."
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
