import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Issue } from '../store'
import { useStore } from '../store'
import { applyIssueFix, API_BASE_URL } from '../lib/api'
import { speechEngine, generateScreenReaderScript } from '../lib/speech'
import { Eye, EyeOff, Ear, CheckCircle, Volume2 } from 'lucide-react'

interface VisualPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  issue: Issue
  onApplied: () => void
}

export function VisualPreviewModal({ isOpen, onClose, issue, onApplied }: VisualPreviewModalProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [isEmpathyMode, setIsEmpathyMode] = useState(false)
  const [empathyPhase, setEmpathyPhase] = useState<'broken' | 'fixed'>('broken')
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  
  const { audit } = useStore()
  const allIssues = audit?.issues || []

  // Handle closing modal
  const handleClose = () => {
    setIsEmpathyMode(false)
    speechEngine.stop()
    onClose()
  }

  // Handle speech logic
  useEffect(() => {
    if (!isEmpathyMode || !isOpen) {
      speechEngine.stop()
      setCurrentSubtitle('')
      return
    }

    const script = generateScreenReaderScript(allIssues, empathyPhase === 'fixed')
    
    // Play the script sequentially with fake subtitles
    let cancelled = false
    let currentIndex = 0

    const playNext = () => {
      if (cancelled || currentIndex >= script.length) {
        setCurrentSubtitle(empathyPhase === 'fixed' ? 'End of accessible document.' : 'End of inaccessible document.')
        return
      }

      const phrase = script[currentIndex]
      setCurrentSubtitle(phrase.text)
      
      speechEngine.speak(phrase.text, () => {
        currentIndex++
        if (!cancelled) {
          playNext()
        }
      })
    }

    // Start playing
    playNext()

    return () => {
      cancelled = true
      speechEngine.stop()
    }
  }, [isEmpathyMode, isOpen, empathyPhase, allIssues])

  if (!isOpen) return null

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await applyIssueFix(issue.audit_id!, issue.id!)
      onApplied()
      onClose()
    } catch (e) {
      console.error('Failed to apply fix', e)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">Visual Preview</h3>
                <button
                  onClick={() => {
                    setIsEmpathyMode(!isEmpathyMode)
                    if (!isEmpathyMode) setEmpathyPhase('broken')
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                    isEmpathyMode 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isEmpathyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {isEmpathyMode ? 'Empathy Mode Active' : 'Empathy Mode'}
                </button>
              </div>
              <p className="mt-1 text-slate-400">Review changes before applying them to your codebase.</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full bg-white/5 p-3 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 overflow-y-auto p-6 min-h-[550px]">
            {isEmpathyMode ? (
              <div className="absolute inset-4 z-10 flex flex-col items-center justify-center rounded-2xl bg-black">
                <div className="flex flex-col items-center max-w-2xl text-center space-y-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 shadow-[0_0_40px_rgba(249,115,22,0.2)] border border-orange-500/20"
                  >
                    <Ear className="h-10 w-10 text-orange-400 animate-pulse" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-orange-500/70">
                      {empathyPhase === 'broken' ? 'Simulating Screen Reader (Broken)' : 'Simulating Screen Reader (Fixed)'}
                    </p>
                    <p className="text-3xl font-black text-white leading-tight">
                      This is what a blind user experiences.
                    </p>
                  </div>

                  <div className="h-24 w-full bg-slate-900/50 rounded-2xl border border-white/5 p-6 flex items-center justify-center relative overflow-hidden">
                    <Volume2 className="absolute left-6 h-5 w-5 text-slate-600" />
                    <p className={`text-xl font-medium tracking-wide ${empathyPhase === 'fixed' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      "{currentSubtitle}"
                    </p>
                  </div>
                  
                  {empathyPhase === 'broken' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2 }}
                      onClick={() => setEmpathyPhase('fixed')}
                      className="mt-8 flex items-center gap-3 rounded-xl bg-emerald-500 px-8 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] transition hover:scale-105 active:scale-95"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Apply Semantic Fixes
                    </motion.button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
              {/* Before */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-300">Original (Before)</h4>
                </div>
                <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-white">
                  <iframe 
                    title="Original Code Preview"
                    src={`${API_BASE_URL}/api/audits/${issue.audit_id}/issues/${issue.id}/preview/original`}
                    className="h-[500px] w-full bg-white"
                  />
                </div>
              </div>

              {/* After */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-emerald-400">Fixed (After)</h4>
                </div>
                <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-white shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <iframe 
                    title="Fixed Code Preview"
                    src={`${API_BASE_URL}/api/audits/${issue.audit_id}/issues/${issue.id}/preview/fixed`}
                    className="h-[500px] w-full bg-white"
                  />
                </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/50 p-6">
            <div className="text-sm text-slate-400">
              Applying this fix will update its status in your local database tracking history.
            </div>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
            >
              {isApplying ? (
                <span className="flex items-center gap-2">Applying...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Apply Fix to DB
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
