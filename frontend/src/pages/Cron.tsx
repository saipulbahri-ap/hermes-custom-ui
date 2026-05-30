import React, { useState, useEffect, useCallback } from 'react'
import {
  Clock, RefreshCw, Plus, Play, Pause, Trash2,
  X, Terminal, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react'
import {
  getCron, cronCreate, cronPause, cronResume, cronRun, cronDelete,
} from '../lib/api'

interface CronJob {
  id: string
  name: string
  schedule: string
  prompt?: string
  status: string
  last_run?: string
  next_run?: string
  created_at?: string
}

export default function Cron() {
  const [crons, setCrons] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSchedule, setFormSchedule] = useState('')
  const [formPrompt, setFormPrompt] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [executionLogs, setExecutionLogs] = useState<Record<string, string[]>>({})
  const [logLoading, setLogLoading] = useState<string | null>(null)

  const flash = (setter: (v: string) => void, msg: string) => {
    setter(msg)
    setTimeout(() => setter(''), 3000)
  }

  const showError = (msg: string) => flash(setError, msg)
  const showSuccess = (msg: string) => flash(setSuccess, msg)

  const fetchCrons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCron()
      const list = res?.crons || res?.jobs || res?.data || res || []
      setCrons(Array.isArray(list) ? list : [])
    } catch {
      setCrons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrons()
  }, [fetchCrons])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formSchedule.trim()) return
    setCreating(true)
    try {
      await cronCreate({
        name: formName.trim(),
        schedule: formSchedule.trim(),
        prompt: formPrompt.trim(),
      })
      setFormName('')
      setFormSchedule('')
      setFormPrompt('')
      setShowCreate(false)
      showSuccess(`Cron job "${formName.trim()}" created`)
      fetchCrons()
    } catch (e: any) {
      showError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handlePause = async (id: string) => {
    setBusyId(id)
    try {
      await cronPause(id)
      showSuccess('Job paused')
      fetchCrons()
    } catch (e: any) {
      showError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleResume = async (id: string) => {
    setBusyId(id)
    try {
      await cronResume(id)
      showSuccess('Job resumed')
      fetchCrons()
    } catch (e: any) {
      showError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleRun = async (id: string) => {
    setBusyId(id)
    try {
      const res = await cronRun(id)
      showSuccess('Job triggered')
      // If the API returns execution output, capture it
      const output = res?.output || res?.result || res?.log
      if (output) {
        setExecutionLogs((prev) => ({
          ...prev,
          [id]: [...(prev[id] || []), `[${new Date().toLocaleString()}] ${typeof output === 'string' ? output : JSON.stringify(output)}`],
        }))
      }
      fetchCrons()
    } catch (e: any) {
      showError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete cron job "${name}"?`)) return
    setBusyId(id)
    try {
      await cronDelete(id)
      showSuccess(`Job "${name}" deleted`)
      fetchCrons()
    } catch (e: any) {
      showError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleLogs = async (job: CronJob) => {
    if (expandedId === job.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(job.id)
    // Use last_run info as pseudo-log entry if no logs yet
    setLogLoading(job.id)
    if (!executionLogs[job.id] || executionLogs[job.id].length === 0) {
      const meta: string[] = []
      if (job.created_at) meta.push(`[Created] ${job.created_at}`)
      if (job.last_run) meta.push(`[Last Run] ${job.last_run}`)
      if (job.next_run) meta.push(`[Next Run] ${job.next_run}`)
      if (job.prompt) meta.push(`[Prompt] ${job.prompt.slice(0, 300)}`)
      setExecutionLogs((prev) => ({ ...prev, [job.id]: meta }))
    }
    setLogLoading(null)
  }

  const statusBadge = (status: string) => {
    const s = (status || 'unknown').toLowerCase()
    if (s === 'active' || s === 'enabled' || s === 'true') {
      return <span className="badge badge-green">active</span>
    }
    if (s === 'paused' || s === 'disabled') {
      return <span className="badge badge-yellow">paused</span>
    }
    if (s === 'running') {
      return (
        <span className="badge badge-blue flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> running
        </span>
      )
    }
    return <span className="badge badge-gray">{status || 'unknown'}</span>
  }

  const isBusy = (id: string) => busyId === id

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Cron Jobs</h1>
            <p className="text-sm text-gray-400">Scheduled tasks & automation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCrons} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && crons.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-12 animate-pulse bg-gray-800/50" />
            ))}
          </div>
        ) : crons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Clock className="w-10 h-10 mb-2 text-gray-700" />
            <p className="text-sm">No cron jobs found</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 btn-primary text-xs flex items-center gap-1">
              <Plus className="w-3 h-3" /> Create your first job
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {crons.map((c) => (
              <div key={c.id} className="card overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleLogs(c)}
                    className="text-gray-500 hover:text-gray-300 shrink-0"
                    title="Toggle execution details"
                  >
                    {expandedId === c.id ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-200 truncate">{c.name}</span>
                      {statusBadge(c.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="font-mono">{c.schedule}</span>
                      {c.last_run && (
                        <span>Last: {c.last_run}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pause / Resume */}
                    {(c.status || '').toLowerCase() === 'paused' ||
                    (c.status || '').toLowerCase() === 'disabled' ? (
                      <button
                        onClick={() => handleResume(c.id)}
                        disabled={isBusy(c.id)}
                        className="btn-ghost p-1.5 text-green-400 hover:text-green-300 disabled:opacity-50"
                        title="Resume"
                      >
                        {isBusy(c.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePause(c.id)}
                        disabled={isBusy(c.id)}
                        className="btn-ghost p-1.5 text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                        title="Pause"
                      >
                        {isBusy(c.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Run */}
                    <button
                      onClick={() => handleRun(c.id)}
                      disabled={isBusy(c.id)}
                      className="btn-ghost p-1.5 text-hermes-400 hover:text-hermes-300 disabled:opacity-50"
                      title="Run now"
                    >
                      {isBusy(c.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={isBusy(c.id)}
                      className="btn-ghost p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50"
                      title="Delete"
                    >
                      {isBusy(c.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded execution log section */}
                {expandedId === c.id && (
                  <div className="border-t border-gray-800 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Execution Details
                      </span>
                      {logLoading === c.id && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-20 shrink-0">ID</span>
                        <span className="font-mono text-gray-400">{c.id}</span>
                      </div>
                      {c.created_at && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 shrink-0">Created</span>
                          <span className="text-gray-400">{c.created_at}</span>
                        </div>
                      )}
                      {c.last_run && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 shrink-0">Last Run</span>
                          <span className="text-gray-400">{c.last_run}</span>
                        </div>
                      )}
                      {c.next_run && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 shrink-0">Next Run</span>
                          <span className="text-gray-400">{c.next_run}</span>
                        </div>
                      )}
                      {c.prompt && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 shrink-0">Prompt</span>
                          <span className="text-gray-400 break-all">{c.prompt}</span>
                        </div>
                      )}
                    </div>

                    {/* Logs */}
                    <div className="bg-gray-900/60 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs text-gray-400">
                      {(executionLogs[c.id] || []).length === 0 ? (
                        <p className="text-gray-600 italic">No execution logs yet</p>
                      ) : (
                        executionLogs[c.id].map((line, i) => (
                          <div key={i} className="py-0.5 border-b border-gray-800/40 last:border-0">
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-hermes-400" />
                <h2 className="text-lg font-semibold text-gray-200">Create Cron Job</h2>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="btn-ghost p-1 text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. Daily backup"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Schedule <span className="text-red-400">*</span>
                </label>
                <input
                  className="input w-full font-mono text-sm"
                  placeholder="e.g. 0 6 * * * or @hourly or @every 5m"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Cron expression or human-readable interval (e.g. @daily, @hourly, @every 30m)
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Prompt
                </label>
                <textarea
                  className="input w-full min-h-[100px] resize-y text-sm"
                  placeholder="The prompt / message to send when this job runs..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formName.trim() || !formSchedule.trim()}
                  className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
