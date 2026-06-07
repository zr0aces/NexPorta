# NexPorta

A self-hosted portal for browsing and accessing static HTML content. Drop files into a directory — NexPorta indexes them automatically and serves a searchable dashboard.

```
Browser → Nginx → Dashboard UI + index.json + /content/* files
                      ↑
               Node.js Indexer (watches ./content, writes index.json)
```

---

## Features

- **Auto-discovery** — watches mounted directories with live reload (chokidar)
- **Dashboard** — card-based UI with search, folder grouping, sort, light/dark theme
- **Direct file access** — files served at `/content/path/to/file.html`, no proxy layer
- **Title extraction** — `<title>` → `<h1>` → filename fallback
- **Zero dependencies** — no database, no API server, no frontend framework
- **Lightweight** — Nginx + Node.js, target < 50 MB total RAM

---

## Quick Start

```bash
# 1. Clone
git clone <repo-url> nexporta && cd nexporta

# 2. Copy example compose (points to ./content by default)
cp docker-compose.example.yml docker-compose.yml

# 3. Add your HTML files
mkdir -p content/reports
cp your-report.html content/reports/

# 4. Start
docker compose up -d

# Dashboard → http://localhost:8199
```

> **First run** takes a moment for the indexer to build. Refresh if the dashboard shows empty.

---

## Configuration

All configuration is via environment variables in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTENT_DIR` | `/content` | Directory to scan inside the container |
| `OUTPUT_FILE` | `/data/index.json` | Where the index is written |
| `DEBOUNCE_MS` | `1000` | Delay (ms) before re-indexing after a file change |

**Port**: default `8199:80`. Change the left side in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"   # serve on port 8080 instead
```

**Content directory**: update both volume mounts to point to your files:

```yaml
volumes:
  - /path/to/your/content:/content:ro   # indexer
  - /path/to/your/content:/content:rslave,ro   # web
```

---

## URL Patterns

| Path | Serves |
|------|--------|
| `/` | Dashboard (`dashboard/index.html`) |
| `/index.json` | Generated file index (no-cache) |
| `/content/folder/file.html` | Direct file access |

---

## Development

```bash
# Run all tests
cd indexer && node --test tests/*.test.js

# Run single test file
cd indexer && node --test tests/extractor.test.js

# Run indexer locally (no Docker)
cd indexer
CONTENT_DIR=../content OUTPUT_FILE=/tmp/index.json node index.js

# Rebuild after Dockerfile changes
docker compose build && docker compose up -d

# View logs
docker compose logs indexer
docker compose logs web

# Full reset (volume permissions changed, etc.)
docker compose down -v && docker compose up -d
```

---

## Project Structure

```
nexporta/
├── content/              # Your HTML files go here
├── dashboard/            # Frontend (index.html, style.css, app.js)
├── indexer/              # Node.js watcher + indexer
│   ├── index.js          # Entry point, chokidar watcher
│   ├── scanner.js        # Recursive file discovery
│   ├── extractor.js      # Title extraction
│   ├── builder.js        # Assembles index.json
│   └── tests/            # node:test test suite (20 tests)
├── nginx/nginx.conf      # Routing config
├── docker-compose.yml    # Active deployment config
└── docker-compose.example.yml  # Template to copy from
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/specs.md](docs/specs.md) | Full product specification, architecture, roadmap |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system — colors, typography, components |
| [CLAUDE.md](CLAUDE.md) | Developer guide for Claude Code (commands, architecture notes) |
