import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft, Trash2, Play, RefreshCw, Clock,
  Cpu, Hash, ChevronDown, ChevronUp, AlertTriangle,
  MessageSquare, User, Wrench, Bot,
} from 'lucide-react'
import { getSession, deleteSession as apiDeleteSession } from '../lib/api'

interface Message {
  id: string
  role: string
  content: string
  timestamp?: string
  tool_calls?: any[]
}

interface SessionData {
  id: string
  title?: string
  model?: string
  started_at?: string
  ended_at?: string
  messages?: Message[]
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})

  const fetchSession = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await getSession(id)
      // Backend returns {id, title, model, ..., messages: [...]}
      const sessionData: SessionData = {
        id: res.id || res.session?.id || id,
        title: res.title || res.session?.title,
        model: res.model || res.session?.model,
        started_at: res.started_at || res.session?.started_at || res.created_at,
        ended_at: res.ended_at || res.session?.ended_at || res.updated_at,
      }
      const msgs = res.messages || res.session?.messages || []
      setData(sessionData)
      setMessages(Array.isArray(msgs) ? msgs : [])
    } catch (e: any) {
      setError(e.message || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await apiDeleteSession(id)
      navigate('/sessions')
    } catch (e: any) {
      setError(e.message || 'Failed to delete session')
      setDeleting(false)
    }
  }

  const handleResume = () => {
    // Navigate back to chat with this session id
    navigate(`/chat?session=${id}`)
  }

  const toggleToolCalls = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  const fmtDate = (d?: string) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleString()
    } catch {
      return d
    }
  }

  const roleBadge = (role: string) => {
    const r = role.toLowerCase()
    if (r === 'user') return <span className="badge badge-blue">User</span>
    if (r === 'assistant') return <span className="badge badge-green">Assistant</span>
    if (r === 'system') return <span className="badge badge-yellow">System</span>
    if (r === 'tool') return <span className="badge badge-purple">Tool</span>
    return <span className="badge badge-gray">{role}</span>
  }

  const roleIcon = (role: string) => {
    const r = role.toLowerCase()
    if (r === 'user') return <User className="w-4 h-4" />
    if (r === 'assistant') return <Bot className="w-4 h-4" />
    if (r === 'system') return <Cpu className="w-4 h-4" />
    if (r === 'tool') return <Wrench className="w-4 h-4" />
    return <MessageSquare className="w-4 h-4" />
  }

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back + Header skeleton */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sessions')} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="h-7 w-48 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse mt-2" />
          </div>
        </div>

        {/* Metadata skeleton */}
        <div className="card animate-pulse bg-gray-800/50 h-32" />

        {/* Messages skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl p-4 bg-gray-800/50 animate-pulse ${
                  i % 2 === 0 ? 'h-24' : 'h-16'
                }`}
                style={{ width: `${40 + Math.random() * 40}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sessions')} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-hermes-300">Session Detail</h1>
        </div>
        <div className="card border-red-500/30 bg-red-900/10 flex flex-col items-center py-12 gap-3">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-red-300 font-medium">Failed to load session</p>
          <p className="text-sm text-red-400/70 font-mono break-all text-center max-w-md">
            {error}
          </p>
          <div className="flex gap-3 mt-2">
            <button onClick={fetchSession} className="btn-ghost flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button onClick={() => navigate('/sessions')} className="btn-primary text-sm">
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="shrink-0 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/sessions')} className="btn-ghost p-2" title="Back to sessions">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-hermes-300 truncate max-w-md">
                {data?.title || `Session ${id?.slice(0, 8)}`}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Hash className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500 font-mono">{id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResume}
              className="btn-primary text-sm flex items-center gap-1.5"
              title="Resume this session in chat"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="btn-ghost text-sm flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              title="Delete this session"
            >
              {deleting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Model
              </p>
              <p className="text-gray-200">{data?.model || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> Started
              </p>
              <p className="text-gray-200 text-xs">{fmtDate(data?.started_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> Ended
              </p>
              <p className="text-gray-200 text-xs">{fmtDate(data?.ended_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Messages
              </p>
              <p className="text-gray-200">{messages.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pb-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <MessageSquare className="w-10 h-10 mb-3 text-gray-700" />
            <p className="text-sm">No messages in this session</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const msgId = msg.id || `msg-${idx}`
            const isExpanded = expandedTools[msgId] || false
            const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0
            const isUser = msg.role.toLowerCase() === 'user'
            const isAssistant = msg.role.toLowerCase() === 'assistant'

            return (
              <div
                key={msgId}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-hermes-600/15 text-hermes-100 border-hermes-500/20'
                      : isAssistant
                      ? 'bg-gray-800 text-gray-200 border-gray-700/60'
                      : 'bg-gray-800/60 text-gray-300 border-gray-700/40'
                  }`}
                >
                  {/* Role badge + timestamp */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={isUser ? 'text-hermes-400' : 'text-gray-500'}>
                        {roleIcon(msg.role)}
                      </span>
                      {roleBadge(msg.role)}
                    </div>
                    {msg.timestamp && (
                      <span className="text-[10px] text-gray-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  {isUser ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                  ) : (
                    <div className="prose prose-invert prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-code:text-hermes-300 prose-headings:text-gray-200 max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Tool Calls */}
                  {hasToolCalls && (
                    <div className="mt-3 border-t border-gray-700/40 pt-2">
                      <button
                        onClick={() => toggleToolCalls(msgId)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <Wrench className="w-3 h-3" />
                        {msg.tool_calls!.length} tool call{msg.tool_calls!.length > 1 ? 's' : ''}
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {msg.tool_calls!.map((tc: any, tcIdx: number) => (
                            <details
                              key={tcIdx}
                              className="bg-gray-900/80 rounded-lg border border-gray-700/40 group"
                            >
                              <summary className="px-3 py-1.5 cursor-pointer text-xs text-hermes-400 font-mono hover:text-hermes-300 select-none">
                                {tc.function?.name || tc.name || `tool_call_${tcIdx}`}
                              </summary>
                              <pre className="px-3 pb-2 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(tc, null, 2)}
                              </pre>
                            </details>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card max-w-sm w-full mx-4 border-red-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Delete Session</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Are you sure you want to permanently delete{' '}
              <span className="font-medium text-hermes-300">
                {data?.title || `Session ${id?.slice(0, 8)}`}
              </span>{' '}
              and all its messages?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-ghost text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn bg-red-600 hover:bg-red-500 text-white text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
