import React, { useState, useEffect } from 'react'
import {
  Clock, RefreshCw,
} from 'lucide-react'
import { getCron } from '../lib/api'

interface CronJob {
  id: string
  name: string
  schedule: string
  status: string
}

export default function Cron() {
  const [crons, setCrons] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCrons = async () => {
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
  }

  useEffect(() => {
    fetchCrons()
  }, [])

  const statusBadge = (status: string) => {
    const active = ['active', 'enabled', 'running', 'true'].includes(status?.toLowerCase())
    return (
      <span className={`badge ${active ? 'badge-green' : 'badge-gray'}`}>
        {status || 'unknown'}
      </span>
    )
  }

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
        <button onClick={fetchCrons} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

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
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {crons.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {c.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-200">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {c.schedule}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(c.status)}
                    </td>
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
