import React, { useState, useEffect } from 'react'
import {
  Settings, Save, RefreshCw, Plus, Trash2,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { getConfig, putConfig } from '../lib/api'

export default function Config() {
  const [yamlConfig, setYamlConfig] = useState<Record<string, any>>({})
  const [envConfig, setEnvConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['_root']))
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [activeTab, setActiveTab] = useState<'yaml' | 'env'>('yaml')

  const fetchConfig = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getConfig()
      setYamlConfig(res?.yaml || res?.config || {})
      setEnvConfig(res?.env || {})
    } catch (e: any) {
      setError(e.message)
      setYamlConfig({})
      setEnvConfig({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await putConfig({ yaml: yamlConfig, env: envConfig })
      setSuccess('Configuration saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const config = activeTab === 'yaml' ? yamlConfig : envConfig
  const setConfig = activeTab === 'yaml' ? setYamlConfig : setEnvConfig

  const addKey = () => {
    const k = newKey.trim()
    if (!k) return
    setConfig((c: any) => ({ ...c, [k]: newVal || '' }))
    setNewKey('')
    setNewVal('')
  }

  const removeKey = (key: string) => {
    setConfig((c: any) => {
      const next = { ...c }
      delete next[key]
      return next
    })
  }

  const updateKey = (key: string, val: any) => {
    setConfig((c: any) => ({ ...c, [key]: val }))
  }

  const renderValue = (key: string, val: any, path: string): React.ReactNode => {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const isOpen = expanded.has(path)
      const entries = Object.entries(val)
      return (
        <div>
          <button
            onClick={() => toggle(path)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 py-0.5"
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="font-medium text-gray-300">{key}</span>
            <span className="text-gray-600">({entries.length} keys)</span>
          </button>
          {isOpen && (
            <div className="ml-4 border-l border-gray-700 pl-3 space-y-0.5">
              {entries.map(([k, v]) => (
                <div key={k}>{renderValue(k, v, `${path}.${k}`)}</div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 py-0.5 group">
        <span className="text-xs text-gray-400 min-w-[120px] truncate">{key}</span>
        <input
          className="input flex-1 text-xs py-1"
          value={String(val ?? '')}
          onChange={(e) => updateKey(key, e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-hermes-300">Configuration</h1>
          <p className="text-sm text-gray-400">System settings & preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchConfig} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-1 text-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('yaml')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'yaml'
              ? 'text-hermes-300 border-hermes-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          config.yaml ({Object.keys(yamlConfig).length})
        </button>
        <button
          onClick={() => setActiveTab('env')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'env'
              ? 'text-hermes-300 border-hermes-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          .env ({Object.keys(envConfig).length})
        </button>
      </div>

      {/* Add Key (yaml only) */}
      {activeTab === 'yaml' && (
        <div className="card mb-4 flex items-center gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-[140px] text-xs"
            placeholder="Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            className="input flex-1 min-w-[140px] text-xs"
            placeholder="Value"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
          />
          <button onClick={addKey} className="btn-primary text-xs flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      )}

      {/* Config Tree / Env list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && Object.keys(config).length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-10 animate-pulse bg-gray-800/50" />
            ))}
          </div>
        ) : Object.keys(config).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Settings className="w-10 h-10 mb-2 text-gray-700" />
            <p className="text-sm">
              {activeTab === 'yaml' ? 'No config.yaml data' : 'No .env data'}
            </p>
          </div>
        ) : activeTab === 'env' ? (
          /* Env: flat key-value pairs */
          <div className="card space-y-2">
            {Object.entries(config).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 group">
                <span className="text-xs font-mono text-gray-400 min-w-[180px] truncate">{key}</span>
                <input
                  className="input flex-1 text-xs py-1"
                  value={String(val ?? '')}
                  onChange={(e) => updateKey(key, e.target.value)}
                />
                <button
                  onClick={() => removeKey(key)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* YAML: tree view */
          <div className="card space-y-1">
            {Object.entries(config).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2 group">
                <div className="flex-1 min-w-0">
                  {renderValue(key, val, `_root.${key}`)}
                </div>
                <button
                  onClick={() => removeKey(key)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 mt-1"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
