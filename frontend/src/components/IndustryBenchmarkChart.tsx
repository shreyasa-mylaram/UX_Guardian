import { useStore } from '../store'
import { INDUSTRY_BENCHMARKS, calculateCategoryScores, formatCurrency } from '../lib/impact-calculator'
import { GlassCard } from './GlassCard'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import { Target, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function IndustryBenchmarkChart() {
  const { audit, businessContext } = useStore()
  const issues = audit?.issues || []
  
  if (!businessContext.isConfigured || !businessContext.industry || !INDUSTRY_BENCHMARKS[businessContext.industry]) {
    return null
  }

  const industry = businessContext.industry
  const benchmarks = INDUSTRY_BENCHMARKS[industry]
  const userScores = calculateCategoryScores(issues)
  
  // Calculate average scores across the 4 categories
  const avgUserScore = Object.values(userScores).reduce((a: number, b: number) => a + b, 0) / 4
  const avgIndustryScore = Object.values(benchmarks).reduce((a: number, b: any) => a + b.average, 0) / 4
  
  // Calculate gap financial impact (naive but illustrative model for the hackathon)
  // E.g., for every point below average, we assume 0.25% drop in potential revenue
  const pointGap = avgUserScore - avgIndustryScore
  const potentialRevenue = businessContext.monthlyTraffic * (businessContext.conversionRate / 100) * businessContext.averageOrderValue
  
  // If negative gap, calculate lost revenue. If positive, calculate "gained" vs average.
  const gapImpactValue = Math.abs(pointGap) * 0.0025 * potentialRevenue

  const chartData = [
    { category: 'Accessibility', user: userScores['Accessibility'], average: benchmarks['Accessibility'].average, top10: benchmarks['Accessibility'].top10 },
    { category: 'UX', user: userScores['UX'], average: benchmarks['UX'].average, top10: benchmarks['UX'].top10 },
    { category: 'SEO', user: userScores['SEO'], average: benchmarks['SEO'].average, top10: benchmarks['SEO'].top10 },
    { category: 'Performance', user: userScores['Performance'], average: benchmarks['Performance'].average, top10: benchmarks['Performance'].top10 },
  ]

  return (
    <GlassCard className="mt-6 p-6 overflow-hidden border-indigo-200/50 bg-gradient-to-br from-indigo-50/40 to-white/60" glowColor="rgba(99,102,241,0.1)">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500/80 flex items-center gap-2">
            <Target className="h-4 w-4" /> Competitive Positioning
          </p>
          <h3 className="mt-1.5 text-2xl font-black text-stone-800">Your Industry: {industry}</h3>
        </div>
        
        <div className={`rounded-xl border p-3 flex flex-col items-end ${pointGap >= 0 ? 'bg-emerald-50/80 border-emerald-200/50 text-emerald-700' : 'bg-rose-50/80 border-rose-200/50 text-rose-700'}`}>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
            {pointGap >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {pointGap >= 0 ? 'Outperforming Avg' : 'Below Avg'}
          </div>
          <div className="text-lg font-black leading-none">
            {pointGap >= 0 ? '+' : ''}{pointGap.toFixed(1)} pts
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-8">
        {/* Radar Chart */}
        <div className="h-[320px] bg-white/40 rounded-3xl border border-white/60 shadow-[inset_0_2px_12px_rgba(0,0,0,0.02)]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(168,162,158,0.2)" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#57534e', fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              <Radar name="Top 10% (Best in Class)" dataKey="top10" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
              <Radar name="Industry Avg" dataKey="average" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Your Site" dataKey="user" stroke="#f97316" fill="#f97316" fillOpacity={0.5} strokeWidth={3} />
              
              <Tooltip 
                contentStyle={{ borderRadius: 16, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Gap Analysis */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="rounded-2xl border border-stone-200/60 bg-white/80 p-5 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4">Financial Gap Analysis</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-stone-100 pb-3">
                <div>
                  <p className="text-xs text-stone-500 font-medium">Your Overall Score</p>
                  <p className="text-2xl font-black text-stone-800">{Math.round(avgUserScore)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500 font-medium">Industry Average</p>
                  <p className="text-2xl font-black text-indigo-600">{Math.round(avgIndustryScore)}</p>
                </div>
              </div>
              
              <div className={`rounded-xl p-4 border ${pointGap >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${pointGap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {pointGap >= 0 ? 'Value Gained vs Avg' : 'Revenue Lost vs Avg'}
                  </span>
                  {pointGap >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-rose-600" />}
                </div>
                <p className={`text-3xl font-black tracking-tight ${pointGap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(gapImpactValue)} <span className="text-sm font-semibold opacity-70">/ mo</span>
                </p>
                {pointGap < 0 && (
                  <p className="mt-2 text-[11px] font-medium text-rose-600/80 leading-relaxed">
                    Closing the {Math.abs(pointGap).toFixed(1)} point gap to reach the industry average could save you roughly {formatCurrency(gapImpactValue * 12)} per year.
                  </p>
                )}
                {pointGap >= 0 && (
                  <p className="mt-2 text-[11px] font-medium text-emerald-600/80 leading-relaxed">
                    Your superior UX is capturing roughly {formatCurrency(gapImpactValue * 12)} more per year than an average {industry} site.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-stone-200/60 bg-white/80 p-5 shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3">Strategic Recommendation</h4>
            {pointGap < 0 ? (
              <p className="text-sm text-stone-600 leading-relaxed">
                You are currently losing ground to competitors. Attack the category with the largest gap first (see radar chart) to maximize your ROI.
              </p>
            ) : (
              <p className="text-sm text-stone-600 leading-relaxed">
                You are outperforming the industry average. Your next milestone is to reach the <strong className="text-amber-500">Best-in-Class (Top 10%)</strong> benchmark to establish absolute market leadership.
              </p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
