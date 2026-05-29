import React, { useState, useEffect, useRef } from 'react'
import { FileText, Search, RefreshCw } from 'lucide-react'
import { getLogs } from '../lib/api'

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const preRef = useRef<HTMLPreElement>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await getLogs(100)
      // accept various response shapes: { lines: [...] }, { logs: [...] }, { data: [...] }, string, or array
      const raw = res?.lines ?? res?.logs ?? res?.data ?? res ?? []
      const lines: string[] = Array.isArray(raw)
        ? raw.map((l: any) => String(l))
        : typeof raw === 'string'
          ? raw.split('\n')
          : []
      setLogs(lines)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [logs])

  const q = filter.trim()
  const visible = q ? logs.filter(l => l.toLowerCase().includes(q.toLowerCase())) : logs

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Logs</h1>
            <p className="text-sm text-gray-400">System log output</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="input w-full pl-9 font-mono text-sm"
          placeholder="Filter logs..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {/* Terminal-style log viewer */}
      <div className="flex-1 min-h-0">
        <pre
          ref={preRef}
          className="h-full overflow-auto bg-black/60 rounded-lg border border-gray-800 p-4 font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap break-all"
        >
          {loading && logs.length === 0 ? (
            <span className="text-gray-600">Loading logs...</span>
          ) : visible.length === 0 ? (
            <span className="text-gray-600">
              {q ? 'No matching log lines' : 'No log entries available'}
            </span>
          ) : (
            visible.join('\n')
          )}
        </pre>
      </div>
    </div>
  )
}
