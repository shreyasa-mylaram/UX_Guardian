import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, Sparkles, AlertTriangle, Briefcase, Activity, Target, User, Bot } from 'lucide-react'
import { useStore } from '../store'
import { IndustryBenchmarkChart } from './IndustryBenchmarkChart'
import { ExecutiveSummary } from './ExecutiveSummary'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { audit, chatPersona, setChatPersona } = useStore()
  
  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // "Generative AI" Intent Parsing
  const q = query.toLowerCase()
  
  let intent = 'none'
  if (q.includes('business') || q.includes('impact') || q.includes('money') || q.includes('revenue') || q.includes('cost')) {
    intent = 'business_impact'
  } else if (q.includes('benchmark') || q.includes('industry') || q.includes('compare')) {
    intent = 'benchmark'
  } else if (q.includes('accessibility') || q.includes('blind') || q.includes('a11y')) {
    intent = 'accessibility'
  } else if (q.includes('performance') || q.includes('speed') || q.includes('slow')) {
    intent = 'performance'
  } else if (q.includes('executive') || q.includes('dev')) {
    intent = 'persona_switch'
  } else if (q.length > 5) {
    intent = 'chat_fallback'
  }

  const issues = audit?.issues || []
  const a11yIssues = issues.filter(i => i.category.toLowerCase().includes('access'))
  const perfIssues = issues.filter(i => i.category.toLowerCase().includes('perf'))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        
        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-xl"
        >
          {/* Input Area */}
          <div className="flex items-center gap-4 border-b border-white/10 p-4">
            <Sparkles className="h-6 w-6 text-emerald-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask UX Guardian anything... (e.g. 'Show business impact')"
              className="flex-1 bg-transparent text-xl text-white outline-none placeholder:text-slate-500"
            />
            <div className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-400">
              <Command className="h-3 w-3" />
              <span>ESC</span>
            </div>
          </div>
          
          {/* Generative UI Area */}
          <div className="max-h-[60vh] min-h-[150px] overflow-y-auto p-4 flex flex-col">
            {query.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-500 py-8 space-y-4">
                <Search className="h-10 w-10 opacity-20" />
                <p>Start typing to generate UI and insights.</p>
                <div className="flex gap-2 text-xs">
                  <span className="rounded-full bg-white/5 px-3 py-1 cursor-pointer hover:bg-white/10 hover:text-white transition" onClick={() => setQuery('Show business impact')}>"Show business impact"</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 cursor-pointer hover:bg-white/10 hover:text-white transition" onClick={() => setQuery('Compare to industry')}>"Compare to industry"</span>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Generative Renders based on Intent */}
                
                {intent === 'business_impact' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <Briefcase className="h-5 w-5" />
                      <span className="font-semibold">Generating Executive Summary...</span>
                    </div>
                    <ExecutiveSummary />
                  </div>
                )}
                
                {intent === 'benchmark' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold">Rendering Industry Benchmarks...</span>
                    </div>
                    <IndustryBenchmarkChart />
                  </div>
                )}
                
                {intent === 'accessibility' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-400 mb-4">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">Analyzing Accessibility...</span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                      <p className="text-white mb-2">We found <strong className="text-orange-400">{a11yIssues.length}</strong> accessibility issues.</p>
                      {a11yIssues.length > 0 ? (
                        <ul className="list-disc pl-5 text-slate-300 space-y-1">
                          {a11yIssues.slice(0, 3).map(i => <li key={i.id}>{i.title}</li>)}
                          {a11yIssues.length > 3 && <li>...and {a11yIssues.length - 3} more.</li>}
                        </ul>
                      ) : (
                        <p className="text-emerald-400">Great job! No major accessibility issues found.</p>
                      )}
                      <p className="mt-4 text-sm text-slate-400">Tip: Use the Visual Preview 'Empathy Mode' to hear how a screen reader reads your site.</p>
                    </div>
                  </div>
                )}

                {intent === 'performance' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-400 mb-4">
                      <Activity className="h-5 w-5" />
                      <span className="font-semibold">Analyzing Performance...</span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                      <p className="text-white mb-2">We found <strong className="text-rose-400">{perfIssues.length}</strong> performance issues slowing down your site.</p>
                    </div>
                  </div>
                )}
                
                {intent === 'persona_switch' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-4">
                      <User className="h-5 w-5" />
                      <span className="font-semibold">Switching Persona...</span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col gap-4">
                      <p className="text-slate-200">Who would you like the AI to talk to?</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setChatPersona('developer')}
                          className={`px-4 py-2 rounded-lg font-medium transition ${chatPersona === 'developer' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          Developer Mode
                        </button>
                        <button 
                          onClick={() => setChatPersona('ceo')}
                          className={`px-4 py-2 rounded-lg font-medium transition ${chatPersona === 'ceo' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          Executive Mode
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {intent === 'chat_fallback' && (
                  <div className="flex flex-col gap-4 text-slate-300 bg-white/5 p-6 rounded-xl border border-white/5">
                    <div className="flex items-start gap-4">
                      <Bot className="h-6 w-6 text-emerald-400 shrink-0" />
                      <p className="text-lg">I don't have a specific UI widget for that query yet. Try clicking one of these commands to generate a dynamic UI:</p>
                    </div>
                    <div className="flex flex-wrap gap-3 pl-10">
                      <button onClick={() => setQuery('Show business impact')} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition">📊 Executive Summary</button>
                      <button onClick={() => setQuery('Compare to industry')} className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition">🎯 Industry Benchmarks</button>
                      <button onClick={() => setQuery('accessibility')} className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition">👁️ Accessibility Report</button>
                      <button onClick={() => setQuery('performance')} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition">⚡ Performance Report</button>
                    </div>
                  </div>
                )}
                
                {intent === 'none' && query.length > 0 && query.length <= 5 && (
                  <div className="text-slate-500 italic">Typing...</div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
