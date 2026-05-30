import React, { useState, useEffect } from 'react'
import {
  Code2, Power, PowerOff, Search, RefreshCw,
  ChevronRight, Terminal,
} from 'lucide-react'
import { getSkills, getSkill } from '../lib/api'

interface Skill {
  name: string
  description?: string
  version?: string
  author?: string
  category?: string
  content?: string
  linked_files?: string[]
  path?: string
  size_bytes?: number
  content_preview?: string
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Skill | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const res = await getSkills()
      const list = res?.skills || res?.data || res || []
      setSkills(Array.isArray(list) ? list : [])
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  const openDetail = async (s: Skill) => {
    setSelected(s)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await getSkill(s.name)
      setDetail(res)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex gap-4 h-full">
      {/* List */}
      <div className={`flex flex-col ${selected ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Skills</h1>
            <p className="text-sm text-gray-400">Agent skills & capabilities</p>
          </div>
          <button onClick={fetchSkills} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input w-full pl-9"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <p className="text-xs text-gray-500 mb-2">{filtered.length} skill{filtered.length !== 1 ? 's' : ''}</p>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading && skills.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-16 animate-pulse bg-gray-800/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Code2 className="w-10 h-10 mb-2 text-gray-700" />
              <p className="text-sm">{search ? 'No matching skills' : 'No skills found'}</p>
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.name}
                onClick={() => openDetail(s)}
                className={`card w-full text-left flex items-center gap-3 hover:border-hermes-500/30 transition-colors ${
                  selected?.name === s.name ? 'border-hermes-500/50' : ''
                }`}
              >
                <div className="p-1.5 rounded-lg bg-hermes-600/10">
                  <Code2 className="w-4 h-4 text-hermes-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {s.description || 'No description'}
                  </p>
                </div>
                {s.category && (
                  <span className="badge badge-gray text-xs shrink-0">{s.category}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="w-1/2 border-l border-gray-800 pl-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 truncate">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="btn-ghost text-xs">Close</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 text-sm min-h-0">
            <div className="card space-y-1">
              <p className="text-gray-400">Name</p>
              <p className="text-gray-200 font-mono">{selected.name}</p>
            </div>
            <div className="card space-y-1">
              <p className="text-gray-400">Description</p>
              <p className="text-gray-200">{selected.description || '-'}</p>
            </div>
            {selected.category && (
              <div className="card space-y-1">
                <p className="text-gray-400">Category</p>
                <span className="badge badge-gray">{selected.category}</span>
              </div>
            )}
            {selected.version && (
              <div className="card space-y-1">
                <p className="text-gray-400">Version</p>
                <p className="text-gray-200">{selected.version}</p>
              </div>
            )}
            {selected.author && (
              <div className="card space-y-1">
                <p className="text-gray-400">Author</p>
                <p className="text-gray-200">{selected.author}</p>
              </div>
            )}

            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading detail...
              </div>
            )}

            {detail?.content && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> SKILL.md Preview
                </p>
                <pre className="card text-xs font-mono text-gray-300 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {detail.content}
                </pre>
              </div>
            )}

            {detail?.linked_files && detail.linked_files.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Linked Files</p>
                <div className="space-y-1">
                  {detail.linked_files.map((f: string) => (
                    <div key={f} className="card text-xs font-mono text-gray-400">{f}</div>
                  ))}
                </div>
              </div>
            )}

            {detail?.config && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Config</p>
                <pre className="card text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(detail.config, null, 2)}
                </pre>
              </div>
            )}

            {detail?.source && !detail?.content && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> Source
                </p>
                <pre className="card text-xs font-mono text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                  {detail.source}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
