import React from 'react'

import { CheckSquare, Square, Target } from 'lucide-react'

import { getSeverityRank } from '../lib/audit-utils'
import type { Issue } from '../store'

export function DeveloperChecklist({ issues }: { issues: Issue[] }) {
  const [checked, setChecked] = React.useState<Record<number, boolean>>({})

  const sortedIssues = [...issues].sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity))
  const completedCount = sortedIssues.filter((issue) => checked[issue.id]).length

  const toggle = (id: number) => {
    setChecked((previous) => ({ ...previous, [id]: !previous[id] }))
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/75 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Execution Checklist</p>
            <h3 className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
              <Target className="h-5 w-5 text-orange-300" />
              Today's Fix List
            </h3>
          </div>
          <div className="rounded-2xl border border-orange-400/15 bg-orange-500/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-200/80">Progress</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {completedCount}/{sortedIssues.length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {sortedIssues.map((issue) => {
          const isChecked = Boolean(checked[issue.id])

          return (
            <button
              key={issue.id}
              onClick={() => toggle(issue.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                isChecked
                  ? 'border-emerald-400/15 bg-emerald-500/10 opacity-70'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isChecked ? (
                  <CheckSquare className="h-5 w-5 text-emerald-300" />
                ) : (
                  <Square className="h-5 w-5 text-slate-500" />
                )}
              </div>

              <div className="min-w-0">
                <p className={`font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {issue.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-white/10 px-2 py-1 uppercase tracking-[0.18em]">
                    {issue.severity}
                  </span>
                  {issue.estimated_fix_time && <span>{issue.estimated_fix_time}</span>}
                </div>
              </div>
            </button>
          )
        })}

        {sortedIssues.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm italic text-slate-500">
            No issues to fix yet.
          </div>
        )}
      </div>
    </div>
  )
}
