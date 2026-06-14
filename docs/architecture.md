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
  ./content (ro)                                             ./content (ro)
                                                           ./dashboard (ro)
```

## Components

- **Indexer**: A Node.js service that watches the mounted content directory and generates a metadata index.
  - **Pipeline**: [scanner.js](file:///home/san/workspace/NexPorta/indexer/scanner.js) recursively finds HTML files &rarr; [extractor.js](file:///home/san/workspace/NexPorta/indexer/extractor.js) extracts titles &rarr; [builder.js](file:///home/san/workspace/NexPorta/indexer/builder.js) assembles `index.json` &rarr; [index.js](file:///home/san/workspace/NexPorta/indexer/index.js) writes to disk and manages the watcher with a debounce.
- **Web Server (Nginx)**: Serves the dashboard UI, the generated `index.json`, and allows direct access to the static HTML files without a proxy layer.
- **Dashboard UI**: A framework-free vanilla JS interface ([dashboard/app.js](file:///home/san/workspace/NexPorta/dashboard/app.js)) that reads the `/index.json` metadata to provide fast filtering, sorting, and folder grouping client-side.

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
