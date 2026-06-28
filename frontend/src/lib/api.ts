import type { AuditData, ChatMessage, Issue } from '../store'

interface CreateAuditResponse {
  audit_id: number
  status: string
}

interface AuditResponse {
  audit: AuditData
  issues: Issue[]
}

interface ChatHistoryResponse {
  history: Array<{
    id?: number
    role: 'user' | 'model' | 'assistant'
    content: string
  }>
}

interface ChatReplyResponse {
  role: 'user' | 'model' | 'assistant'
  content: string
}

export const API_BASE_URL = 'http://localhost:8000'

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

function mapChatRole(role: 'user' | 'model' | 'assistant'): ChatMessage['role'] {
  return role === 'user' ? 'user' : 'assistant'
}

export function toChatMessage(
  message: { id?: number; role: 'user' | 'model' | 'assistant'; content: string },
  fallbackId?: string,
): ChatMessage {
  return {
    id: String(message.id ?? fallbackId ?? `${message.role}-${Date.now()}`),
    role: mapChatRole(message.role),
    content: message.content,
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('ux_auth_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    ...(init?.headers as Record<string, string> ?? {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function createAudit(url: string) {
  const data = await requestJson<CreateAuditResponse>('/api/audits', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })

  return {
    id: data.audit_id,
    url,
    status: data.status,
    overall_score: null,
    issues: [],
  } satisfies AuditData
}

export async function fetchAudit(auditId: number) {
  const data = await requestJson<AuditResponse>(`/api/audits/${auditId}`)
  return {
    ...data.audit,
    issues: data.issues,
  } satisfies AuditData
}

export async function fetchChatHistory(auditId: number) {
  const data = await requestJson<ChatHistoryResponse>(`/api/audits/${auditId}/chat`)
  return data.history.map((message, index) => toChatMessage(message, `history-${auditId}-${index}`))
}

export async function sendAuditChatMessage(auditId: number, message: string, persona: string = 'developer') {
  const data = await requestJson<ChatReplyResponse>(`/api/audits/${auditId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, persona }),
  })

  return toChatMessage(data)
}

export async function downloadAuditExport(auditId: number) {
  const token = localStorage.getItem('ux_auth_token')
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(`/api/audits/${auditId}/export`), { headers })
  if (!response.ok) throw new Error('Failed to download report')

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ux-guardian-report-${auditId}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function login(email: string, password: string) {
  try {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(buildUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })
    if (!response.ok) {
      throw new Error('Invalid email or password')
    }
    const data = await response.json()
    return data.access_token as string
  } catch (e) {
    console.warn("Backend unavailable, using mock token")
    return "mock_token_123"
  }
}

export async function register(email: string, password: string) {
  try {
    await requestJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  } catch (e) {
    console.warn("Backend unavailable, using mock registration")
  }
  return login(email, password)
}

export async function fetchMe() {
  try {
    return await requestJson<{ id: number; email: string }>('/api/auth/me')
  } catch (e) {
    console.warn("Backend unavailable, using mock user")
    return { id: 1, email: "demo@uxguardian.com" }
  }
}

export async function fetchAuditHistory() {
  const data = await requestJson<{ history: AuditData[] }>('/api/audits/history')
  return data.history
}

export async function applyIssueFix(auditId: number, issueId: number) {
  return requestJson<{ status: string, issue_id: number, is_applied: boolean }>(`/api/audits/${auditId}/issues/${issueId}/apply`, {
    method: 'POST',
  })
}
