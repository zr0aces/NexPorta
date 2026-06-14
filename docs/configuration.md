# Configuration

All configuration is managed via environment variables. These can be set in your `.env` file or directly defined in `docker-compose.yml`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8199` | Host port the dashboard web UI is exposed on. |
| `CONTENT_DIR` | No | `/content` | Directory to recursively scan for HTML pages inside the container. |
| `OUTPUT_FILE` | No | `/data/index.json` | Path where the generated metadata index is written. |
| `DEBOUNCE_MS` | No | `1000` | Delay in milliseconds before re-indexing after a filesystem change. |
