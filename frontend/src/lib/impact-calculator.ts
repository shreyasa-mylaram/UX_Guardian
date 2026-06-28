import type { Issue } from '../store'
import { normalizeCategory } from './audit-utils'

export interface BusinessContext {
  industry: string
  monthlyTraffic: number
  conversionRate: number
  averageOrderValue: number
  isConfigured: boolean
}

export const INDUSTRY_PRESETS: Record<string, Omit<BusinessContext, 'isConfigured'>> = {
  'E-commerce': { industry: 'E-commerce', monthlyTraffic: 100000, conversionRate: 2.5, averageOrderValue: 75 },
  'SaaS':       { industry: 'SaaS',       monthlyTraffic: 30000,  conversionRate: 4.0, averageOrderValue: 150 },
  'Banking':    { industry: 'Banking',    monthlyTraffic: 60000,  conversionRate: 1.8, averageOrderValue: 350 },
  'Healthcare': { industry: 'Healthcare', monthlyTraffic: 40000,  conversionRate: 3.0, averageOrderValue: 120 },
  'Education':  { industry: 'Education',  monthlyTraffic: 80000,  conversionRate: 5.0, averageOrderValue: 20 },
  'Media':      { industry: 'Media',      monthlyTraffic: 500000, conversionRate: 0.8, averageOrderValue: 10 },
  'Portfolio':  { industry: 'Portfolio',  monthlyTraffic: 8000,   conversionRate: 1.0, averageOrderValue: 0 },
}

export type CategoryBenchmark = {
  average: number
  top10: number
}

export const INDUSTRY_BENCHMARKS: Record<string, Record<string, CategoryBenchmark>> = {
  'E-commerce': {
    'Accessibility': { average: 85, top10: 95 },
    'SEO':           { average: 90, top10: 98 },
    'Performance':   { average: 75, top10: 92 },
    'UX':            { average: 82, top10: 94 },
  },
  'SaaS': {
    'Accessibility': { average: 88, top10: 96 },
    'SEO':           { average: 85, top10: 95 },
    'Performance':   { average: 85, top10: 95 },
    'UX':            { average: 92, top10: 98 },
  },
  'Banking': {
    'Accessibility': { average: 95, top10: 99 },
    'SEO':           { average: 80, top10: 90 },
    'Performance':   { average: 85, top10: 95 },
    'UX':            { average: 78, top10: 90 },
  },
  'Healthcare': {
    'Accessibility': { average: 92, top10: 98 },
    'SEO':           { average: 75, top10: 88 },
    'Performance':   { average: 80, top10: 92 },
    'UX':            { average: 85, top10: 95 },
  },
  'Education': {
    'Accessibility': { average: 90, top10: 96 },
    'SEO':           { average: 85, top10: 94 },
    'Performance':   { average: 70, top10: 85 },
    'UX':            { average: 75, top10: 88 },
  },
  'Media': {
    'Accessibility': { average: 82, top10: 92 },
    'SEO':           { average: 95, top10: 99 },
    'Performance':   { average: 75, top10: 88 },
    'UX':            { average: 85, top10: 95 },
  },
  'Portfolio': {
    'Accessibility': { average: 75, top10: 90 },
    'SEO':           { average: 70, top10: 85 },
    'Performance':   { average: 90, top10: 98 },
    'UX':            { average: 88, top10: 96 },
  }
}

const IMPACT_MATRIX: Record<string, Record<string, number>> = {
  'Accessibility': { critical: 0.025, high: 0.015, medium: 0.008, low: 0.002 },
  'SEO':           { critical: 0.030, high: 0.020, medium: 0.010, low: 0.003 },
  'Performance':   { critical: 0.040, high: 0.025, medium: 0.010, low: 0.005 },
  'UX':            { critical: 0.030, high: 0.020, medium: 0.010, low: 0.005 },
}

export function getDropoffPercentage(issue: Issue): number {
  const category = normalizeCategory(issue.category)
  const severity = issue.severity.toLowerCase()
  
  // Default to UX if category doesn't match matrix exactly
  const matrixCategory = IMPACT_MATRIX[category] ? category : 'UX'
  const dropoff = IMPACT_MATRIX[matrixCategory][severity] ?? 0.005
  return dropoff
}

export interface IssueImpactCalculation {
  dropoffRate: number
  estimatedRisk: number
  confidence: number
  fixPriority: 'High' | 'Medium' | 'Low'
}

export function calculateIssueImpact(issue: Issue, context: BusinessContext): IssueImpactCalculation {
  const dropoffRate = getDropoffPercentage(issue)
  
  const potentialOrders = context.monthlyTraffic * (context.conversionRate / 100)
  const potentialRevenue = potentialOrders * context.averageOrderValue
  const estimatedRisk = potentialRevenue * dropoffRate

  // Confidence based on severity
  const severity = issue.severity.toLowerCase()
  let confidence = 88
  if (severity === 'critical') confidence = 96
  else if (severity === 'high') confidence = 92
  else if (severity === 'medium') confidence = 89
  
  // Adjust confidence slightly based on category
  const category = normalizeCategory(issue.category)
  if (category === 'Accessibility') confidence += 2 // A11y is usually more deterministic
  
  // Fix Priority (Impact + Effort)
  let fixPriority: 'High' | 'Medium' | 'Low' = 'Low'
  const isQuickWin = issue.estimated_fix_time?.toLowerCase().includes('min')
  
  if (severity === 'critical' || (severity === 'high' && isQuickWin)) {
    fixPriority = 'High'
  } else if (severity === 'high' || (severity === 'medium' && isQuickWin)) {
    fixPriority = 'Medium'
  }

  return {
    dropoffRate,
    estimatedRisk,
    confidence,
    fixPriority
  }
}

export function calculateCategoryScores(issues: Issue[]): Record<string, number> {
  // Start with 100 for each category
  const scores: Record<string, number> = {
    'Accessibility': 100,
    'SEO': 100,
    'Performance': 100,
    'UX': 100
  }
  
  // Deduct points based on severity
  issues.forEach(issue => {
    const category = normalizeCategory(issue.category)
    const cat = scores[category] !== undefined ? category : 'UX'
    
    const severity = issue.severity.toLowerCase()
    let deduction = 2
    if (severity === 'critical') deduction = 15
    else if (severity === 'high') deduction = 8
    else if (severity === 'medium') deduction = 4
    
    scores[cat] = Math.max(0, scores[cat] - deduction)
  })
  
  return scores
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0'
  if (amount >= 1000) {
    return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
