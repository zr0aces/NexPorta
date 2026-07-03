# Configuration

All configuration is managed via environment variables. These can be set in your `.env` file or directly defined in `docker-compose.yml`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOST` | No | `127.0.0.1` | Network interface host for the indexer API server (set to `0.0.0.0` in Docker). |
| `PORT` (Indexer) | No | `3000` | Internal port the indexer HTTP API server listens on inside the container network. |
| `HOST_PORT` / `PORT` | No | `8199` | Host port the dashboard web UI is exposed on. |
| `CONTENT_DIR` | No | `/content` | Directory to recursively scan for HTML pages inside the container. |
| `OUTPUT_FILE` | No | `/data/index.json` | Path where the generated metadata index is written. |
| `DEBOUNCE_MS` | No | `1000` | Delay in milliseconds before re-indexing after a filesystem change. |
| `API_PASSWORD` | No | *(Auto-generated)* | Password required to authorize folder creation and file upload requests (if empty, a secure random ephemeral password is generated and logged). |
| `SESSION_TIMEOUT_MINUTES` | No | `30` | Duration in minutes that the dashboard client holds the authenticated session in-memory before prompting again. |
