import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, LogIn, Sparkles } from 'lucide-react'
import { fetchMe, login } from '../lib/api'
import { useStore } from '../store'
import { GlassCard } from './GlassCard'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: storeLogin, setActiveTab } = useStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await login(email, password)
      localStorage.setItem('ux_auth_token', token)
      const user = await fetchMe()
      storeLogin(user, token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="absolute inset-0 max-w-md mx-auto rounded-[32px] bg-gradient-to-br from-orange-200/30 via-amber-100/20 to-yellow-100/20 blur-3xl pointer-events-none" />
        <GlassCard className="relative p-8" glowColor="rgba(249,115,22,0.2)" float>
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-300/40"
            >
              <LogIn className="h-6 w-6" />
            </motion.div>
            <h2 className="text-2xl font-black text-stone-800">Welcome back</h2>
            <p className="mt-2 text-stone-500">Sign in to access your audits.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200/60 bg-red-50/80 p-4 text-sm text-red-700 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-amber-200/50 bg-white/70 p-3.5 text-stone-900 placeholder-stone-400 outline-none backdrop-blur-sm transition focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-amber-200/50 bg-white/70 p-3.5 text-stone-900 placeholder-stone-400 outline-none backdrop-blur-sm transition focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 py-3.5 font-bold text-white shadow-lg shadow-orange-300/40 transition disabled:opacity-70 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-200/50" />
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <div className="flex-1 h-px bg-amber-200/50" />
          </div>

          <p className="mt-4 text-center text-sm text-stone-500">
            Don't have an account?{' '}
            <button onClick={() => setActiveTab('register')} className="font-bold text-orange-600 hover:underline">
              Register here
            </button>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  )
}
