import React from 'react'
import { useStore } from './store'
import { Activity, AlertTriangle, CheckCircle, Search, Code, LayoutDashboard } from 'lucide-react'

function App() {
  const { audit, loading, setAudit, setLoading } = useStore()
  const [url, setUrl] = React.useState('')
  const [polling, setPolling] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setLoading(true)
    
    try {
      const res = await fetch('http://localhost:8000/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      setAudit(data)
      setPolling(true)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!polling || !audit?.audit_id) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/audits/${audit.audit_id}`)
        if (res.ok) {
          const data = await res.json()
          setAudit({ ...data.audit, issues: data.issues })
          if (data.audit.status === 'completed' || data.audit.status === 'failed') {
            setPolling(false)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [polling, audit?.audit_id, setAudit, setLoading])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            UX Guardian
          </h1>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {!audit ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Audit. Understand. Fix. <br/>
                <span className="text-indigo-400">Deliver Better Experiences.</span>
              </h2>
              <p className="text-slate-400 text-lg">
                Enter any website URL to automatically run accessibility, UX, and SEO audits powered by AI. Get conversational explanations and developer-ready code fixes.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-100"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  'Run Audit'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Audit Results for <span className="text-indigo-400">{audit.url}</span></h2>
                  <p className="text-slate-400">Status: {audit.status.toUpperCase()}</p>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-indigo-400 bg-indigo-950/50 px-4 py-2 rounded-full border border-indigo-900">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">AI Reasoning Engine Running...</span>
                  </div>
                )}
             </div>

             {audit.status === 'completed' && (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
                      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Overall Score</span>
                      <span className={`text-5xl font-black ${audit.overall_score && audit.overall_score >= 80 ? 'text-emerald-400' : audit.overall_score && audit.overall_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {audit.overall_score ?? '--'}
                      </span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 col-span-3">
                      <h3 className="text-lg font-semibold mb-4">Found Issues</h3>
                      <div className="flex gap-4">
                        {['critical', 'high', 'medium', 'low'].map(sev => {
                          const count = audit.issues?.filter(i => i.severity === sev).length || 0
                          const color = sev === 'critical' ? 'text-red-400 bg-red-950/30' : sev === 'high' ? 'text-orange-400 bg-orange-950/30' : sev === 'medium' ? 'text-amber-400 bg-amber-950/30' : 'text-blue-400 bg-blue-950/30'
                          return (
                            <div key={sev} className={`flex-1 rounded-lg p-4 border border-slate-800 ${color} flex items-center justify-between`}>
                              <span className="capitalize font-medium">{sev}</span>
                              <span className="text-2xl font-bold">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6 mt-8">
                   <h3 className="text-xl font-semibold">Detailed AI Analysis & Fixes</h3>
                   {audit.issues?.map(issue => (
                     <div key={issue.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="border-b border-slate-800 p-5 bg-slate-900/50 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-semibold uppercase rounded ${
                                issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {issue.severity}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium uppercase rounded bg-slate-800 text-slate-300">
                                {issue.category}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-100">{issue.title}</h4>
                          </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                             <h5 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">AI Explanation</h5>
                             <p className="text-slate-300 leading-relaxed">{issue.description}</p>
                             
                             <h5 className="text-sm font-semibold text-slate-400 mt-6 mb-2 uppercase tracking-wider">Recommendation</h5>
                             <p className="text-slate-300 leading-relaxed bg-indigo-950/30 p-4 rounded-lg border border-indigo-900/50">{issue.recommendation}</p>
                           </div>
                           
                           {issue.fixed_code && (
                             <div>
                               <h5 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                 <Code className="w-4 h-4"/> Suggested Code Fix
                               </h5>
                               <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm border border-slate-800 overflow-x-auto">
                                 {issue.code_snippet && (
                                    <div className="mb-4">
                                      <span className="text-red-400 block mb-1 text-xs">Current (Before)</span>
                                      <pre className="text-slate-500 line-through"><code>{issue.code_snippet}</code></pre>
                                    </div>
                                 )}
                                 <div>
                                    <span className="text-emerald-400 block mb-1 text-xs">Recommended (After)</span>
                                    <pre className="text-emerald-300"><code>{issue.fixed_code}</code></pre>
                                 </div>
                               </div>
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                   {audit.issues?.length === 0 && (
                     <div className="text-center p-12 bg-slate-900 rounded-xl border border-slate-800">
                       <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                       <h3 className="text-xl font-bold">No issues found!</h3>
                       <p className="text-slate-400 mt-2">This page looks great according to our AI reasoning engine.</p>
                     </div>
                   )}
                 </div>
               </>
             )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
