const BASE = '/api'

function getApiKey(): string | null {
  return localStorage.getItem('hermes_api_key')
}

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getApiKey() ? { 'X-API-Key': getApiKey()! } : {}),
      ...opts?.headers,
    },
    ...opts,
  })
  if (r.status === 403) {
    localStorage.removeItem('hermes_api_key')
    window.location.reload()
    throw new Error('403: Invalid API key')
  }
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`${r.status}: ${text || r.statusText}`)
  }
  return r.json()
}

// System
export const health = () => api<any>('/system/health')
export const stats = () => api<any>('/system/stats')
export const authStatus = () => api<any>('/auth/status')
export const resetKey = (currentKey: string, newKey: string) =>
  api<any>('/auth/reset-key', { method: 'POST', body: JSON.stringify({ current_key: currentKey, new_key: newKey }) })

// Chat
export const chat = (msg: string, model?: string, sessionId?: string) =>
  api<any>('/chat/send', { method: 'POST', body: JSON.stringify({ message: msg, model, session_id: sessionId }) })
export const models = () => api<any>('/chat/models')

// Sessions
export const getSessions = (limit?: number, offset?: number) =>
  api<any>(`/sessions?limit=${limit || 50}&offset=${offset || 0}`)
export const searchSessions = (q: string) =>
  api<any>(`/sessions/search?q=${encodeURIComponent(q)}`)
export const getSession = (id: string) =>
  api<any>(`/sessions/${id}`)
export const deleteSession = (id: string) =>
  api<any>(`/sessions/${id}`, { method: 'DELETE' })

// Skills
export const getSkills = () => api<any>('/skills')
export const getSkill = (name: string) =>
  api<any>(`/skills/${encodeURIComponent(name)}`)

// Memory
export const getMemory = (target?: string) =>
  api<any>(`/memory?target=${target || 'memory'}`)

// Cron
export const getCron = () => api<any>('/cron')
export const cronCreate = (data: { name: string; schedule: string; prompt: string }) =>
  api<any>('/cron/create', { method: 'POST', body: JSON.stringify(data) })
export const cronPause = (id: string) =>
  api<any>(`/cron/${encodeURIComponent(id)}/pause`, { method: 'PUT' })
export const cronResume = (id: string) =>
  api<any>(`/cron/${encodeURIComponent(id)}/resume`, { method: 'PUT' })
export const cronRun = (id: string) =>
  api<any>(`/cron/${encodeURIComponent(id)}/run`, { method: 'POST' })
export const cronDelete = (id: string) =>
  api<any>(`/cron/${encodeURIComponent(id)}`, { method: 'DELETE' })

// Config
export const getConfig = () => api<any>('/config')
export const putConfig = (data: any) =>
  api<any>('/config', { method: 'PUT', body: JSON.stringify(data) })

// Profiles
export const getProfiles = () => api<any>('/profiles')
export const activateProfile = (name: string) =>
  api<any>(`/profiles/${encodeURIComponent(name)}/activate`, { method: 'POST' })

// Tools
export const getTools = () => api<any>('/tools')

// Gateway
export const getGateway = () => api<any>('/gateway')

// Providers
export const getProviders = () => api<any>('/providers')

// Kanban
export const getKanban = () => api<any>('/kanban')

// Logs
export const getLogs = (limit?: number) =>
  api<any>(`/logs?limit=${limit || 100}`)

// Plugins
export const getPlugins = () => api<any>('/plugins')
