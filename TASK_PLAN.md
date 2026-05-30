> Last updated: 2026-05-30
> Sprint 1: ✅ Complete
> Sprint 2: ✅ Complete — code ready, needs deploy

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
- ✅ Model selector
- ✅ Error handling with fallback models
- ⬜ **Add:** Streaming response (SSE/WebSocket)
- ⬜ **Add:** Message copy button
- ⬜ **Add:** Markdown rendering for responses
- ⬜ **Add:** Tool call display (collapsible)

### 1.3 Sessions
- ✅ Session list with search
- ✅ Session detail (messages, tool_calls, metadata)
- ✅ Dynamic column detection (compatible with any DB schema)
- ✅ Session delete
- ⬜ **Add:** Session export (JSON/Markdown)
- ⬜ **Add:** Filter by model, date range
- ⬜ **Add:** Pagination

### 1.4 Memory
- ✅ Memory list (read from MEMORY.md / USER.md)
- ✅ Tab switching (Agent Memory / User Profile)
- ✅ Frontmatter parsing
- ⬜ **Add:** Vector memory search (semantic search)
- ⬜ **Add:** Memory create/edit/delete
- ⬜ **Add:** Memory import/export

### 1.5 Skills
- ✅ Skill list with search & category
- ✅ Skill detail with SKILL.md preview
- ✅ Recursive skill scanning (categories/subdirs)
- ⬜ **Add:** Skill install from URL/repo
- ⬜ **Add:** Skill execute/run with parameters
- ⬜ **Add:** Skill enable/disable toggle

### 1.6 Cron Jobs
- ✅ Cron job list with status badges
- ✅ Create new cron job (form: name, schedule, prompt)
- ✅ Pause/Resume cron job
- ✅ Manual trigger (run now)
- ✅ Delete cron job
- ✅ Execution details expansion
- ⬜ **Add:** Edit cron job
- ⬜ **Add:** Full execution history

### 1.7 Config
- ✅ YAML config tree editor
- ✅ .env editor (flat key-value)
- ✅ Secret masking (tokens, keys, passwords)
- ⬜ **Add:** Config validation
- ⬜ **Add:** Config diff view
- ⬜ **Add:** Export/Import config

### 1.8 Profiles
- ✅ Profile list with activate
- ✅ Skills/plugins count per profile
- ⬜ **Add:** Create new profile
- ⬜ **Add:** Delete profile
- ⬜ **Add:** Profile config editor

---

## Phase 2: New Pages

### 2.1 Session Detail `/sessions/:id`
- ✅ Full message history
- ✅ Tool call display
- ✅ Resume session
- ✅ Delete session
- ⬜ **Add:** Export session
- ⬜ **Add:** Message search within session

### 2.2 Vector Memory `/vector-memory`
- ⬜ Semantic search interface
- ⬜ Search results with relevance score
- ⬜ Add/edit/delete entries
- ⬜ Collection selector

### 2.3 Skill Runner `/skills/:name/run`
- ⬜ Skill parameter form
- ⬜ Execute skill with parameters
- ⬜ Real-time execution log

### 2.4 Provider Status `/providers`
- ✅ Provider list (5 config structures supported)
- ⬜ **Add:** Health check per provider
- ⬜ **Add:** Model list per provider
- ⬜ **Add:** Latency/benchmark

### 2.5 Gateway Monitor `/gateway`
- ✅ Platform list with config display
- ✅ Token masking
- ⬜ **Add:** Real-time message log
- ⬜ **Add:** Send test message
- ⬜ **Add:** Gateway restart

### 2.6 Kanban Board `/kanban`
- ✅ Basic board view (3 columns)
- ✅ Priority badges
- ✅ Labels/Tags display
- ⬜ **Add:** Drag & drop
- ⬜ **Add:** Add/edit/delete tasks
- ⬜ **Add:** Task detail modal

### 2.7 Tools Page `/tools`
- ✅ Tool list grouped by toolset
- ✅ Collapsible groups
- ✅ Fallback static list when CLI unavailable

### 2.8 Logs Page `/logs`
- ✅ Terminal-style log viewer
- ✅ Filter/search
- ✅ Auto-scroll

### 2.9 Plugins Page `/plugins`
- ✅ Plugin list with size display
- ✅ Auto-refresh

### 2.10 Live Monitor `/live`
- ✅ WebSocket connection
- ✅ Real-time event feed
- ✅ Agent status cards
- ✅ Delegation tree visualization

---

## Phase 3: System & Security

### 3.1 Auth & Security
- ✅ Login page (API key)
- ✅ Auth guard (localStorage)
- ✅ Auto-reload on 403
- ✅ Logout button
- ✅ Robust key loading (OS env + .env file)
- ✅ /api/auth/reset-key endpoint
- ⬜ **Add:** API key generation (admin)
- ⬜ **Add:** Multiple API keys (read/write roles)
- ⬜ **Add:** Key expiry & rotation

### 3.2 Settings `/settings`
- ⬜ UI preferences (theme, sidebar, refresh interval)
- ⬜ API key management
- ⬜ Language selector

### 3.3 System Monitor `/system`
- ⬜ CPU/Memory/Disk usage graphs
- ⬜ Process list (PM2)
- ⬜ Environment variables viewer

---

## Phase 4: Polish & UX

### 4.1 UI/UX
- ✅ Error boundaries
- ✅ Loading skeletons
- ✅ Empty state messages
- ✅ Responsive sidebar (collapsible)
- ⬜ Mobile responsive design
- ⬜ Dark/Light theme toggle
- ⬜ Keyboard shortcuts
- ⬜ Global search (Cmd+K)

### 4.2 Performance
- ⬜ Virtual scrolling for large lists
- ⬜ Debounced search
- ⬜ Lazy loading for page components
- ⬜ API response caching

---

## Implementation Order

### Sprint 1 (Week 1) — ✅ COMPLETE
1. ✅ Fix auth (key loading, reset-key endpoint)
2. ✅ Fix backend services (dynamic columns, recursive skills, tools fallback)
3. ✅ Session Detail page (messages, delete, date fallback)
4. ✅ Cron job CRUD
5. ✅ Chat improvements (model parsing, error handling)
6. ✅ Frontend response format handling

### Sprint 2 (Week 2) — 🔄 IN PROGRESS
1. Vector Memory search
2. Skill Runner
3. Provider health check
4. Gateway Monitor real-time

### Sprint 3 (Week 3)
1. Kanban CRUD (add/edit/delete tasks)
2. Settings page
3. Global search

### Sprint 4 (Week 4)
1. Auth enhancement (multi-key, roles)
2. Polish & UX
3. Performance optimization

---

## Known Issues
- SSH key sandbox → bravo-dev expired (need to re-add public key)
- hermes_api: false (Hermes API server not accessible from backend container)
- Need to verify UI after deploy (login key may need reset via /api/auth/reset-key)

## Deployment Notes
- Repo: github.com/saipulbahri-ap/hermes-custom-ui
- Deploy: ssh bravo → git pull → npm run build → PM2 restart
- If auth key mismatch: use /api/auth/reset-key endpoint with new key
