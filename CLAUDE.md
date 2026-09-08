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
  ./content (rw)                                             ./content (ro)
                                                           ./dashboard (ro)
```

**Indexer pipeline:** `builder.js` scans content directory, extracts titles & assembles `index.json` → `server.js` handles HTTP API endpoints (`POST /api/*`) → `index.js` initializes API server & chokidar watcher with debounce.

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

<!-- agent-parity:begin -->
## Shared memory and agent state

This project uses `agent-parity` to keep memory, skills, instructions, and agent wiring portable across agents and machines; treat its managed files as repository state, not disposable generated files.

A shared `memory` MCP server persists context across sessions and agents (`memory_recent`, `memory_add`, `memory_search`, `memory_get`). Each tool's description says when to call it — follow them. Store durable context, not secrets, one-off chatter, or facts another source already enforces.

Cross-agent bootstrap: at the start of the first user turn, if the `memory` tools are unavailable, repair only the one config your own client reads — Claude Code `.mcp.json`, Cursor `.cursor/mcp.json`, Codex `.codex/config.toml`, Antigravity `.agents/mcp_config.json` — and leave the other three untouched, because a different-OS agent may share this working tree and need the other launcher. In that file, on native Windows replace an exact `.agent-parity/mcp/memory/run.sh` value with `.agent-parity/mcp/memory/run.cmd`, and on Unix-like systems make the inverse replacement. Use built-in file read/edit tools, not project scripts or a command the user must type. Preserve a missing, malformed, or custom `memory` registration. If you changed the file, tell the user that the current agent must be restarted and do not claim the memory tools are available in the current session.

When asked for agent-parity status in a conversation, run the project-local `status` command and call `memory_recent` to verify the current session; never infer tool availability from a static tool list because MCP tools may load lazily. If wiring is healthy but that call is unavailable, tell the user to restart the agent session. If wiring is missing, stale, conflicting, or invalid, offer to inspect the named configuration files because unrelated user settings may also prevent the agent from loading them.

When pushing or handing off through Git, commit and include every changed agent-parity-managed file. Never select only some managed changes or bypass the pre-push guard.
<!-- agent-parity:end -->
