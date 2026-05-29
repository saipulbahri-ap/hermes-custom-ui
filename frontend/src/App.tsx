import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import Sessions from './pages/Sessions'
import Memory from './pages/Memory'
import Skills from './pages/Skills'
import Cron from './pages/Cron'
import Config from './pages/Config'
import Profiles from './pages/Profiles'
import Tools from './pages/Tools'
import Gateway from './pages/Gateway'
import Providers from './pages/Providers'
import Kanban from './pages/Kanban'
import Logs from './pages/Logs'
import Plugins from './pages/Plugins'
import Live from './pages/Live'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/cron" element={<Cron />} />
        <Route path="/config" element={<Config />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/gateway" element={<Gateway />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/plugins" element={<Plugins />} />
        <Route path="/live" element={<Live />} />
      </Routes>
    </Layout>
  )
}
