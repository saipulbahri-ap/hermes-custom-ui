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

const WS_URL = 'ws://localhost:8643/api/ws'

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

  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setReconnecting(false)

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setReconnecting(false)
    }

    ws.onclose = () => {
      setConnected(false)
      setReconnecting(true)
      setTimeout(connect, 3000)
    }

    ws.onmessage = (msg: MessageEvent) => {
      try {
        const parsed: LiveEvent = JSON.parse(msg.data)

        if (parsed.type === '__backlog__') {
          setEvents(parsed.data?.events || [])
          return
        }

        setEvents(prev => {
          const next = [...prev, parsed]
          return next.length > 500 ? next.slice(-500) : next
        })

        // Track agents - safe capture
        const aid = parsed.agent_id
        if (aid) {
          setAgents(prev => {
            const next = new Map(prev)
            const existing = next.get(aid)
            next.set(aid, {
              id: aid,
              name: aid,
              status: (parsed.status as AgentInfo['status']) || existing?.status || 'idle',
              lastSeen: parsed.timestamp,
            })
            return next
          })
        }

        // Build delegation tree
        const pid = parsed.parent_id
        if (parsed.type === 'delegation' && pid && aid) {
          setTree(prev => {
            const newTree = prev.map(n => ({ ...n, children: [...n.children] }))

            const childNode: TreeNode = {
              agent: {
                id: aid!,
                name: aid!,
                status: 'idle',
                lastSeen: parsed.timestamp,
              },
              children: [],
            }

            const addChild = (nodes: TreeNode[]): boolean => {
              for (const node of nodes) {
                if (node.agent.id === pid!) {
                  node.children.push(childNode)
                  return true
                }
                if (addChild(node.children)) return true
              }
              return false
            }

            if (!addChild(newTree)) {
              newTree.push(childNode)
            }
            return newTree
          })
        }

        // agent_start without parent_id — add as root
        if (parsed.type === 'agent_start' && aid && !pid) {
          setTree(prev => {
            if (prev.some(n => n.agent.id === aid!)) return prev
            return [...prev, {
              agent: {
                id: aid!,
                name: aid!,
                status: 'idle',
                lastSeen: parsed.timestamp,
              },
              children: [],
            }]
          })
        }

      } catch { /* ignore parse errors */ }
    }
  }, [])

  useEffect(() => { connect() }, [connect])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [events])

  const eventType = (type: string) => type.replace(/_/g, ' ')
  const ago = (ts: string) => {
    const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    return sec < 60 ? `${sec}s` : sec < 3600 ? `${Math.floor(sec/60)}m` : `${Math.floor(sec/3600)}h`
  }

  const renderTree = (nodes: TreeNode[], depth = 0) => (
    <ul className={`space-y-1 ${depth > 0 ? 'ml-6 border-l border-gray-700 pl-4' : ''}`}>
      {nodes.map((node, i) => (
        <li key={`${node.agent.id}-${i}`}>
          <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-800/50">
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-sm font-medium">{node.agent.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${statusConfig[node.agent.status]?.bg || 'bg-gray-700'} ${statusConfig[node.agent.status]?.color || 'text-gray-300'}`}>
              {node.agent.status}
            </span>
          </div>
          {node.children.length > 0 && renderTree(node.children, depth + 1)}
        </li>
      ))}
    </ul>
  )

  const agentEntries = Array.from(agents.entries())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Radio className="w-6 h-6 text-hermes-400" />
        <h1 className="text-2xl font-bold">Live Monitoring</h1>
        <span className={`flex items-center gap-1.5 text-sm ml-auto ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} ${connected ? 'animate-pulse' : ''}`} />
          {connected ? 'Connected' : reconnecting ? 'Reconnecting...' : 'Disconnected'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status Cards */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Agents ({agentEntries.length})
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agentEntries.map(([id, agent]) => {
              const StatusIcon = statusConfig[agent.status]?.icon || Activity
              return (
                <div key={id} className="card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{agent.name}</span>
                    <StatusIcon className={`w-4 h-4 ${statusConfig[agent.status]?.color || 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusConfig[agent.status]?.bg || 'bg-gray-700'} ${statusConfig[agent.status]?.color || 'text-gray-300'}`}>
                      {agent.status}
                    </span>
                    <span className="text-xs text-gray-500">{ago(agent.lastSeen)} ago</span>
                  </div>
                </div>
              )
            })}
            {agentEntries.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No agents active. Start using Hermes to see live activity.</p>
            )}
          </div>

          {/* Tree */}
          {tree.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4" /> Agent Tree
              </h2>
              <div className="card p-3 text-sm max-h-[300px] overflow-y-auto">
                {renderTree(tree)}
              </div>
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" /> Event Feed
            <span className="text-xs text-gray-500 font-normal">({events.length} events)</span>
          </h2>
          <div className="card p-0 overflow-hidden">
            <div className="h-[600px] overflow-y-auto font-mono text-xs p-3 space-y-1 bg-gray-950/50">
              {events.length === 0 && (
                <p className="text-gray-500 text-center pt-8">Waiting for events...</p>
              )}
              {events.map((ev, i) => (
                <div key={i} className={`px-2 py-1 rounded border ${eventColors[ev.type] || 'text-gray-400 bg-gray-800 border-gray-700'}`}>
                  <span className="text-gray-500 mr-2">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  <span className="font-medium">{ev.type}</span>
                  {ev.agent_id && <span className="text-gray-400 ml-2">[{ev.agent_id}]</span>}
                  {ev.data && Object.keys(ev.data).length > 0 && (
                    <span className="text-gray-500 ml-2 truncate max-w-[300px] inline-block align-bottom">
                      {JSON.stringify(ev.data).slice(0, 120)}
                    </span>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
