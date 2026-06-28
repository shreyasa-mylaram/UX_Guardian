import { create } from 'zustand'
import type { BusinessContext } from './lib/impact-calculator'

export interface Issue {
  id: number
  audit_id?: number
  category: string
  severity: string
  title: string
  description: string
  recommendation: string
  selector: string
  code_snippet: string
  fixed_code: string
  business_impact: string
  confidence_score?: number
  estimated_fix_time?: string
  is_applied?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface User {
  id: number
  email: string
}

export interface AuditData {
  id: number
  url: string
  status: string
  overall_score: number | null
  issues?: Issue[]
}

type StepUpdater = number | ((previous: number) => number)

interface AppState {
  user: User | null
  token: string | null
  activeTab: 'login' | 'register' | 'dashboard' | 'history'
  audit: AuditData | null
  loading: boolean
  scanStep: number
  chatOpen: boolean
  chatInput: string
  chatMessages: ChatMessage[]
  chatPending: boolean
  chatPersona: 'developer' | 'ceo'
  activeChatAuditId: number | null
  businessContext: BusinessContext
  login: (user: User, token: string) => void
  logout: () => void
  setActiveTab: (tab: 'login' | 'register' | 'dashboard' | 'history') => void
  setAudit: (audit: AuditData | null) => void
  setLoading: (loading: boolean) => void
  setScanStep: (step: StepUpdater) => void
  setChatOpen: (open: boolean) => void
  setChatInput: (input: string) => void
  setChatMessages: (messages: ChatMessage[]) => void
  addChatMessage: (message: ChatMessage) => void
  setChatPending: (pending: boolean) => void
  setChatPersona: (persona: 'developer' | 'ceo') => void
  setActiveChatAuditId: (auditId: number | null) => void
  resetChatForAudit: (auditId: number) => void
  setBusinessContext: (ctx: Partial<BusinessContext>) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('ux_auth_token'),
  activeTab: localStorage.getItem('ux_auth_token') ? 'dashboard' : 'login',
  audit: null,
  loading: false,
  scanStep: 0,
  chatOpen: false,
  chatInput: '',
  chatMessages: [],
  chatPending: false,
  chatPersona: 'developer',
  activeChatAuditId: null,
  businessContext: {
    industry: '',
    monthlyTraffic: 100000,
    conversionRate: 2.5,
    averageOrderValue: 50,
    isConfigured: false
  },
  login: (user, token) => {
    localStorage.setItem('ux_auth_token', token)
    set({ user, token, activeTab: 'dashboard' })
  },
  logout: () => {
    localStorage.removeItem('ux_auth_token')
    set({ user: null, token: null, activeTab: 'login', audit: null })
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAudit: (audit) => set({ audit }),
  setLoading: (loading) => set({ loading }),
  setScanStep: (step) =>
    set((state) => ({
      scanStep: typeof step === 'function' ? step(state.scanStep) : step,
    })),
  setChatOpen: (open) => set({ chatOpen: open }),
  setChatInput: (input) => set({ chatInput: input }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setChatPending: (pending) => set({ chatPending: pending }),
  setChatPersona: (persona) => set({ chatPersona: persona }),
  setActiveChatAuditId: (auditId) => set({ activeChatAuditId: auditId }),
  resetChatForAudit: (auditId) =>
    set((state) => {
      if (state.activeChatAuditId === auditId) {
        return state
      }

      return {
        activeChatAuditId: auditId,
        chatMessages: [],
        chatInput: '',
        chatPending: false,
      }
    }),
  setBusinessContext: (ctx) =>
    set((state) => ({
      businessContext: { ...state.businessContext, ...ctx },
    })),
}))
