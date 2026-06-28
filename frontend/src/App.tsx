import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquareText } from 'lucide-react'

import { AuditForm } from './components/AuditForm'
import { CommandPalette } from './components/CommandPalette'
import { ChatWidget } from './components/ChatWidget'
import { DashboardLayout } from './components/DashboardLayout'
import { DeveloperChecklist } from './components/DeveloperChecklist'
import { IssueCard } from './components/IssueCard'
import { LandingPage } from './components/LandingPage'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { HistoryView } from './components/HistoryView'
import { ScanProgress } from './components/ScanProgress'
import { ScoreDashboard } from './components/ScoreDashboard'
import { fetchAudit, downloadAuditExport, fetchMe, createAudit } from './lib/api'
import { useStore } from './store'

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

function App() {
  const { audit, setAudit, loading, setLoading, scanStep, activeTab, token, login, logout, resetChatForAudit, setScanStep } = useStore()
  const [url, setUrl] = useState('')
  const [showLanding, setShowLanding] = useState(true)
  const issues = audit?.issues ?? []
  const urgentIssues = issues.filter((issue) => ['critical', 'high'].includes(issue.severity.toLowerCase())).length

  useEffect(() => {
    if (token) {
      fetchMe().then(user => {
        login(user, token)
      }).catch(() => {
        logout()
      })
    }
  }, [token, login, logout])

  useEffect(() => {
    if (audit?.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const updatedAudit = await fetchAudit(audit.id)
          if (updatedAudit.status === 'completed' || updatedAudit.status === 'failed') {
            setAudit(updatedAudit)
            setLoading(false)
            setScanStep(7)
          }
        } catch (error) {
          console.error('Failed to fetch audit status:', error)
        }
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [audit?.id, audit?.status, setAudit, setLoading, setScanStep])

  const handleDownloadPDF = async () => {
    if (audit?.id) {
      try {
        await downloadAuditExport(audit.id)
      } catch (e) {
        console.error(e)
        alert('Failed to download PDF')
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!url) return
    setLoading(true)
    setScanStep(0)
    
    const stepInterval = window.setInterval(() => {
      setScanStep((prev) => (prev >= 6 ? 6 : prev + 1))
    }, 1500)

    try {
      const createdAudit = await createAudit(url)
      setAudit(createdAudit)
      resetChatForAudit(createdAudit.id)
      resetChatForAudit(createdAudit.id)
    } catch (error) {
      console.error(error)
      setLoading(false)
      window.clearInterval(stepInterval)
    }
  }

  const renderContent = () => {
    if (activeTab === 'login') return <LoginForm />
    if (activeTab === 'register') return <RegisterForm />
    if (activeTab === 'history') return <HistoryView />
    
    // Dashboard logic below
    if (!audit && !loading) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center">
          <AuditForm url={url} loading={loading} onUrlChange={setUrl} onSubmit={handleSubmit} />
        </div>
      )
    }

    if (loading || audit?.status === 'running') {
      return (
        <div className="flex min-h-[70vh] items-center justify-center">
          <ScanProgress stepIndex={scanStep} />
        </div>
      )
    }

    if (audit?.status === 'failed') {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="glass rounded-3xl p-8 text-center border-red-200/50">
            <h2 className="mb-2 text-xl font-black text-red-600">Scan Failed</h2>
            <p className="text-stone-500">There was an error scanning the URL. Please try again.</p>
            <button 
              onClick={() => { setAudit(null); setLoading(false); }}
              className="mt-6 rounded-2xl border border-red-200/60 bg-red-50/80 px-6 py-2.5 font-semibold text-red-600 hover:bg-red-100/80 transition"
            >
              Start New Scan
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="grid gap-8 xl:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="space-y-6 xl:col-span-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <ScoreDashboard overall={audit!.overall_score} issues={issues} />
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="glass rounded-[28px] p-6 shadow-xl"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400/70">Issue Explorer</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-stone-800">
                  Review findings & ship fixes faster
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-200/50 bg-white/60 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Total Findings</p>
                  <p className="mt-2 text-3xl font-black text-stone-800">{issues.length}</p>
                </div>
                <div className="rounded-2xl border border-orange-200/50 bg-orange-50/60 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-orange-600/80">Urgent Fixes</p>
                  <p className="mt-2 text-3xl font-black text-stone-800">{urgentIssues}</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-5">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
            {issues.length === 0 && (
              <div className="glass rounded-[28px] p-10 text-center text-stone-500 shadow-xl">
                No issues were returned for this audit.
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="sticky top-24 space-y-6">
            <DeveloperChecklist issues={issues} />
            <div className="glass rounded-[28px] p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-gradient-to-r from-orange-100 to-amber-100 p-3 text-orange-500">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-400/70">AI Workflow</p>
                  <h4 className="mt-2 text-xl font-black text-stone-800">Use the assistant to plan fixes</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ChatWidget />
      </div>
    )
  }

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />
  }

  return (
    <>
      <CommandPalette />
      <DashboardLayout audit={audit} onDownloadPDF={handleDownloadPDF}>
        {renderContent()}
      </DashboardLayout>
    </>
  )
}

export default App
