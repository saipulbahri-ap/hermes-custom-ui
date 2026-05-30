# Hermes Agent — UI Feature Roadmap

> Task plan untuk memvisualisasikan semua fitur Hermes Agent ke dalam UI.
> Setiap task harus: implement → test locally → deploy → verify.

## Status Legend
- ⬜ Not started
- 🔄 In progress
- ✅ Done (tested & deployed)

---

## Phase 1: Core Pages Enhancement (Existing pages — fix & improve)

### 1.1 Dashboard
- ✅ System stats, quick links, system info
- ✅ Real-time health check
- ⬜ **Add:** Activity graph (sessions per day, messages per day)
- ⬜ **Add:** Recent sessions list with quick resume
- ⬜ **Add:** Skill usage stats (most used skills)
- ⬜ **Add:** Memory entries count & quick search

### 1.2 Chat
- ✅ Basic chat interface
- ✅ Session selector (pick existing session to continue)
- ⬜ **Add:** Streaming response (SSE/WebSocket)
- ⬜ **Add:** Message copy button
- ⬜ **Add:** Markdown rendering for responses
- ⬜ **Add:** Tool call display (collapsible)

### 1.3 Sessions
- ✅ Session list with search
- ✅ Session detail page (view full message history) — NEW
- ✅ Session resume (continue from last message) — NEW
- ✅ Session delete — NEW
- ⬜ **Add:** Session export (JSON/Markdown)
- ⬜ **Add:** Filter by model, date range
- ⬜ **Add:** Pagination

### 1.4 Memory
- ✅ Memory list (read from MEMORY.md)
- ⬜ **Add:** Vector memory search (semantic search)
- ⬜ **Add:** Memory create/edit/delete
- ⬜ **Add:** User profile tab
- ⬜ **Add:** Memory import/export

### 1.5 Skills
- ✅ Skill list with search & category
- ✅ Skill detail with SKILL.md preview
- ⬜ **Add:** Skill install from URL/repo
- ⬜ **Add:** Skill enable/disable toggle
- ⬜ **Add:** Skill execute/run with parameters

### 1.6 Cron Jobs
- ✅ Cron job list
- ✅ Create new cron job (form: name, schedule, prompt) — NEW
- ✅ Pause/Resume cron job — NEW
- ✅ Manual trigger (run now) — NEW
- ✅ Delete cron job — NEW
- ✅ Execution log per job — NEW
- ⬜ **Add:** Edit cron job
- ⬜ **Add:** Cron job execution history

### 1.7 Config
- ✅ YAML config tree editor
- ✅ .env editor
- ⬜ **Add:** Config validation
- ⬜ **Add:** Config diff view (before/after)
- ⬜ **Add:** Export config as file
- ⬜ **Add:** Import config from file

### 1.8 Profiles
- ✅ Profile list with activate
- ⬜ **Add:** Create new profile
- ⬜ **Add:** Delete profile
- ⬜ **Add:** Profile config editor
- ⬜ **Add:** Profile comparison view

---

## Phase 2: New Pages (Not yet implemented)

### 2.1 Session Detail `/sessions/:id`
- ⬜ Full message history view
- ⬜ Tool call detail (input/output)
- ⬜ Continue session (resume chat)
- ⬜ Export session as JSON/Markdown
- ⬜ Delete session
- ⬜ Message search within session

### 2.2 Vector Memory `/memory/search`
- ⬜ Semantic search interface
- ⬜ Search results with relevance score
- ⬜ Add new memory entry
- ⬜ Edit/delete entries
- ⬜ Collection selector
- ⬜ Import from file (PDF, TXT, MD)

### 2.3 Skill Runner `/skills/:name/run`
- ⬜ Skill parameter form (auto-detect from SKILL.md)
- ⬜ Execute skill with parameters
- ⬜ Real-time execution log
- ⬜ Execution result display
- ⬜ Execution history

### 2.4 Provider Status `/providers/status`
- ⬜ Provider health check (ping each provider)
- ⬜ Model list per provider
- ⬜ Provider latency/benchmark
- ⬜ Credential status (valid/expired)
- ⬜ Failover chain visualization

### 2.5 Gateway Monitor `/gateway/monitor`
- ⬜ Real-time message log per platform
- ⬜ Platform connection status
- ⬜ Send test message
- ⬜ Gateway restart
- ⬜ Message analytics (messages per platform/hour)

### 2.6 Kanban Board `/kanban`
- ✅ Basic board view (3 columns)
- ⬜ Drag & drop between columns
- ⬜ Add new task
- ⬜ Edit task (title, description, priority, assignee)
- ⬜ Delete task
- ⬜ Task detail modal
- ⬜ Labels/Tags
- ⬜ Due dates

---

## Phase 3: System & Security

### 3.1 Auth & Security
- ✅ Login page (API key)
- ✅ Auth guard (localStorage)
- ✅ Auto-reload on 403
- ✅ Logout button
- ⬜ **Add:** API key generation (admin)
- ⬜ **Add:** Multiple API keys (read/write roles)
- ⬜ **Add:** Key expiry & rotation
- ⬜ **Add:** Audit log (who did what)

### 3.2 Settings `/settings`
- ⬜ UI preferences (theme, sidebar, refresh interval)
- ⬜ Notification settings
- ⬜ API key management
- ⬜ Language selector
- ⬜ Export/Import UI settings

### 3.3 System Monitor `/system`
- ⬜ CPU/Memory/Disk usage graphs
- ⬜ Process list (PM2)
- ⬜ Environment variables viewer
- ⬜ Hermes version info
- ⬜ Log level control

---

## Phase 4: Polish & UX

### 4.1 UI/UX
- ⬜ Mobile responsive design
- ⬜ Dark/Light theme toggle
- ⬜ Keyboard shortcuts
- ⬜ Global search (Cmd+K)
- ⬜ Breadcrumbs navigation
- ⬜ Toast notifications
- ⬜ Loading skeletons for all pages
- ⬜ Empty state illustrations

### 4.2 Performance
- ⬜ Virtual scrolling for large lists
- ⬜ Debounced search
- ⬜ Lazy loading for page components
- ⬜ API response caching
- ⬜ Optimistic updates

---

## Implementation Order

### Sprint 1 (Week 1)
1. Session Detail page
2. Cron job CRUD (create, edit, pause, delete)
3. Streaming chat (SSE)
4. Mobile responsive

### Sprint 2 (Week 2)
1. Vector Memory search
2. Skill Runner
3. Provider Status
4. Gateway Monitor

### Sprint 3 (Week 3)
1. Kanban drag & drop
2. Settings page
3. System Monitor
4. Global search

### Sprint 4 (Week 4)
1. Auth enhancement (multi-key, roles)
2. Audit log
3. Polish & UX
4. Performance optimization

---

## Notes
- All features must be tested locally before deploy
- Use feature flags for incomplete features
- Keep backward compatibility with existing API
- Document new API endpoints in OpenAPI/Swagger
