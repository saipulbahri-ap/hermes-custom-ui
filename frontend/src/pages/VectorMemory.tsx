import React, { useState, useEffect } from 'react'
import { Brain, Search, Plus, Trash2, Database, RefreshCw, FileText, X } from 'lucide-react'
import { getVectorMemoryCollections, vectorMemorySearch, vectorMemoryAdd, vectorMemoryDelete } from '../lib/api'

interface VMDoc {
  content: string
  metadata: Record<string, any>
  score: number
}

interface VMCollection {
  name: string
  count: number
  metadata: Record<string, any>
}

export default function VectorMemory() {
  const [collections, setCollections] = useState<VMCollection[]>([])
  const [selectedCol, setSelectedCol] = useState('general')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VMDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addContent, setAddContent] = useState('')
  const [addMeta, setAddMeta] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const flash = (setter: (v: string) => void, msg: string) => {
    setter(msg)
    setTimeout(() => setter(''), 3000)
  }

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const res = await getVectorMemoryCollections()
      const list = Array.isArray(res) ? res : (res?.collections || res?.data || [])
      setCollections(list)
      if (list.length > 0 && !selectedCol) setSelectedCol(list[0].name)
    } catch (e) {
      console.error(e)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCollections() }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError('')
    try {
      const res = await vectorMemorySearch(query, selectedCol, 10)
      const r = res?.results || res?.data || (Array.isArray(res) ? res : [])
      setResults(r)
    } catch (e: any) {
      setError(e.message)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addContent.trim()) return
    try {
      let meta: Record<string, any> = {}
      if (addMeta.trim()) {
        try { meta = JSON.parse(addMeta) } catch { meta = { source: addMeta } }
      }
      await vectorMemoryAdd(selectedCol, addContent, meta)
      setAddContent('')
      setAddMeta('')
      setShowAdd(false)
      flash(setSuccess, 'Entry added successfully')
      fetchCollections()
    } catch (e: any) {
      flash(setError, e.message)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      await vectorMemoryDelete(selectedCol, entryId)
      setResults(results.filter(r => (r as any).id !== entryId && r.content !== entryId))
      flash(setSuccess, 'Entry deleted')
      fetchCollections()
    } catch (e: any) {
      flash(setError, e.message)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.5) return 'text-yellow-400'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Vector Memory</h1>
            <p className="text-sm text-gray-400">Semantic search across memory collections</p>
          </div>
        </div>
        <button onClick={fetchCollections} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">{error}</div>}
      {success && <div className="px-4 py-2 rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm">{success}</div>}

      {/* Collections */}
      <div className="flex gap-2 flex-wrap">
        {collections.length === 0 ? (
          <p className="text-gray-500 text-sm">No collections found</p>
        ) : (
          collections.map(c => (
            <button
              key={c.name}
              onClick={() => setSelectedCol(c.name)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                selectedCol === c.name
                  ? 'bg-hermes-600/20 text-hermes-300 border border-hermes-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {c.name}
              <span className="text-xs text-gray-500">({c.count})</span>
            </button>
          ))
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input w-full pl-9"
            placeholder="Search memories semantically..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" disabled={searching || !query.trim()} className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50">
          {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-ghost flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="card space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className={`text-xs font-mono ${scoreColor(r.score)}`}>
                      {(r.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete((r as any).id || r.content.slice(0, 20))}
                    className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{r.content}</p>
                {r.metadata && Object.keys(r.metadata).length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {Object.entries(r.metadata).map(([k, v]) => (
                      <span key={k} className="text-xs text-gray-500 bg-gray-800 rounded px-1.5 py-0.5">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {query.trim() && !searching && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-10 h-10 mx-auto mb-2 text-gray-700" />
          <p className="text-sm">No matching memories found</p>
          <p className="text-xs text-gray-600 mt-1">Try different keywords or add memories manually</p>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-hermes-400" />
                <h2 className="text-lg font-semibold text-gray-200">Add Memory Entry</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="btn-ghost p-1 text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Collection</label>
                <select className="input w-full" value={selectedCol} onChange={e => setSelectedCol(e.target.value)}>
                  {collections.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value="general">general</option>
                  <option value="project-sikessos">project-sikessos</option>
                  <option value="project-9router">project-9router</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Content *</label>
                <textarea
                  className="input w-full min-h-[120px] resize-y text-sm"
                  placeholder="Enter memory content..."
                  value={addContent}
                  onChange={e => setAddContent(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Metadata (JSON, optional)</label>
                <input
                  className="input w-full text-xs font-mono"
                  placeholder='{"source": "manual", "topic": "..."}'
                  value={addMeta}
                  onChange={e => setAddMeta(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={!addContent.trim()} className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
