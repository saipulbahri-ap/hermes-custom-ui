import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import ErrorBoundary from './components/ErrorBoundary'
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
import SessionDetail from './pages/SessionDetail'
import VectorMemory from './pages/VectorMemory'
import SkillRunner from './pages/SkillRunner'
import ProviderHealth from './pages/ProviderHealth'
import GatewayMonitor from './pages/GatewayMonitor'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <ErrorBoundary>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/cron" element={<Cron />} />
              <Route path="/config" element={<Config />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/gateway" element={<Gateway />} />
              <Route path="/gateway/monitor" element={<GatewayMonitor />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/providers/health" element={<ProviderHealth />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/plugins" element={<Plugins />} />
              <Route path="/live" element={<Live />} />
              <Route path="/vector-memory" element={<VectorMemory />} />
              <Route path="/skill-runner" element={<SkillRunner />} />
            </Routes>
          </Layout>
        </ErrorBoundary>
      </AuthGuard>
    </ErrorBoundary>
  )
}
