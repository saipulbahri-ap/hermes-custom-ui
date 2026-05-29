import React, { useState, useEffect } from 'react'
import {
  Radio, RefreshCw,
} from 'lucide-react'
import { getGateway } from '../lib/api'

interface GatewayPlatform {
  name: string
  enabled: boolean
  config?: Record<string, any>
  type?: string
}

export default function Gateway() {
  const [platforms, setPlatforms] = useState<GatewayPlatform[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlatforms = async () => {
    setLoading(true)
    try {
      const res = await getGateway()
      const list = res?.platforms || res?.data || res || []
      setPlatforms(Array.isArray(list) ? list : [])
    } catch {
      setPlatforms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlatforms()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Gateway</h1>
            <p className="text-sm text-gray-400">AI platform integrations</p>
          </div>
        </div>
        <button onClick={fetchPlatforms} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Platform Cards */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && platforms.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-24 animate-pulse bg-gray-800/50" />
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Radio className="w-10 h-10 mb-2 text-gray-700" />
            <p className="text-sm">No gateway platforms found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {platforms.map((p) => (
              <div key={p.name} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${p.enabled ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                      <Radio className={`w-4 h-4 ${p.enabled ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{p.name}</p>
                      {p.type && (
                        <p className="text-xs text-gray-500 truncate">{p.type}</p>
                      )}
                    </div>
                  </div>
                  <span className={`badge shrink-0 ${p.enabled ? 'badge-green' : 'badge-gray'}`}>
                    {p.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {p.config && Object.keys(p.config).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Config
                    </p>
                    <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap bg-gray-900/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {JSON.stringify(p.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
