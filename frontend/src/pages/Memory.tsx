import React, { useState, useEffect } from 'react'
import { Brain, RefreshCw } from 'lucide-react'
import { getMemory } from '../lib/api'

interface MemoryEntry {
  id?: string | number
  key?: string
  content?: string
  value?: string
  type?: string
  timestamp?: string
  updated_at?: string
  [key: string]: any
}

type Tab = 'memory' | 'user'

export default function Memory() {
  const [tab, setTab] = useState<Tab>('memory')
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = async (target: Tab) => {
    setLoading(true)
    try {
      const res = await getMemory(target)
      const list = res?.entries || res?.data || res?.memory || res || []
      setEntries(Array.isArray(list) ? list : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries(tab)
  }, [tab])

  const switchTab = (t: Tab) => {
    if (t !== tab) setTab(t)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'memory', label: 'Agent Memory' },
    { key: 'user', label: 'User Profile' },
  ]

  const renderValue = (entry: MemoryEntry): string => {
    return entry.content || entry.value || entry.key || JSON.stringify(entry)
  }

  const renderMeta = (entry: MemoryEntry): string => {
    const ts = entry.timestamp || entry.updated_at
    if (ts) {
      try {
        const d = new Date(ts)
        return d.toLocaleString()
      } catch {
        return ts
      }
    }
    return entry.type || ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Memory & Profile</h1>
            <p className="text-sm text-gray-400">Agent memory and user profile entries</p>
          </div>
        </div>
        <button onClick={() => fetchEntries(tab)} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-hermes-300 border-hermes-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loading && entries.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-20 animate-pulse bg-gray-800/50" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Brain className="w-10 h-10 mb-2 text-gray-700" />
            <p className="text-sm">No {tab === 'memory' ? 'memory' : 'profile'} entries found</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.id || entry.key || idx}
              className="card space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {entry.key || entry.type || `Entry ${idx + 1}`}
                </p>
                {renderMeta(entry) && (
                  <span className="text-xs text-gray-500 shrink-0">{renderMeta(entry)}</span>
                )}
              </div>
              <p className="text-sm text-gray-400 whitespace-pre-wrap break-words line-clamp-4">
                {renderValue(entry)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
