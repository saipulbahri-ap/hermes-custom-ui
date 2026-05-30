import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Plus, MessageSquare, Cpu } from 'lucide-react'
import { chat, models } from '../lib/api'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [modelList, setModelList] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    models().then((res) => {
      // Handle various response formats
      let list: string[] = []
      if (Array.isArray(res)) {
        list = res.map((m: any) => typeof m === 'string' ? m : (m.id || m.name || m.model || ''))
      } else if (res && typeof res === 'object') {
        const raw = res.models || res.data || res.providers || []
        if (Array.isArray(raw)) {
          list = raw.map((m: any) => typeof m === 'string' ? m : (m.id || m.name || m.model || ''))
        }
      }
      list = list.filter(Boolean)
      if (list.length === 0) {
        // Default models
        list = ['openrouter/owl-alpha', 'openrouter/deepseek/deepseek-chat']
      }
      setModelList(list)
      if (list.length && !selectedModel) setSelectedModel(list[0])
    }).catch(() => {
      setModelList(['openrouter/owl-alpha'])
      setSelectedModel('openrouter/owl-alpha')
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setSending(true)
    try {
      const res = await chat(text, selectedModel || undefined, sessionId)
      const reply = res?.reply || res?.message || res?.response || res?.content || JSON.stringify(res)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
      if (res?.session_id) setSessionId(res.session_id)
    } catch (e: any) {
      setError(e.message)
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setSending(false)
    }
  }

  const newChat = () => {
    setMessages([])
    setSessionId(undefined)
    setError('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-hermes-300">Chat</h1>
          <p className="text-sm text-gray-400">Talk to Hermes AI</p>
        </div>
        <div className="flex items-center gap-2">
          {modelList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-gray-500" />
              <select
                className="input text-xs max-w-[200px]"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {modelList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={newChat} className="btn-ghost text-xs flex items-center gap-1">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-700" />
            <p className="text-sm">Start a conversation with Hermes</p>
            <p className="text-xs text-gray-600 mt-1">
              Model: {selectedModel || 'default'}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-hermes-600/20 text-hermes-200 border border-hermes-500/20'
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}
            >
              <p className="text-xs font-semibold mb-1 opacity-60">
                {msg.role === 'user' ? 'You' : 'Hermes'}
              </p>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
              <Loader2 className="w-5 h-5 animate-spin text-hermes-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="btn-primary flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
