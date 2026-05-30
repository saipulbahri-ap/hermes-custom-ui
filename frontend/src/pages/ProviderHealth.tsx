import React, { useState, useEffect } from 'react'
import { Cpu, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, Globe } from 'lucide-react'
import { getProvidersHealth } from '../lib/api'

interface ProviderHealth {
  name: string
  model: string
  api_base: string
  status: 'healthy' | 'unreachable' | 'auth_error' | 'error' | 'reachable' | 'no_url' | 'unknown'
  latency_ms: number | null
  error: string | null
}

export default function ProviderHealth() {
  const [providers, setProviders] = useState<ProviderHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)

  const checkHealth = async () => {
    setChecking(true)
    try {
      const res = await getProvidersHealth()
      const list = Array.isArray(res) ? res : (res?.providers || res?.data || res || [])
      setProviders(list)
      setLastCheck(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
      setProviders([])
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  useEffect(() => { checkHealth() }, [])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'reachable': return <CheckCircle className="w-5 h-5 text-yellow-400" />
      case 'auth_error': return <AlertCircle className="w-5 h-5 text-orange-400" />
      case 'unreachable': return <XCircle className="w-5 h-5 text-red-400" />
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />
      case 'no_url': return <Globe className="w-5 h-5 text-gray-500" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      healthy: 'badge-green',
      reachable: 'badge-yellow',
      auth_error: 'badge-orange',
      unreachable: 'badge-red',
      error: 'badge-red',
      no_url: 'badge-gray',
    }
    return map[status] || 'badge-gray'
  }

  const latencyColor = (ms: number | null) => {
    if (ms === null) return 'text-gray-500'
    if (ms < 500) return 'text-green-400'
    if (ms < 1500) return 'text-yellow-400'
    return 'text-red-400'
  }

  const healthyCount = providers.filter(p => p.status === 'healthy' || p.status === 'reachable').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Provider Health</h1>
            <p className="text-sm text-gray-400">
              {providers.length} provider{providers.length !== 1 ? 's' : ''} configured
              {lastCheck && <span className="text-gray-500"> · Last check: {lastCheck}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={checking}
          className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Check All'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-200">{providers.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Healthy</p>
          <p className="text-xl font-bold text-green-400">{healthyCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Errors</p>
          <p className="text-xl font-bold text-red-400">{providers.filter(p => p.status === 'error' || p.status === 'unreachable').length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Avg Latency</p>
          <p className="text-xl font-bold text-gray-200">
            {providers.filter(p => p.latency_ms).length > 0
              ? Math.round(providers.filter(p => p.latency_ms).reduce((a, b) => a + (b.latency_ms || 0), 0) / providers.filter(p => p.latency_ms).length) + 'ms'
              : '-'}
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      {loading && providers.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-800/50" />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Cpu className="w-10 h-10 mx-auto mb-2 text-gray-700" />
          <p className="text-sm">No providers configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p, i) => (
            <div key={`${p.name}-${i}`} className="card">
              <div className="flex items-center gap-4">
                {statusIcon(p.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{p.name}</span>
                    <span className={`badge ${statusBadge(p.status)} text-xs`}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    {p.model && <span>{p.model}</span>}
                    {p.api_base && <span className="font-mono truncate max-w-[300px]">{p.api_base}</span>}
                    {p.latency_ms !== null && (
                      <span className={`flex items-center gap-1 ${latencyColor(p.latency_ms)}`}>
                        <Clock className="w-3 h-3" />
                        {p.latency_ms}ms
                      </span>
                    )}
                  </div>
                  {p.error && (
                    <p className="text-xs text-red-400 mt-1">{p.error}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
