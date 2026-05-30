import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { health } from '../lib/api';
import { LogOut } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [h, setH] = useState<any>(null)

  useEffect(() => {
    health().then(setH).catch(() => setH(null))
    const id = setInterval(() => health().then(setH).catch(() => setH(null)), 10000)
    return () => clearInterval(id)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('hermes_api_key')
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-11 flex items-center justify-between px-5 bg-gray-900/50 border-b border-gray-800 gap-3 text-xs">
          <div className="flex items-center gap-3">
            {h && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-400">API Online</span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">{h.sessions_count} sessions</span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">uptime {h.uptime}s</span>
              </>
            )}
            {!h && <span className="text-gray-500">Connecting...</span>}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </header>
        {/* Content */}
        <main className="flex-1 p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
