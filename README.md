# Hermes Custom UI

All-in-one web dashboard for **Hermes Agent** by Nous Research.

Covers every aspect of Hermes — chat, sessions, memory, skills, cron, config, profiles, gateway, tools, providers, kanban, logs, plugins, and system status.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                    │
│   Chat · Dashboard · Sessions · Skills · Config     │
│   Memory · Cron · Profiles · Tools · Gateway ...    │
└──────────┬──────────────────────────┬───────────────┘
           │ HTTP (REST)              │ WebSocket
           ▼                          ▼
┌─────────────────────────────────────────────────────┐
│                Backend (FastAPI)                     │
│   ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│   │ Chat API │ │ Admin API│ │ Hermes Bridge    │   │
│   │ (proxy)  │ │ (REST)   │ │ CLI · SQLite · FS │   │
│   └──────────┘ └──────────┘ └──────────────────┘   │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐  ┌────────────────────────────┐
│ Hermes API Server   │  │ Hermes Filesystem           │
│ :8642/v1/chat/...   │  │ ~/.hermes/                  │
│                     │  │   ├── config.yaml           │
│                     │  │   ├── .env                  │
│                     │  │   ├── state.db (SQLite)     │
│                     │  │   ├── skills/               │
│                     │  │   ├── logs/                 │
│                     │  │   └── profiles/             │
└─────────────────────┘  └────────────────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| **Chat** | Web chat via Hermes API server, streaming responses |
| **Dashboard** | System overview — health, uptime, active sessions |
| **Sessions** | Browse, search, resume past sessions |
| **Memory** | View vector memory, user profile, search |
| **Skills** | Browse installed skills, view SKILL.md, stats |
| **Cron** | List, create, pause, resume, remove cron jobs |
| **Config** | View/edit config.yaml, env vars |
| **Profiles** | List, switch, manage profiles |
| **Tools** | View tool registry, enable/disable toolsets |
| **Gateway** | Platform status, restart, message log |
| **Providers** | Provider models, credential pools |
| **Kanban** | Board view, tasks, comments |
| **Logs** | Real-time log viewer |
| **Plugins** | Plugin browser |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/saipul/hermes-custom-ui.git
cd hermes-custom-ui

# 2. Setup (installs deps, creates launcher)
bash setup.sh

# 3. Start
bash start.sh
# → Backend: http://localhost:8643
# → Frontend: http://localhost:5173
```

### Manual

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py --hermes-home ~/.hermes

# Frontend
cd frontend
npm install
npm run dev
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `HERMES_HOME` | `~/.hermes` | Hermes config directory |
| `HERMES_API_URL` | `http://localhost:8642/v1` | Hermes API server |
| `HERMES_API_KEY` | `` | API key if required |
| `HOST` | `0.0.0.0` | Backend bind |
| `PORT` | `8643` | Backend port |

## License

MIT
