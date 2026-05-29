import React, { useState, useEffect } from 'react'
import {
  Users, CheckCircle, RefreshCw, Search, Activity,
} from 'lucide-react'
import { getProfiles, activateProfile } from '../lib/api'

interface Profile {
  name: string
  active?: boolean
  skills_count?: number
  plugins_count?: number
  description?: string
}

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activating, setActivating] = useState<string | null>(null)

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const res = await getProfiles()
      const list = res?.profiles || res?.data || res || []
      setProfiles(Array.isArray(list) ? list : [])
    } catch {
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleActivate = async (name: string) => {
    setActivating(name)
    try {
      await activateProfile(name)
      await fetchProfiles()
    } catch {
      // silent
    } finally {
      setActivating(null)
    }
  }

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-hermes-300">Profiles</h1>
          <p className="text-sm text-gray-400">Agent profiles & configurations</p>
        </div>
        <button onClick={fetchProfiles} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <form onSubmit={(e) => e.preventDefault()} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input w-full pl-9"
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </form>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && profiles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card h-28 animate-pulse bg-gray-800/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Users className="w-10 h-10 mb-2 text-gray-700" />
            <p className="text-sm">{search ? 'No matching profiles' : 'No profiles found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div
                key={p.name}
                className={`card flex flex-col relative ${
                  p.active ? 'border-hermes-500/50' : ''
                }`}
              >
                {/* Active badge */}
                {p.active && (
                  <span className="absolute top-3 right-3 badge badge-green flex items-center gap-1 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${p.active ? 'bg-hermes-600/20 text-hermes-400' : 'bg-gray-800 text-gray-400'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200 truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{p.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {p.skills_count ?? 0} skills
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {p.plugins_count ?? 0} plugins
                  </span>
                </div>

                {/* Activate button */}
                <button
                  onClick={() => handleActivate(p.name)}
                  disabled={p.active || activating === p.name}
                  className={`btn text-xs w-full ${
                    p.active
                      ? 'btn-disabled opacity-50 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {activating === p.name ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Activating...
                    </span>
                  ) : p.active ? (
                    'Active'
                  ) : (
                    'Activate'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
