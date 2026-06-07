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
