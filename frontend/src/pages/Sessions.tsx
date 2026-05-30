import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  History, Search, Clock, MessageSquare,
  ChevronRight, RefreshCw, Trash2,
} from 'lucide-react'
import { getSessions, searchSessions, getSession, deleteSession } from '../lib/api'

interface Session {
  id: string
  title?: string
  started_at?: string
  ended_at?: string
  created_at?: string
  updated_at?: string
  model?: string
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
      // Handle various response formats
      const list = Array.isArray(res) ? res : (res?.sessions || res?.data || res?.results || [])
      setSessions(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Sessions fetch error:', e)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [])

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
    } catch (e) {
      console.error('Session detail error:', e)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (s: Session) => {
    if (!confirm(`Delete session "${s.title || s.id.slice(0, 8)}"?`)) return
    try {
      await deleteSession(s.id)
      if (selected?.id === s.id) setSelected(null)
      fetchSessions()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const fmtDate = (d?: string) => {
    if (!d) return '-'
    try { return new Date(d).toLocaleString() } catch { return d }
  }

  const msgCount = selected ? (detail?.messages || detail?.message_count || 0) : 0

  return (
    <div className="flex gap-4 h-full">
      {/* List */}
      <div className={`flex flex-col ${selected ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Sessions</h1>
            <p className="text-sm text-gray-400">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={fetchSessions} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

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

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading && sessions.length === 0 ? (
            <div className="space-y-y">
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
            sessions.map((s) => {
              const date = s.updated_at || s.started_at || s.created_at
              return (
                <div
                  key={s.id}
                  className={`card w-full flex items-center gap-3 hover:border-hermes-500/30 transition-colors ${
                    selected?.id === s.id ? 'border-hermes-500/50' : ''
                  }`}
                >
                  <button onClick={() => openDetail(s)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <MessageSquare className="w-5 h-5 text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/sessions/${s.id}`}
                        className="text-sm font-medium text-gray-200 truncate hover:text-hermes-400 transition-colors block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.title || `Session ${s.id.slice(0, 8)}`}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtDate(date)}
                        </span>
                        {s.model && <span className="badge-gray">{s.model}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="w-1/2 border-l border-gray-800 pl-4 flex flex-col min-h-0">
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
            <div className="flex gap-3">
              <div className="card space-y-1 flex-1">
                <p className="text-gray-400">Started</p>
                <p className="text-gray-200 text-xs">{fmtDate(selected.started_at)}</p>
              </div>
              <div className="card space-y-1 flex-1">
                <p className="text-gray-400">Ended</p>
                <p className="text-gray-200 text-xs">{fmtDate(selected.ended_at)}</p>
              </div>
            </div>
            {selected.model && (
              <div className="card space-y-1">
                <p className="text-gray-400">Model</p>
                <p className="text-gray-200">{selected.model}</p>
              </div>
            )}

            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading messages...
              </div>
            )}

            {detail?.messages && detail.messages.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Messages ({detail.messages.length})
                </p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {detail.messages.map((m: any, i: number) => (
                    <div key={i} className="card text-xs">
                      <span className={`font-semibold ${m.role === 'user' ? 'text-blue-400' : m.role === 'assistant' ? 'text-hermes-400' : 'text-gray-400'}`}>
                        {m.role || '?'}:
                      </span>{' '}
                      <span className="text-gray-300">
                        {(m.content || '').slice(0, 300)}
                        {(m.content || '').length > 300 ? '...' : ''}
                      </span>
                      {m.tool_calls && (
                        <div className="mt-1 text-purple-400">
                          🔧 {Array.isArray(m.tool_calls) ? m.tool_calls.length + ' tool call(s)' : 'tool_call'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail && !detailLoading && (!detail.messages || detail.messages.length === 0) && (
              <div className="text-gray-500 text-sm text-center py-4">
                No messages in this session
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
