import React, { useState, useEffect } from 'react'
import { Radio, RefreshCw, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getGatewayChannels, getGatewayMessages } from '../lib/api'

interface GatewayChannel {
  name: string
  enabled: boolean
  type: string
  connected: boolean | null
}

interface GatewayMessage {
  timestamp: string
  source: string
  message: string
}

export default function GatewayMonitor() {
  const [channels, setChannels] = useState<GatewayChannel[]>([])
  const [messages, setMessages] = useState<GatewayMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [msgLimit, setMsgLimit] = useState(50)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [chRes, msgRes] = await Promise.all([
        getGatewayChannels(),
        getGatewayMessages(msgLimit),
      ])
      setChannels(Array.isArray(chRes) ? chRes : (chRes?.channels || chRes?.data || []))
      const msgs = msgRes?.messages || msgRes?.data || (Array.isArray(msgRes) ? msgRes : [])
      setMessages(msgs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [msgLimit])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-hermes-400" />
          <div>
            <h1 className="text-2xl font-bold text-hermes-300">Gateway Monitor</h1>
            <p className="text-sm text-gray-400">Real-time gateway status & message log</p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Channels */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Channels</h2>
        {channels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Radio className="w-10 h-10 mx-auto mb-2 text-gray-700" />
            <p className="text-sm">No gateway channels configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map(ch => (
              <div key={ch.name} className="card">
                <div className="flex items-center gap-3">
                  {ch.connected === true ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : ch.connected === false ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 capitalize">{ch.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`badge text-xs ${ch.enabled ? 'badge-green' : 'badge-gray'}`}>
                        {ch.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className={`text-xs ${
                        ch.connected === true ? 'text-green-400' :
                        ch.connected === false ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {ch.connected === true ? 'Connected' : ch.connected === false ? 'Disconnected' : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Message Log</h2>
          <select
            className="input text-xs w-32"
            value={msgLimit}
            onChange={e => setMsgLimit(Number(e.target.value))}
          >
            <option value={25}>Last 25</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
          </select>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="h-96 overflow-y-auto font-mono text-xs p-3 space-y-0.5 bg-gray-950/50">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No gateway messages found</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className="py-1 border-b border-gray-800/30 last:border-0">
                  <span className="text-gray-500 mr-2">{m.timestamp || '—'}</span>
                  <span className="text-gray-600 mr-2">[{m.source}]</span>
                  <span className="text-gray-300">{m.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
