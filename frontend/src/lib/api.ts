import type { ApiResponse, Session, PaginatedResult, TimelineEvent, ToolCall, Project, Stats } from './types'

const BASE_URL = import.meta.env.DEV ? '' : ''

function getToken(): string {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) return token

  const stored = sessionStorage.getItem('ccmemo-token')
  if (stored) return stored

  return ''
}

function setToken(token: string) {
  sessionStorage.setItem('ccmemo-token', token)
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-CCMemo-Token': token,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  const json: ApiResponse<T> = await res.json()
  if (json.status !== 'ok') {
    throw new Error('API returned error status')
  }
  return json.data
}

export const api = {
  sessions: {
    list: (params?: {
      project_id?: string
      status?: string
      query?: string
      limit?: number
      cursor?: string
    }) => {
      const sp = new URLSearchParams()
      if (params?.project_id) sp.set('project_id', params.project_id)
      if (params?.status) sp.set('status', params.status)
      if (params?.query) sp.set('query', params.query)
      if (params?.limit) sp.set('limit', String(params.limit))
      if (params?.cursor) sp.set('cursor', params.cursor)
      const qs = sp.toString()
      return apiFetch<PaginatedResult<Session>>(`/api/sessions${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => apiFetch<Session>(`/api/sessions/${id}`),
    timeline: (id: string, cursor?: string, limit?: number) => {
      const sp = new URLSearchParams()
      if (cursor) sp.set('cursor', cursor)
      if (limit) sp.set('limit', String(limit))
      const qs = sp.toString()
      return apiFetch<PaginatedResult<TimelineEvent>>(`/api/sessions/${id}/timeline${qs ? `?${qs}` : ''}`)
    },
    toolCalls: (id: string) => apiFetch<{ items: ToolCall[] }>(`/api/sessions/${id}/tool-calls`),
  },
  projects: {
    list: () => apiFetch<Project[]>('/api/projects'),
  },
  search: {
    query: (q: string, projectId?: string, limit?: number) => {
      const sp = new URLSearchParams()
      sp.set('q', q)
      if (projectId) sp.set('project_id', projectId)
      if (limit) sp.set('limit', String(limit))
      return apiFetch<PaginatedResult<Session>>(`/api/search?${sp.toString()}`)
    },
  },
  stats: () => apiFetch<Stats>('/api/stats'),
  setToken,
  getToken,
}
