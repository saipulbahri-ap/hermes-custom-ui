import React, { useState, useEffect } from 'react'
import { Puzzle, RefreshCw } from 'lucide-react'
import { getPlugins } from '../lib/api'

interface Plugin {
  name: string
  path?: string
  size?: number
}

function formatSize(bytes?: number): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlugins = async () => {
    setLoading(true)
    try {
      const res = await getPlugins()
      const list = res?.plugins || res?.data || res || []
      setPlugins(Array.isArray(list) ? list : [])
    } catch {
      setPlugins([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlugins()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Puzzle className="w-6 h-6 text-hermes-300" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Plugins</h1>
            <p className="text-sm text-gray-400">Loaded plugins and their details</p>
          </div>
        </div>
        <button onClick={fetchPlugins} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading && plugins.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-gray-800/50" />
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Puzzle className="w-10 h-10 mb-2 text-gray-700" />
          <p className="text-sm">No plugins found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {plugins.map((plugin, idx) => (
            <div key={plugin.name || idx} className="card flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gray-800">
                <Puzzle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{plugin.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {plugin.path || 'Path unknown'}
                </p>
              </div>
              <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                {formatSize(plugin.size)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
