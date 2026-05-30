import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stats } from '../lib/api';
import {
  Activity, MessageSquare, Brain, Clock, Users,
  Code2, Wrench, FileText, Cpu,
} from 'lucide-react'

interface Stats {
  sessions_count?: number
  messages_count?: number
  memory_entries?: number
  active_skills?: number
  active_profiles?: number
  providers?: number
  api_server?: boolean
  uptime?: number
  model?: string
}

const statCards = [
  { key: 'sessions_count', icon: MessageSquare, label: 'Sessions', color: 'text-blue-400' },
  { key: 'messages_count', icon: Activity, label: 'Messages', color: 'text-green-400' },
  { key: 'memory_entries', icon: Brain, label: 'Memory Entries', color: 'text-purple-400' },
  { key: 'active_skills', icon: Code2, label: 'Active Skills', color: 'text-indigo-400' },
  { key: 'active_profiles', icon: Users, label: 'Profiles', color: 'text-cyan-400' },
  { key: 'uptime', icon: Clock, label: 'Uptime', color: 'text-yellow-400' },
]

const quickLinks = [
  { to: '/chat', icon: MessageSquare, label: 'Start Chat', desc: 'Talk to Hermes' },
  { to: '/sessions', icon: FileText, label: 'Sessions', desc: 'View history' },
  { to: '/skills', icon: Cpu, label: 'Skills', desc: 'Manage skills' },
  { to: '/config', icon: Wrench, label: 'Config', desc: 'Settings' },
]

export default function Dashboard() {
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stats()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-hermes-300">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          {data?.api_server ? 'System operational' : 'System status unknown'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ key, icon: Icon, label, color }) => {
          let val: any = data?.[key as keyof Stats]
          if (key === 'uptime' && typeof val === 'number') {
            const h = Math.floor(val / 3600)
            const m = Math.floor((val % 3600) / 60)
            val = `${h}h ${m}m`
          }
          if (val === undefined || val === null) val = '-'
          return (
            <div key={key} className="card flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-800 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{label}</p>
                <p className="text-lg font-semibold text-gray-100">
                  {loading ? (
                    <span className="inline-block w-12 h-5 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    val
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="card flex items-center gap-3 hover:border-hermes-500/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-hermes-600/10 text-hermes-400 group-hover:bg-hermes-600/20 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick stats mini */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {!data ? (
            <>
              {[1,2,3,4].map(i => <div key={i} className="card h-16 animate-pulse bg-gray-800/50" />)}
            </>
          ) : (
            <>
              <div className="card"><p className="text-xs text-gray-500">Skills</p><p className="text-lg font-bold text-gray-200">{data.active_skills ?? '-'}</p></div>
              <div className="card"><p className="text-xs text-gray-500">Profiles</p><p className="text-lg font-bold text-gray-200">{data.active_profiles ?? '-'}</p></div>
              <div className="card"><p className="text-xs text-gray-500">Providers</p><p className="text-lg font-bold text-gray-200">{data.providers ?? '-'}</p></div>
              <div className="card"><p className="text-xs text-gray-500">Memory</p><p className="text-lg font-bold text-gray-200">{data.memory_entries ?? '-'}</p></div>
            </>
          )}
        </div>
      </div>

      {data && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">System</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-gray-500">
              API:{' '}
              <span className={data.api_server ? 'text-green-400' : 'text-red-400'}>
                {data.api_server ? 'Online' : 'Offline'}
              </span>
            </span>
            {data.model && (
              <span className="text-gray-500">
                Model: <span className="text-gray-300">{data.model}</span>
              </span>
            )}
            <span className="text-gray-500">
              Uptime: <span className="text-gray-300">{data.uptime ?? '-'}s</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

