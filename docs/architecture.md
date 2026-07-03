# Architecture

## Overview

NexPorta is a lightweight content portal for reports, dashboards, documentation, and static content. It scans mounted directories, indexes content, and provides a modern dashboard for discovering and accessing files through a clean web interface.

```
Browser
    │
    ▼
┌───────────────┐
│     Nginx     │
└───────┬───────┘
        │
        ├── Dashboard UI
        ├── index.json
        └── Content Files

┌───────────────┐
│  NexPorta Indexer │
└───────┬───────┘
        │
        ▼
 Mounted Content
```

## Shared Volume Architecture

Two containers share a named Docker volume (`index_data`):

```
indexer (Node.js 22) ──writes──▶ /data/index.json ──reads──▶ web (nginx:alpine)
       │                                                             │
  ./content (rw)                                             ./content (ro)
                                                           ./dashboard (ro)
```

## Components

- **Indexer & API Server**: A Node.js service that watches the mounted content directory, generates a metadata index, and hosts an HTTP API server on port 3000 to handle folder creation and file uploads.
  - **Pipeline**: [scanner.js](file:///home/san/workspace/NexPorta/indexer/scanner.js) recursively finds HTML files &rarr; [extractor.js](file:///home/san/workspace/NexPorta/indexer/extractor.js) extracts titles &rarr; [builder.js](file:///home/san/workspace/NexPorta/indexer/builder.js) assembles `index.json` &rarr; [index.js](file:///home/san/workspace/NexPorta/indexer/index.js) writes to disk, hosts the API server, and manages the watcher.
  - **API Server**: [server.js](file:///home/san/workspace/NexPorta/indexer/server.js) handles `POST /api/directory` and `POST /api/upload` with strict security controls (file size limits, traversal blocks, file overwrite protection, and allowed extension validation), and exposes `GET /api/config` to serve runtime settings (like the password session timeout) to the frontend client.
- **Web Server (Nginx)**: Serves the dashboard UI, the generated `index.json`, allows direct access to the static HTML files, and acts as a reverse proxy for API requests (`POST /api/*`) routing them to the indexer's port 3000.
- **Dashboard UI**: A framework-free vanilla JS interface ([dashboard/app.js](file:///home/san/workspace/NexPorta/dashboard/app.js)) that reads the `/index.json` metadata to provide fast filtering, sorting, and folder grouping client-side. It also provides the action panel, modals, drag-and-drop file interface, progress bar, and toast notification system.

## Data Schema (`index.json`)

The indexer outputs a simple JSON index containing metadata:

```json
{
  "generated": "2026-06-14T12:00:00.000Z",
  "total": 1,
  "items": [
    {
      "path": "/content/sales/q1.html",
      "title": "Q1 Sales Report",
      "folder": "sales",
      "filename": "q1.html",
      "modified": "2026-06-14T12:00:00.000Z"
    }
  ]
}
```

## URL Routing (Nginx)

- `GET /` &rarr; Serves Dashboard (`dashboard/index.html`).
- `GET /index.json` &rarr; Aliased from shared volume `/data/index.json` with `Cache-Control: no-cache`.
- `GET /content/*` &rarr; Direct file access aliased to `/content/` mount.
- `POST /api/*` &rarr; Proxied to the indexer container (`http://indexer:3000`).
- Everything else &rarr; SPA fallback to `index.html`.

## Technology Stack

- **Indexer**: Node.js 22 LTS (ES Modules), chokidar (v5.0.0+) for watching, node:test for unit testing.
- **Web Server**: Nginx Alpine.
- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework).
- **Deployment**: Docker, Docker Compose.

## Key Constraints & Principles

- **Framework-Free**: Keep memory and CPU usage minimal (< 50MB RAM target). Avoid complex build tools for frontend.
- **Zero Database Dependency**: All discovery and metadata are derived directly from the filesystem.
- **Direct File Access**: Content files are served as native static assets, ensuring standard browser behaviors, compatibility, and shareable links.
- **No HTML Parser**: Regular expression-based title extraction is intentional for performance and simplicity since local HTML is trusted.
- **Docker Volume Permissions**: The `nodejs` user (UID 1001) owns `/data` via the Dockerfile. If volume recreation is needed after user modifications, run `docker compose down -v` first.

## Performance Goals

- **Memory Limit**: Nginx (5-15 MB) + Indexer (15-30 MB) &lt; 50 MB total RAM.
- **Scalability**: Support 10,000+ files with sub-second dashboard rendering and efficient indexing.
