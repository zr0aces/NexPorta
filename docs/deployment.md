# Deployment

NexPorta is designed to be deployed using Docker and Docker Compose.

## Setup

See `docs/deployment/` for example configuration files. Copy and adapt them before running the application:

- [docs/deployment/.env.example](file:///home/san/workspace/NexPorta/docs/deployment/.env.example) &rarr; `.env`
- [docs/deployment/docker-compose.yml.example](file:///home/san/workspace/NexPorta/docs/deployment/docker-compose.yml.example) &rarr; `docker-compose.yml`
- [docs/deployment/nginx.conf.example](file:///home/san/workspace/NexPorta/docs/deployment/nginx.conf.example) &rarr; `/etc/nginx/conf.d/app.conf` (Internal/baked in)

### Deployment Steps

1. Copy the example environment file:
   ```bash
   cp docs/deployment/.env.example .env
   ```
2. Copy the docker-compose template:
   ```bash
   cp docs/deployment/docker-compose.yml.example docker-compose.yml
   ```
3. Edit `docker-compose.yml` to specify the absolute path to your HTML files directory. Look for the volume mounts:
   ```yaml
   volumes:
     - /path/to/your/content:/content:ro        # indexer
     - /path/to/your/content:/content:rslave,ro # web
   ```
4. Start the application:
   ```bash
   docker compose up -d
   ```

## Production Images

Pre-built multi-architecture Docker images (`linux/amd64`, `linux/arm64`) are automatically built and published to GitHub Container Registry (GHCR) on each release:

- Indexer: `ghcr.io/zr0aces/nexporta-indexer:latest`
- Web Server: `ghcr.io/zr0aces/nexporta-web:latest`

## Backup

Since NexPorta is a database-free application, backing up is simple:
1. Back up your content directories (which are mounted into the container).
2. Back up your `.env` and `docker-compose.yml` configuration files.

## Restore

To restore:
1. Re-mount the content directories.
2. Re-create the `.env` and `docker-compose.yml` files.
3. Run `docker compose up -d`.

## Upgrade

To upgrade NexPorta to a newer version:
1. Pull the latest Docker images:
   ```bash
   docker compose pull
   ```
2. Restart the containers:
   ```bash
   docker compose up -d
   ```
