import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, CheckCircle2, Settings2, TrendingDown, Sparkles } from 'lucide-react'
import { INDUSTRY_PRESETS, type BusinessContext } from '../lib/impact-calculator'
import { useStore } from '../store'
import { GlassCard } from './GlassCard'

export function BusinessImpactForm() {
  const { businessContext, setBusinessContext, audit } = useStore()
  
  const detectedIndustry = audit?.industry || 'E-commerce'
  
  const [localContext, setLocalContext] = useState<Omit<BusinessContext, 'isConfigured'>>({
    industry: businessContext.isConfigured ? businessContext.industry : detectedIndustry,
    monthlyTraffic: businessContext.monthlyTraffic,
    conversionRate: businessContext.conversionRate,
    averageOrderValue: businessContext.averageOrderValue,
  })

  // Auto-apply preset when industry is detected from backend
  useEffect(() => {
    if (!businessContext.isConfigured && audit?.industry) {
      const preset = INDUSTRY_PRESETS[audit.industry] || INDUSTRY_PRESETS['General'] || INDUSTRY_PRESETS['E-commerce']
      setLocalContext({ ...preset, industry: audit.industry })
      setBusinessContext({ ...preset, industry: audit.industry, isConfigured: true })
    }
  }, [audit?.industry, businessContext.isConfigured, setBusinessContext])

  const [isExpanded, setIsExpanded] = useState(!businessContext.isConfigured)



  const handleSave = () => {
    setBusinessContext({ ...localContext, isConfigured: true })
    setIsExpanded(false)
  }

  if (!isExpanded && businessContext.isConfigured) {
    return (
      <GlassCard className="p-4 flex items-center justify-between" glowColor="rgba(249,115,22,0.1)">
        <div className="flex items-center gap-3 text-sm">
          <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="font-medium text-stone-800">Business Model Configured:</span>
          <span className="text-stone-500">
            {businessContext.industry || 'Custom'} ({businessContext.monthlyTraffic.toLocaleString()} visits, {businessContext.conversionRate}%, ${businessContext.averageOrderValue})
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs font-semibold uppercase tracking-wider text-orange-600 hover:text-orange-700"
        >
          Edit Configuration
        </button>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 overflow-hidden" glowColor="rgba(249,115,22,0.15)">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 p-3 text-orange-600 shadow-inner">
          <TrendingDown className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-stone-800">Configure Business Impact</h3>
          <p className="mt-1 text-sm text-stone-500">
            Select your industry to see realistic estimates for how much revenue these issues are risking.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-orange-200/50 bg-orange-50/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <Sparkles className="h-4 w-4" /> AI Industry Detection
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Based on our visual and DOM analysis, this website is categorized as <strong className="text-stone-900">{localContext.industry}</strong>. The baseline metrics below have been automatically tailored for this sector.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Monthly Traffic</span>
            <div className="relative">
              <input
                type="number"
                value={localContext.monthlyTraffic}
                onChange={(e) => setLocalContext({ ...localContext, monthlyTraffic: Number(e.target.value), industry: 'Custom' })}
                className="w-full rounded-xl border border-stone-200/60 bg-white/50 px-3 py-2.5 pl-3 text-sm text-stone-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Avg. Conv. Rate (%)</span>
            <input
              type="number"
              step="0.1"
              value={localContext.conversionRate}
              onChange={(e) => setLocalContext({ ...localContext, conversionRate: Number(e.target.value), industry: 'Custom' })}
              className="w-full rounded-xl border border-stone-200/60 bg-white/50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Avg. Order Value ($)</span>
            <input
              type="number"
              value={localContext.averageOrderValue}
              onChange={(e) => setLocalContext({ ...localContext, averageOrderValue: Number(e.target.value), industry: 'Custom' })}
              className="w-full rounded-xl border border-stone-200/60 bg-white/50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-stone-200/50 pt-5">
          <p className="text-xs text-stone-400 flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Illustrative estimates based on our proprietary model
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-stone-800"
          >
            Calculate Impact <Calculator className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </GlassCard>
  )
}
