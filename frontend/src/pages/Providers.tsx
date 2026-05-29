import React, { useState, useEffect } from 'react'
import { Cpu, RefreshCw, AlertCircle } from 'lucide-react'
import { getProviders } from '../lib/api'

interface Provider {
  name: string
  model?: string
  api_base?: string
}

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProviders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProviders()
      const data = res?.providers || res?.data || res
      if (Array.isArray(data)) {
        setProviders(data)
      } else {
        setProviders([])
      }
    } catch (e: any) {
      setError(e.message)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-hermes-300" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Providers</h1>
            <p className="text-sm text-gray-400">Available model providers</p>
          </div>
        </div>
        <button
          onClick={fetchProviders}
          className="btn-ghost p-2"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-10 animate-pulse bg-gray-800/50" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Cpu className="w-10 h-10 mb-2 text-gray-700" />
            <p className="text-sm">No providers found</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Model</th>
                  <th className="text-left py-3 px-4 font-medium">API Base</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p, i) => (
                  <tr
                    key={p.name || i}
                    className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-200 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-gray-400">{p.model || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{p.api_base || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
