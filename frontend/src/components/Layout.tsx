import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { health } from '../lib/api'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [h, setH] = useState<any>(null)

  useEffect(() => {
    health().then(setH).catch(() => setH(null))
    const id = setInterval(() => health().then(setH).catch(() => setH(null)), 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-11 flex items-center justify-end px-5 bg-gray-900/50 border-b border-gray-800 gap-3 text-xs">
          {h && (
            <>
              <span className={`inline-block w-2 h-2 rounded-full ${h.api_server ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-400">{h.api_server ? 'API OK' : 'API Down'}</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400">{h.sessions_count} sessions</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400">uptime {h.uptime}s</span>
            </>
          )}
          {!h && <span className="text-gray-500">Connecting...</span>}
        </header>
        {/* Content */}
        <main className="flex-1 p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
