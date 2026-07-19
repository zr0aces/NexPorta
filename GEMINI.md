# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
cd indexer && node --test tests/*.test.js

# Run a single test file
cd indexer && node --test tests/extractor.test.js

# Run the indexer locally (outside Docker)
cd indexer
CONTENT_DIR=../content OUTPUT_FILE=/tmp/index.json node index.js

# Start the full stack
docker compose up -d

# Rebuild after Dockerfile changes
docker compose build && docker compose up -d

# View logs
docker compose logs indexer
docker compose logs web

# Stop and remove volumes (needed after Dockerfile permission changes)
docker compose down -v

# Sync version from VERSION file
node scripts/sync-version.mjs

# Bump CalVer release version and sync everywhere
node scripts/release.mjs
```

## Architecture

Two containers share a named Docker volume (`index_data`):

```
indexer (Node.js 22) ──writes──▶ /data/index.json ──reads──▶ web (nginx:alpine)
       │                                                             │
  ./content (ro)                                             ./content (ro)
                                                           ./dashboard (ro)
```

**Indexer pipeline:** `scanner.js` finds html/htm files → `extractor.js` extracts titles → `builder.js` assembles `index.json` → `index.js` writes file and manages chokidar watcher with debounce.

**index.json schema:**
```json
{ "generated": "ISO", "total": 4, "items": [
  { "path": "/content/sales/q1.html", "title": "...", "folder": "sales", "filename": "q1.html", "modified": "ISO" }
]}
```

**URL routing (nginx):**
- `GET /` → `dashboard/index.html`
- `GET /index.json` → aliased from shared volume `/data/index.json` (no-cache)
- `GET /content/*` → `alias /content/` (bind-mounted from `./content`)
- Everything else → SPA fallback to `index.html`

**Dashboard** (`dashboard/app.js`) fetches `/index.json` on load. Pure functions `filterItems`, `sortItems`, `groupByFolder` handle all data transformation client-side. Theme preference persisted in `localStorage` under key `nexporta-theme`.

## Key Constraints

- No database, no API server, no frontend framework — by design.
- Only external dependency: `chokidar` (file watching). Node built-in `node:test` for testing.
- Content files are trusted local HTML — regex-based title extraction is intentional (no HTML parser).
- Docker volume permissions: the `nodejs` user (UID 1001) owns `/data` via `RUN mkdir -p /data && chown nodejs:nodejs /data` in the Dockerfile. If you recreate volumes after changing user config, run `docker compose down -v` first.

## 🛠️ UNIFIED AI WORKFLOW (Graphify, RTK, Caveman, Claude-Mem)

This repository adopts a unified AI development workflow across **Claude Code**, **Google Antigravity CLI (`agy`)**, and **Codex**. Follow these instructions strictly:

### 1. Graphify (Codebase Knowledge Graph)
This project has a Graphify knowledge graph at `graphify-out/`.
- **Read first**: Before answering codebase, architecture, or relationship questions, check `graphify-out/GRAPH_REPORT.md` for community structures and god nodes.
- **BFS Traversal**: For cross-module relationship questions, use `graphify query "<question>"` (BFS) or `graphify path "<nodeA>" "<nodeB>"` (shortest path) rather than grepping.
- **Wiki Navigation**: If `graphify-out/wiki/index.md` exists, navigate it first.
- **Keep Current**: After modifying code files, run `graphify update .` to update the AST/graph without API costs.

### 2. RTK (Rust Token Killer) - Token-Optimized Commands
- **Golden Rule**: Always prefix commands with `rtk`. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged.
- **Chained Commands**: Prefix each command in a chain (e.g., `rtk git add . && rtk git commit -m "msg" && rtk git push`).
- **Commands by Workflow**:
  - *Git*: `rtk git status` (compact status), `rtk git diff` (compact diff), `rtk git log` (compact log).
  - *Build/Compile*: `rtk cargo build`, `rtk tsc` (grouped typescript errors), `rtk lint` (grouped eslint violations).
  - *Test*: `rtk cargo test` / `rtk jest` / `rtk vitest` / `rtk playwright test` (failures only).
  - *JavaScript*: `rtk npm run <script>`, `rtk npx <cmd>`, `rtk pnpm install` (compact install output).
  - *Search/Files*: `rtk ls` (tree format), `rtk read <file>` (filtered reading), `rtk grep <pattern>` (grouped search).
  - *Meta*: `rtk gain` (savings stats), `rtk gain --history` (history), `rtk proxy <cmd>` (bypass filter).

### 3. Caveman (Terse Communication)
- **Always Active**: Respond terse like a smart caveman. All technical substance stays, only fluff/pleasantries die.
- **Rules**:
  - Drop articles (a/an/the), filler (basically, just, really), pleasantries ("Sure! I'd be happy to help"), and hedging.
  - Fragments are OK. Short synonyms. Technical terms exact. Code/commits/PRs written normally.
  - Pattern: `[thing] [action] [reason]. [next step].`
    * *Example*: "Bug in auth middleware. Fix: [code]. Verify."
- **Auto-Clarity**: Drop caveman mode for security warnings, irreversible actions, or when the user is confused. Resume after.
- **Level Selection**: `/caveman lite|full|ultra|wenyan` (default is full). Use "stop caveman" or "normal mode" to stop.

### 4. Claude-Mem (Cross-Session Memory)
This project uses `claude-mem` for persistent memory across sessions.
- **Context Injection**: Review the `<claude-mem-context>` block injected at session start for active observations.
- **Memory Queries**: When asked about previous sessions/fixes, use the `search` and `timeline` MCP tools to query memory.
- **3-Layer Workflow**:
  1. **Search**: Run `search(query="...", project="...")` to retrieve a compact list of IDs.
  2. **Timeline**: Run `timeline(anchor=ID, project="...")` to inspect context around specific events.
  3. **Fetch**: Use `get_observations(ids=[...])` to retrieve detailed observations only for target IDs.
