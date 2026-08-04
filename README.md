# NexPorta

A fast, zero-dependency, self-hosted indexer and dashboard for static HTML pages.

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
# 1. Copy the example files
cp docker-compose.example.yml docker-compose.yml
cp .env.example .env

# 2. Edit docker-compose.yml — replace /path/to/your/content with your HTML files directory
#    (search for the two volume lines that start with /path/to/your/content)

# 3. Start
docker compose up -d

# Dashboard → http://localhost:8199
```

> **First run** pulls the images from GHCR and waits for the indexer to finish building. Refresh if the dashboard shows empty.

> **To build locally** instead of pulling from GHCR, see the commented `build:` lines in `docker-compose.example.yml`.

---

## Docker Images

Pre-built multi-arch images (`linux/amd64`, `linux/arm64`) are published to GHCR on every release:

| Image | Tags |
|-------|------|
| `ghcr.io/zr0aces/nexporta-indexer` | `latest`, `1.2.3`, `1.2` |
| `ghcr.io/zr0aces/nexporta-web` | `latest`, `1.2.3`, `1.2` |

Images are published automatically by the [Docker Publish](.github/workflows/docker-publish.yml) GitHub Actions workflow when a GitHub Release is created. Pre-releases do **not** receive the `latest` tag.

---

## Configuration

All configuration is via environment variables. Set them in `.env` (copied from `.env.example`) or directly in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8199` | Host port the dashboard is exposed on |
| `CONTENT_DIR` | `/content` | Directory to scan inside the container |
| `OUTPUT_FILE` | `/data/index.json` | Where the index is written |
| `DEBOUNCE_MS` | `1000` | Delay (ms) before re-indexing after a file change |
| `API_PASSWORD` | *(Auto-generated)* | Password to authorize folder creation and upload APIs |
| `SESSION_TIMEOUT_MINUTES` | `30` | In-memory session auth duration in minutes |
| `ALLOWED_CORS_ORIGIN` | `*` | Allowed CORS origin header for API endpoints |

**Port**: set `PORT` in `.env` or override in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"   # serve on port 8080 instead
```

**Content directory**: update both volume mounts to point to your files:

```yaml
volumes:
  - /path/to/your/content:/content           # indexer (read-write for upload/folders)
  - /path/to/your/content:/content:rslave,ro # web (read-only for security)
```

---

## URL Patterns

| Path | Serves |
|------|--------|
| `/` | Dashboard (`dashboard/index.html`) |
| `/index.json` | Generated file index (no-cache) |
| `/content/folder/file.html` | Direct file access |

---

## Versioning

NexPorta uses **CalVer** in the format `YYYY.M.N` (example: `2026.6.1`).

- `VERSION` is the single source of truth.
- Script helpers synchronize and automate releases (see [docs/development.md](docs/development.md)).

---

## Development

See [docs/development.md](docs/development.md) for development setup, test execution, and helper commands.

---

## Project Structure

```text
nexporta/
├── content/              # Your HTML files go here
├── dashboard/            # Frontend (index.html, style.css, app.js)
│   └── Dockerfile        # Production web image (nginx + baked assets)
├── indexer/              # Node.js watcher, API server & indexer
│   ├── index.js          # Entry point, HTTP server & chokidar watcher
│   ├── builder.js        # File scanner, title extractor & index.json builder
│   ├── server.js         # HTTP API endpoint handler (upload, folder creation)
│   ├── storage.js        # Filesystem storage & path safety manager
│   ├── authenticator.js  # Password authenticator
│   ├── Dockerfile        # Production indexer image
│   └── tests/            # node:test test suite (65 tests)
├── nginx/nginx.conf      # Routing config (baked into web image)
├── .github/workflows/
│   └── docker-publish.yml  # Builds & publishes images on Release
├── scripts/
│   ├── release.mjs       # CalVer bump + sync helper
│   └── sync-version.mjs  # Syncs VERSION across project files
├── VERSION               # Single source of truth for app version
├── .env.example          # Environment variable template
├── docker-compose.yml    # Active deployment config
└── docker-compose.example.yml  # Production template (copy from here)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | High-level components, shared volume architecture, data flow, constraints |
| [docs/development.md](docs/development.md) | Local development setup, unit tests, and versioning commands |
| [docs/deployment.md](docs/deployment.md) | Production setup, upgrades, backup, and restore guidelines |
| [docs/configuration.md](docs/configuration.md) | Configuration environment variables reference |
| [docs/decisions.md](docs/decisions.md) | Lightweight Architecture Decision Records (ADRs) |
| [docs/DESIGN.md](docs/DESIGN.md) | Extraction of the dashboard visual styles and components |
| [CLAUDE.md](CLAUDE.md) | Developer guide for Claude Code |
| [AGENTS.md](AGENTS.md) | Developer guide for Codex |
| [.agents/rules/](.agents/rules/) | Developer guide for Google Antigravity |

---

## License

[MIT](LICENSE)

