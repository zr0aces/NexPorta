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

**Port**: set `PORT` in `.env` or override in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"   # serve on port 8080 instead
```

**Content directory**: update both volume mounts to point to your files:

```yaml
volumes:
  - /path/to/your/content:/content:ro        # indexer
  - /path/to/your/content:/content:rslave,ro # web
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
│   └── Dockerfile        # Production web image (nginx + baked assets)
├── indexer/              # Node.js watcher + indexer
│   ├── index.js          # Entry point, chokidar watcher
│   ├── scanner.js        # Recursive file discovery
│   ├── extractor.js      # Title extraction
│   ├── builder.js        # Assembles index.json
│   ├── Dockerfile        # Production indexer image
│   └── tests/            # node:test test suite (20 tests)
├── nginx/nginx.conf      # Routing config (baked into web image)
├── .github/workflows/
│   └── docker-publish.yml  # Builds & publishes images on Release
├── .env.example          # Environment variable template
├── docker-compose.yml    # Active deployment config
└── docker-compose.example.yml  # Production template (copy from here)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/specs.md](docs/specs.md) | Full product specification, architecture, roadmap |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system — colors, typography, components |
| [CLAUDE.md](CLAUDE.md) | Developer guide for Claude Code (commands, architecture notes) |
| [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml) | CI/CD — multi-arch GHCR publish on Release |

---

## License

[MIT](LICENSE)
