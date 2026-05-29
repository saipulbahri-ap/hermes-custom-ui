import React, { useState, useEffect } from 'react'
import {
  Columns3, RefreshCw, Plus, GripVertical,
} from 'lucide-react'
import { getKanban } from '../lib/api'

interface KanbanItem {
  id?: string
  title?: string
  description?: string
  status?: string
  priority?: string
  assignee?: string
  [key: string]: any
}

interface KanbanData {
  columns?: Record<string, KanbanItem[]>
  items?: KanbanItem[]
  [key: string]: any
}

const COLUMN_META: Record<string, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',     color: 'text-gray-400',  bg: 'bg-gray-800/40' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',  bg: 'bg-blue-900/10' },
  done:        { label: 'Done',        color: 'text-green-400', bg: 'bg-green-900/10' },
}

const COLUMN_ORDER = ['backlog', 'in_progress', 'done']

export default function Kanban() {
  const [data, setData] = useState<KanbanData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchKanban = async () => {
    setLoading(true)
    try {
      const res = await getKanban()
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKanban()
  }, [])

  const itemsByColumn = (): Record<string, KanbanItem[]> => {
    if (!data) return {}

    // If response has columns object
    if (data.columns && typeof data.columns === 'object') {
      return data.columns
    }

    // If response has items array with status field
    if (Array.isArray(data.items)) {
      const grouped: Record<string, KanbanItem[]> = {}
      for (const item of data.items) {
        const s = item.status || 'backlog'
        if (!grouped[s]) grouped[s] = []
        grouped[s].push(item)
      }
      return grouped
    }

    // If response itself is an array
    if (Array.isArray(data)) {
      const grouped: Record<string, KanbanItem[]> = {}
      for (const item of data) {
        const s = item.status || 'backlog'
        if (!grouped[s]) grouped[s] = []
        grouped[s].push(item)
      }
      return grouped
    }

    return {}
  }

  const columns = itemsByColumn()

  const priorityBadge = (p?: string) => {
    if (!p) return null
    const cls: Record<string, string> = {
      high: 'badge-red',
      medium: 'badge-yellow',
      low: 'badge-gray',
    }
    return (
      <span className={`badge ${cls[p.toLowerCase()] || 'badge-gray'} text-xs`}>
        {p}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Columns3 className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Kanban</h1>
            <p className="text-sm text-gray-400">Task board</p>
          </div>
        </div>
        <button onClick={fetchKanban} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && !data ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-24 bg-gray-800/50 rounded animate-pulse" />
                {[1, 2].map((j) => (
                  <div key={j} className="card h-24 animate-pulse bg-gray-800/50" />
                ))}
              </div>
            ))}
          </div>
        ) : Object.keys(columns).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Columns3 className="w-12 h-12 mb-3 text-gray-700" />
            <p className="text-sm">No kanban items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
            {COLUMN_ORDER.map((colKey) => {
              const meta = COLUMN_META[colKey]
              const items = columns[colKey] || []
              return (
                <div key={colKey} className="flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${meta?.color || 'text-gray-300'}`}>
                        {meta?.label || colKey}
                      </span>
                      <span className="text-xs text-gray-600 bg-gray-800/60 rounded-full px-2 py-0.5">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className={`space-y-2 flex-1 rounded-lg p-2 ${meta?.bg || ''}`}>
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-600 text-xs">
                        <Plus className="w-5 h-5 mb-1 opacity-40" />
                        <span>Empty</span>
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="card p-3 border border-gray-700/50 hover:border-gray-600/60 transition-colors cursor-default"
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-3.5 h-3.5 mt-0.5 text-gray-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-200 truncate">
                                {item.title || item.name || item.id || `Item ${idx + 1}`}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {priorityBadge(item.priority)}
                                {item.assignee && (
                                  <span className="text-xs text-gray-500 truncate max-w-24">
                                    {item.assignee}
                                  </span>
                                )}
                                {item.labels && Array.isArray(item.labels) && item.labels.slice(0, 2).map((l: string) => (
                                  <span key={l} className="text-xs text-gray-600 bg-gray-800 rounded px-1.5 py-0.5 truncate max-w-20">
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
