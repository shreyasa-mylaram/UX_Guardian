import type { ReactNode } from 'react'
import { Download, ExternalLink, History, LayoutDashboard, LogOut, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore, type AuditData } from '../store'

interface DashboardLayoutProps {
  audit: AuditData | null
  children: ReactNode
  onDownloadPDF: () => void
}

export function DashboardLayout({ audit, children, onDownloadPDF }: DashboardLayoutProps) {
  const { token, logout, setActiveTab, setAudit } = useStore()
  const showActions = audit?.status === 'completed'

  return (
    <div className="min-h-screen text-stone-900 relative">
      {/* Glassmorphism navbar */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-amber-200/40 shadow-sm">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-6 py-3.5 md:px-8">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 p-2.5 shadow-lg shadow-orange-300/40"
              >
                <LayoutDashboard className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-400/70">
                  Conversational UX Auditor
                </p>
                <h1 className="text-xl font-black tracking-tight text-stone-800">
                  UX <span className="gradient-text">Guardian</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {token && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setAudit(null); setActiveTab('dashboard') }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200/60 bg-white/60 px-3.5 py-2 text-sm font-medium text-stone-700 backdrop-blur-sm transition hover:border-orange-300 hover:bg-orange-50/80"
                  >
                    <Plus className="h-3.5 w-3.5 text-orange-500" /> New Scan
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('history')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200/60 bg-white/60 px-3.5 py-2 text-sm font-medium text-stone-700 backdrop-blur-sm transition hover:border-orange-300 hover:bg-orange-50/80"
                  >
                    <History className="h-3.5 w-3.5 text-amber-500" /> History
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => logout()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/60 bg-white/50 px-3.5 py-2 text-sm font-medium text-rose-600 backdrop-blur-sm transition hover:bg-rose-50/80"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </motion.button>
                </>
              )}
              {showActions && audit && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={onDownloadPDF}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200/60 bg-white/60 px-3.5 py-2 text-sm font-medium text-stone-700 backdrop-blur-sm transition hover:bg-orange-50/80"
                  >
                    <Download className="h-3.5 w-3.5 text-orange-500" /> PDF
                  </motion.button>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    href={audit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-300/40 transition hover:shadow-orange-400/50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Site
                  </motion.a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-6 py-8 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  )
}
