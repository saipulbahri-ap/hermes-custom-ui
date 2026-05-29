import React, { useState, useEffect } from 'react'
import {
  History, Search, Clock, Trash2, MessageSquare,
  ChevronRight, RefreshCw,
} from 'lucide-react'
import { getSessions, searchSessions, getSession } from '../lib/api'

interface Session {
  id: string
  title?: string
  created_at?: string
  updated_at?: string
  message_count?: number
  model?: string
  status?: string
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Session | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = search.trim()
        ? await searchSessions(search)
        : await getSessions(50, 0)
      const list = res?.sessions || res?.data || res || []
      setSessions(Array.isArray(list) ? list : [])
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSessions()
  }

  const openDetail = async (s: Session) => {
    setSelected(s)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await getSession(s.id)
      setDetail(res)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const fmtDate = (d?: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleString()
  }

  return (
    <div className="flex gap-4 h-full">
      {/* List */}
      <div className={`flex flex-col ${selected ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Sessions</h1>
            <p className="text-sm text-gray-400">Conversation history</p>
          </div>
          <button onClick={fetchSessions} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input w-full pl-9"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading && sessions.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-16 animate-pulse bg-gray-800/50" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <History className="w-10 h-10 mb-2 text-gray-700" />
              <p className="text-sm">No sessions found</p>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openDetail(s)}
                className={`card w-full text-left flex items-center gap-3 hover:border-hermes-500/30 transition-colors ${
                  selected?.id === s.id ? 'border-hermes-500/50' : ''
                }`}
              >
                <MessageSquare className="w-5 h-5 text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {s.title || `Session ${s.id.slice(0, 8)}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {fmtDate(s.updated_at || s.created_at)}
                    </span>
                    {s.message_count !== undefined && (
                      <span>{s.message_count} msgs</span>
                    )}
                    {s.model && <span className="badge-gray">{s.model}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="w-1/2 border-l border-gray-800 pl-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 truncate">
              {selected.title || `Session ${selected.id.slice(0, 8)}`}
            </h2>
            <button onClick={() => setSelected(null)} className="btn-ghost text-xs">Close</button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="card space-y-1">
              <p className="text-gray-400">ID</p>
              <p className="text-gray-200 font-mono text-xs break-all">{selected.id}</p>
            </div>
            <div className="card space-y-1">
              <p className="text-gray-400">Created</p>
              <p className="text-gray-200">{fmtDate(selected.created_at)}</p>
            </div>
            <div className="card space-y-1">
              <p className="text-gray-400">Updated</p>
              <p className="text-gray-200">{fmtDate(selected.updated_at)}</p>
            </div>
            {selected.model && (
              <div className="card space-y-1">
                <p className="text-gray-400">Model</p>
                <p className="text-gray-200">{selected.model}</p>
              </div>
            )}
            {selected.message_count !== undefined && (
              <div className="card space-y-1">
                <p className="text-gray-400">Messages</p>
                <p className="text-gray-200">{selected.message_count}</p>
              </div>
            )}

            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading detail...
              </div>
            )}

            {detail?.messages && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Messages ({detail.messages.length})
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detail.messages.slice(-20).map((m: any, i: number) => (
                    <div key={i} className="card text-xs">
                      <span className="font-semibold text-hermes-400">{m.role || '?'}:</span>{' '}
                      <span className="text-gray-300">
                        {(m.content || '').slice(0, 200)}
                        {(m.content || '').length > 200 ? '...' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
