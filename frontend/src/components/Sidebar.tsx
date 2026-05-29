import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, History, Brain, Code2,
  Clock, Settings, Users, Wrench, Radio, Cpu, Columns3,
  FileText, Puzzle, Activity,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', short: 'Home' },
  { to: '/chat', icon: MessageSquare, label: 'Chat', short: 'Chat' },
  { to: '/sessions', icon: History, label: 'Sessions', short: 'Sessions' },
  { to: '/memory', icon: Brain, label: 'Memory', short: 'Memory' },
  { to: '/skills', icon: Code2, label: 'Skills', short: 'Skills' },
  { to: '/cron', icon: Clock, label: 'Cron Jobs', short: 'Cron' },
  { to: '/config', icon: Settings, label: 'Config', short: 'Config' },
  { to: '/profiles', icon: Users, label: 'Profiles', short: 'Profiles' },
  { to: '/tools', icon: Wrench, label: 'Tools', short: 'Tools' },
  { to: '/gateway', icon: Radio, label: 'Gateway', short: 'Gateway' },
  { to: '/providers', icon: Cpu, label: 'Providers', short: 'Providers' },
  { to: '/kanban', icon: Columns3, label: 'Kanban', short: 'Kanban' },
  { to: '/logs', icon: FileText, label: 'Logs', short: 'Logs' },
  { to: '/live', icon: Activity, label: 'Live', short: 'Live' },
  { to: '/plugins', icon: Puzzle, label: 'Plugins', short: 'Plugins' },
]

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const loc = useLocation()

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-200 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-800">
        <button onClick={onToggle} className="text-hermes-400 hover:text-hermes-300 transition-colors">
          <Activity className="w-5 h-5" />
        </button>
        {!collapsed && <span className="font-bold text-hermes-300">Hermes UI</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, short }) => {
          const active = loc.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-hermes-600/20 text-hermes-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
              title={label}
            >
              <Icon className="sidebar-icon shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
          Hermes Custom UI v1.0
        </div>
      )}
    </aside>
  )
}
