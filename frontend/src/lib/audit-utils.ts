import type { Issue } from '../store'

export const ISSUE_CATEGORY_ORDER = ['Accessibility', 'UX', 'SEO'] as const

export function normalizeCategory(rawCategory: string | null | undefined) {
  const category = (rawCategory ?? '').trim().toLowerCase()

  if (!category) {
    return 'UX'
  }

  if (
    category.includes('access') ||
    category.includes('wcag') ||
    category.includes('aria') ||
    category.includes('a11y')
  ) {
    return 'Accessibility'
  }

  if (
    category.includes('seo') ||
    category.includes('search') ||
    category.includes('meta') ||
    category.includes('schema')
  ) {
    return 'SEO'
  }

  return 'UX'
}

export function getIssueBreakdown(issues: Issue[]) {
  const counts = {
    Accessibility: 0,
    UX: 0,
    SEO: 0,
  }

  issues.forEach((issue) => {
    counts[normalizeCategory(issue.category)] += 1
  })

  return [
    { name: 'Accessibility', shortName: 'A11y', count: counts.Accessibility, fill: '#34d399' },
    { name: 'UX', shortName: 'UX', count: counts.UX, fill: '#818cf8' },
    { name: 'SEO', shortName: 'SEO', count: counts.SEO, fill: '#f472b6' },
  ]
}

export function getSeverityRank(severity: string) {
  const rank: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  return rank[severity.toLowerCase()] ?? 0
}

export function getPriorityIssues(issues: Issue[], limit = 3) {
  return [...issues]
    .sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity))
    .slice(0, limit)
}
