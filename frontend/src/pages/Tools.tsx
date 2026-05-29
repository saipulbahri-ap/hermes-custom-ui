import React, { useState, useEffect } from 'react'
import { Wrench, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { getTools } from '../lib/api'

interface Tool {
  name: string
  description?: string
}

interface ToolGroup {
  toolset: string
  tools: Tool[]
}

export default function Tools() {
  const [groups, setGroups] = useState<ToolGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const fetchTools = async () => {
    setLoading(true)
    try {
      const res = await getTools()
      const data = res?.tools || res?.data || res || []

      if (Array.isArray(data)) {
        // If data is flat array, wrap in single group
        const tools = data as Tool[]
        setGroups([{ toolset: 'All Tools', tools }])
      } else if (data && typeof data === 'object') {
        // If grouped by toolset key
        const entries = Object.entries(data)
        const grouped: ToolGroup[] = entries.map(([toolset, tools]) => ({
          toolset,
          tools: Array.isArray(tools) ? (tools as Tool[]) : [],
        }))
        setGroups(grouped)
      } else {
        setGroups([])
      }
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [])

  const toggleGroup = (name: string) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-hermes-300" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Tools</h1>
            <p className="text-sm text-gray-400">Available tools grouped by toolset</p>
          </div>
        </div>
        <button onClick={fetchTools} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading */}
      {loading && groups.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-gray-800/50" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Wrench className="w-10 h-10 mb-2 text-gray-700" />
          <p className="text-sm">No tools found</p>
        </div>
      ) : (
        /* Tool groups */
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {groups.map((group) => {
            const isCollapsed = collapsed[group.toolset] ?? false
            return (
              <div key={group.toolset} className="card p-0 overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.toolset)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-300">
                    {group.toolset}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{group.tools.length}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </span>
                </button>

                {/* Tool cards */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-800">
                    {group.tools.map((tool) => (
                      <div key={tool.name} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
                        <p className="text-sm font-medium text-gray-200">{tool.name}</p>
                        {tool.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
                        )}
                      </div>
                    ))}
                    {group.tools.length === 0 && (
                      <p className="px-4 py-3 text-xs text-gray-600">No tools in this group</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
