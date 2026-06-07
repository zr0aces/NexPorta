# NexPorta

**A lightweight content portal for reports, dashboards, documentation, and static content.**

NexPorta automatically scans mounted directories, indexes content, and provides a modern dashboard for discovering and accessing files through a clean web interface.

Built for simplicity, performance, and self-hosting.

---

## Vision

NexPorta serves as a central gateway to your content.

Whether you're managing business reports, generated dashboards, documentation, user manuals, static websites, or internal knowledge bases, NexPorta provides a fast and lightweight way to organize and access them.

NexPorta focuses on:

* Simplicity
* Performance
* Low resource usage
* Self-hosting
* Direct file access
* Zero database dependency

---

# Core Features

## Content Discovery

* Recursively scan directories
* Automatically detect HTML files
* Extract page titles
* Group content by folder
* Generate searchable metadata
* Detect content changes automatically

## Modern Dashboard

* Responsive card-based interface
* Folder grouping
* Fast search
* Client-side sorting
* Light and dark themes
* Mobile-friendly layout

## Direct Access

* Open files directly through URL
* No proxy layer
* Native browser behavior
* Shareable links

Example:

```text
/sales/jan.html
/marketing/report.html
/reports/2026/q1.html
```

## Lightweight Architecture

* No database
* No API server
* No frontend framework
* No external services
* Minimal dependencies

---

# Architecture

```text
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

---

# Technology Stack

## Backend Services

### Web Server

* Nginx Alpine

### Indexer

* Node.js 22 LTS (ES Modules)
* chokidar (v5.0.0+)

## Frontend

* Vanilla HTML
* Vanilla CSS
* Vanilla JavaScript

## Deployment

* Docker
* Docker Compose

---

# Design Principles

## Lightweight

Keep memory and CPU usage minimal.

## Self-Hosted First

Easy deployment on:

* Home servers
* VPS
* NAS devices
* Docker environments

## Direct Access

Content should remain accessible through normal URLs.

## Framework-Free

Avoid unnecessary complexity and large dependencies.

## Future-Proof

Support future content types without redesigning the architecture.

---

# Initial Scope (v1)

Supported file types:

* HTML
* HTM

Metadata extraction:

1. HTML title
2. First H1
3. Filename fallback

Features:

* Recursive scanning
* Automatic indexing
* Dashboard UI
* Search
* Sorting
* Theme support
* Direct file access
* Docker deployment

---

# Future Roadmap

## Content Types

* PDF
* Markdown
* Images
* Static assets

## Discovery

* Tags
* Collections
* Favorites
* Recent content

## Enterprise Features

* Authentication
* User permissions
* Multiple content libraries
* Audit logging

## Search

* Full-text indexing
* Advanced filters
* Saved searches

---

# Performance Goals

Memory usage:

| Component | Target   |
| --------- | -------- |
| Nginx     | 5–15 MB  |
| Indexer   | 15–30 MB |
| Total     | < 50 MB  |

Scalability:

* 10,000+ files
* Fast startup
* Responsive dashboard
* Automatic updates

---

# Project Goal

NexPorta should be the simplest way to publish and browse large collections of static content through a modern web interface while keeping infrastructure requirements close to zero.

