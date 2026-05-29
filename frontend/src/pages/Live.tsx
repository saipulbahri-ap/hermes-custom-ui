import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, Radio, Cpu, GitBranch, AlertCircle, Brain, Wrench } from 'lucide-react'

interface LiveEvent {
  type: string
  timestamp: string
  data: any
  agent_id?: string
  parent_id?: string
  status?: string
}

interface AgentInfo {
  id: string
  name: string
  status: 'idle' | 'thinking' | 'tool_call' | 'error'
  lastSeen: string
}

interface TreeNode {
  agent: AgentInfo
  children: TreeNode[]
}

const WS_URL = 'ws://localhost:8643/ws'

const eventColors: Record<string, string> = {
  agent_start: 'text-green-400 bg-green-400/10 border-green-400/30',
  agent_status: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  delegation: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  tool_call: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  message: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  error: 'text-red-400 bg-red-400/10 border-red-400/30',
  thinking: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  raw: 'text-gray-400 bg-gray-800 border-gray-700',
}

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  idle: { color: 'text-green-400', icon: Activity, bg: 'bg-green-400/10' },
  thinking: { color: 'text-indigo-400', icon: Brain, bg: 'bg-indigo-400/10' },
  tool_call: { color: 'text-yellow-400', icon: Wrench, bg: 'bg-yellow-400/10' },
  error: { color: 'text-red-400', icon: AlertCircle, bg: 'bg-red-400/10' },
}

export default function Live() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [agents, setAgents] = useState<Map<string, AgentInfo>>(new Map())
  const [tree, setTree] = useState<TreeNode[]>([])
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  // Auto-scroll feed to bottom on new events
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return
    setReconnecting(true)
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null
      connect()
    }, 3000)
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(WS_URL)
      socketRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setReconnecting(false)
      }

      ws.onmessage = (msg) => {
        try {
          const parsed: LiveEvent = JSON.parse(msg.data)

          setEvents(prev => {
            const next = [...prev, parsed]
            return next.length > 500 ? next.slice(-500) : next
          })

          // Track agents
          if (parsed.agent_id) {
            setAgents(prev => {
              const next = new Map(prev)
              const existing = next.get(parsed.agent_id)
              next.set(parsed.agent_id, {
                id: parsed.agent_id,
                name: parsed.agent_id,
                status: (parsed.status as AgentInfo['status']) || existing?.status || 'idle',
                lastSeen: parsed.timestamp,
              })
              return next
            })
          }

          // Build delegation tree
          if (parsed.type === 'delegation' && parsed.parent_id && parsed.agent_id) {
            setTree(prev => {
              const newTree = prev.map(n => ({ ...n, children: [...n.children] }))

              const childNode: TreeNode = {
                agent: {
                  id: parsed.agent_id,
                  name: parsed.agent_id,
                  status: 'idle',
                  lastSeen: parsed.timestamp,
                },
                children: [],
              }

              const addChild = (nodes: TreeNode[]): boolean => {
                for (const node of nodes) {
                  if (node.agent.id === parsed.parent_id) {
                    node.children.push(childNode)
                    return true
                  }
                  if (addChild(node.children)) return true
                }
                return false
              }

              if (!addChild(newTree)) {
                // parent not found in existing tree — add as root
                newTree.push(childNode)
              }
              return newTree
            })
          }

          // agent_start without parent_id — add as root
          if (parsed.type === 'agent_start' && parsed.agent_id && !parsed.parent_id) {
            setTree(prev => {
              if (prev.some(n => n.agent.id === parsed.agent_id)) return prev
              return [...prev, {
                agent: {
                  id: parsed.agent_id,
                  name: parsed.agent_id,
                  status: 'idle',
                  lastSeen: parsed.timestamp,
                },
                children: [],
              }]
            })
          }
        } catch {
          // non-JSON message — push as raw event
          setEvents(prev => {
            const next = [...prev, {
              type: 'raw',
              timestamp: new Date().toISOString(),
              data: msg.data,
            }]
            return next.length > 500 ? next.slice(-500) : next
          })
        }
      }

      ws.onclose = () => {
        setConnected(false)
        scheduleReconnect()
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      scheduleReconnect()
    }
  }, [scheduleReconnect])

  useEffect(() => {
    connect()
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString()
    } catch {
      return ts
    }
  }

  const truncate = (str: string, max = 100) => {
    if (str.length <= max) return str
    return str.slice(0, max) + '...'
  }

  const renderEventFeed = () => (
    <div
      ref={feedRef}
      className="h-full overflow-auto bg-black/60 rounded-lg border border-gray-800 p-3 font-mono text-xs leading-relaxed"
    >
      {events.length === 0 ? (
        <div className="text-gray-600 text-center py-10">
          Waiting for events...
        </div>
      ) : (
        events.map((ev, i) => (
          <div key={i} className="flex items-start gap-2 py-1 border-b border-gray-800/40 last:border-0 hover:bg-gray-800/20">
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${eventColors[ev.type] || eventColors.raw}`}>
              {ev.type.toUpperCase()}
            </span>
            <span className="shrink-0 text-gray-500 w-[70px]">{formatTime(ev.timestamp)}</span>
            <span className="text-gray-300 break-all">
              {typeof ev.data === 'string' ? truncate(ev.data) : truncate(JSON.stringify(ev.data))}
            </span>
          </div>
        ))
      )}
    </div>
  )

  const renderAgentCards = () => (
    <div className="grid grid-cols-1 gap-2 max-h-[260px] overflow-y-auto pr-1">
      {agents.size === 0 ? (
        <div className="text-gray-500 text-sm text-center py-4">
          No agents detected yet
        </div>
      ) : (
        Array.from(agents.values()).map(agent => {
          const cfg = statusConfig[agent.status] || statusConfig.idle
          const Icon = cfg.icon
          return (
            <div key={agent.id} className="card flex items-center gap-3 p-2.5">
              <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-200 truncate">{agent.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {agent.status}
                  </span>
                  <span className="text-[10px] text-gray-500">{formatTime(agent.lastSeen)}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  const renderTreeNode = (node: TreeNode, depth = 0) => (
    <div key={node.agent.id} style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-2 py-1">
        <GitBranch className="w-3 h-3 text-purple-400 shrink-0" />
        <span className="text-sm text-gray-200 truncate">{node.agent.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusConfig[node.agent.status]?.bg || 'bg-gray-800'} ${statusConfig[node.agent.status]?.color || 'text-gray-400'}`}>
          {node.agent.status}
        </span>
      </div>
      {node.children.map(child => renderTreeNode(child, depth + 1))}
    </div>
  )

  const renderTree = () => (
    <div className="bg-black/60 rounded-lg border border-gray-800 p-3 min-h-[60px] max-h-[200px] overflow-y-auto">
      {tree.length === 0 ? (
        <div className="text-gray-600 text-sm text-center py-4">
          No delegation events yet
        </div>
      ) : (
        tree.map(node => renderTreeNode(node))
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Live Monitor</h1>
            <p className="text-sm text-gray-400">
              Real-time event feed · {events.length} events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected ? 'bg-green-400' : 'bg-red-400'
            } ${reconnecting ? 'animate-pulse' : ''}`}
          />
          <span className="text-xs text-gray-500">
            {connected ? 'Connected' : reconnecting ? 'Reconnecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Live Feed (3/5 width on large) */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Event Feed
          </h2>
          <div className="flex-1 min-h-0">
            {renderEventFeed()}
          </div>
        </div>

        {/* Right panel (2/5 width on large) */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* Agent Status */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Agents ({agents.size})
            </h2>
            {renderAgentCards()}
          </div>

          {/* Delegation Tree */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Agent Tree
            </h2>
            {renderTree()}
          </div>
        </div>
      </div>
    </div>
  )
}
