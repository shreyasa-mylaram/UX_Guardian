import { useEffect, useState } from 'react'
import { fetchAuditHistory } from '../lib/api'
import { AuditData, useStore } from '../store'
import { Clock, ExternalLink } from 'lucide-react'

export function HistoryView() {
  const [history, setHistory] = useState<AuditData[]>([])
  const [loading, setLoading] = useState(true)
  const { setActiveTab, setAudit } = useStore()

  useEffect(() => {
    fetchAuditHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleOpenAudit = (audit: AuditData) => {
    setAudit(audit)
    setActiveTab('dashboard')
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500/30 border-t-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Your Audit History</h2>
        <p className="mt-2 text-slate-400">Review your past website scans and their overall scores.</p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
        {history.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Clock className="mx-auto mb-4 h-10 w-10 opacity-50" />
            <p>You haven't run any audits yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/[0.02] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Website URL</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Score</th>
                <th className="px-6 py-4 text-right font-semibold tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-slate-200">{item.url}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.overall_score !== null ? (
                      <span className="font-bold text-white">{item.overall_score}/100</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenAudit(item)}
                      className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300"
                    >
                      View Report
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
