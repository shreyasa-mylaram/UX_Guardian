import { create } from 'zustand'

interface Issue {
  id: number
  category: string
  severity: string
  title: string
  description: string
  recommendation: string
  selector: string
  code_snippet: string
  fixed_code: string
}

interface AuditData {
  id: number
  url: string
  status: string
  overall_score: number | null
  issues?: Issue[]
}

interface AppState {
  audit: AuditData | null
  loading: boolean
  setAudit: (audit: AuditData) => void
  setLoading: (loading: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  audit: null,
  loading: false,
  setAudit: (audit) => set({ audit }),
  setLoading: (loading) => set({ loading }),
}))
