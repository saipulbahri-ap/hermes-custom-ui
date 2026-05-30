import React, { useState, useEffect } from 'react'
import { Play, RefreshCw, Terminal, Zap, ChevronRight } from 'lucide-react'
import { getSkills, getSkill, runSkill } from '../lib/api'

interface Skill {
  name: string
  description?: string
  category?: string
  content?: string
}

export default function SkillRunner() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<Skill | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [search, setSearch] = useState('')

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const res = await getSkills()
      const list = Array.isArray(res) ? res : (res?.skills || res?.data || res || [])
      setSkills(list.filter((s: Skill) => s.name))
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSkills() }, [])

  const openSkill = async (name: string) => {
    setSelected(name)
    setDetail(null)
    setResult(null)
    setParams({})
    try {
      const res = await getSkill(name)
      setDetail(res)
    } catch {
      setDetail(null)
    }
  }

  const handleRun = async () => {
    if (!selected) return
    setRunning(true)
    setResult(null)
    try {
      const res = await runSkill(selected, params)
      setResult(res)
    } catch (e: any) {
      setResult({ ok: false, error: e.message })
    } finally {
      setRunning(false)
    }
  }

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex gap-4 h-full">
      {/* Skill List */}
      <div className={`flex flex-col ${selected ? 'w-2/5' : 'w-full'} transition-all`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-hermes-400" />
            <div>
              <h1 className="text-2xl font-bold text-hermes-300">Skill Runner</h1>
              <p className="text-sm text-gray-400">{skills.length} skill{skills.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
          <button onClick={fetchSkills} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <input
          className="input w-full mb-3"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="card h-14 animate-pulse bg-gray-800/50" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-10 h-10 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No skills found</p>
            </div>
          ) : (
            filtered.map(s => (
              <button
                key={s.name}
                onClick={() => openSkill(s.name)}
                className={`card w-full text-left flex items-center gap-3 hover:border-hermes-500/30 transition-colors ${
                  selected === s.name ? 'border-hermes-500/50' : ''
                }`}
              >
                <Zap className={`w-4 h-4 shrink-0 ${selected === s.name ? 'text-hermes-400' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Runner Panel */}
      {selected && (
        <div className="w-3/5 border-l border-gray-800 pl-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 truncate">{selected}</h2>
            <button onClick={() => setSelected(null)} className="btn-ghost text-xs">Close</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {/* Skill Info */}
            {detail && (
              <div className="card space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-hermes-400" />
                  <span className="text-sm font-medium text-gray-200">{detail.name}</span>
                  {detail.category && <span className="badge badge-gray text-xs">{detail.category}</span>}
                </div>
                {detail.description && <p className="text-sm text-gray-400">{detail.description}</p>}
              </div>
            )}

            {/* SKILL.md Preview */}
            {detail?.content && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> SKILL.md
                </p>
                <pre className="card text-xs font-mono text-gray-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {detail.content.slice(0, 2000)}
                  {detail.content.length > 2000 ? '\n...' : ''}
                </pre>
              </div>
            )}

            {/* Params */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parameters</p>
              <div className="card space-y-2">
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-xs"
                    placeholder="Param name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = (e.target as HTMLInputElement).value.trim()
                        if (name) {
                          setParams(p => ({ ...p, [name]: '' }))
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const name = prompt('Parameter name:')
                      if (name) setParams(p => ({ ...p, [name]: '' }))
                    }}
                    className="btn-ghost text-xs"
                  >
                    Add
                  </button>
                </div>
                {Object.entries(params).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 min-w-[100px]">{k}</span>
                    <input
                      className="input flex-1 text-xs"
                      value={v}
                      onChange={e => setParams(p => ({ ...p, [k]: e.target.value }))}
                      placeholder="Value..."
                    />
                    <button
                      onClick={() => setParams(p => { const n = { ...p }; delete n[k]; return n })}
                      className="text-gray-600 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {Object.keys(params).length === 0 && (
                  <p className="text-xs text-gray-600">No parameters. Click + to add or run directly.</p>
                )}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={running}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {running ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4" /> Run Skill</>
              )}
            </button>

            {/* Result */}
            {result && (
              <div className="space-y-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {result.ok ? '✓ Success' : '✗ Error'}
                </p>
                <pre className={`card text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap ${
                  result.ok ? 'text-gray-300' : 'text-red-300 bg-red-900/10'
                }`}>
                  {result.execution_output || result.error || JSON.stringify(result, null, 2)}
                </pre>
                {result.scripts_found && result.scripts_found.length > 0 && (
                  <p className="text-xs text-gray-500">Scripts: {result.scripts_found.join(', ')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
