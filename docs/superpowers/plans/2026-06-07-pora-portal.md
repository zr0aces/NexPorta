# Pora Content Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Pora — a self-hosted portal that auto-indexes HTML files from mounted directories and serves them through a searchable, card-based dashboard UI.

**Architecture:** Node.js indexer watches a content directory with chokidar, scans HTML/HTM files, extracts titles, and writes `index.json` to a shared Docker volume. Nginx Alpine serves the vanilla JS dashboard, `index.json`, and all content files. Docker Compose wires the two containers together.

**Tech Stack:** Node.js 22 (built-in test runner `node:test`), chokidar ^3, Nginx Alpine, Vanilla HTML/CSS/JS, Docker Compose

---

## File Structure

```
Porta/
├── docker-compose.yml
├── .gitignore
├── content/                          # Sample content for dev/testing
│   ├── example/sample.html
│   ├── sales/q1.html
│   ├── notitle.html                  # h1-only fallback test case
│   └── noheadings.html               # filename fallback test case
├── indexer/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── extractor.js                  # Extract title from one HTML file
│   ├── scanner.js                    # Recursively find HTML/HTM files
│   ├── builder.js                    # Build the full index object
│   ├── index.js                      # Main: initial build + chokidar watcher
│   └── tests/
│       ├── extractor.test.js
│       ├── scanner.test.js
│       └── builder.test.js
├── dashboard/
│   ├── index.html                    # Dashboard shell (semantic HTML, no logic)
│   ├── style.css                     # Card grid, light/dark themes, responsive
│   └── app.js                        # Fetch index.json, search, sort, render
└── nginx/
    └── nginx.conf                    # Serve dashboard, /index.json, /content/*
```

**index.json schema** (written by indexer, consumed by dashboard):
```json
{
  "generated": "2026-06-07T10:00:00.000Z",
  "total": 4,
  "items": [
    {
      "path": "/content/sales/q1.html",
      "title": "Q1 Sales Report",
      "folder": "sales",
      "filename": "q1.html",
      "modified": "2026-01-31T00:00:00.000Z"
    }
  ]
}
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `.gitignore`
- Create: `content/example/sample.html`
- Create: `content/sales/q1.html`
- Create: `content/notitle.html`
- Create: `content/noheadings.html`
- Create: `indexer/package.json`
- Create: `indexer/Dockerfile`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p content/example content/sales indexer/tests dashboard nginx docs/superpowers/plans
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
*.log
```

- [ ] **Step 3: Create sample content files**

Create `content/example/sample.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Sample Report</title></head>
<body><h1>Sample Report</h1><p>This is a sample HTML file for testing Pora.</p></body>
</html>
```

Create `content/sales/q1.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Q1 Sales Report</title></head>
<body><h1>Q1 Sales</h1><p>First quarter results.</p></body>
</html>
```

Create `content/notitle.html`:
```html
<!DOCTYPE html>
<html>
<body><h1>No Title Tag Here</h1><p>Only h1.</p></body>
</html>
```

Create `content/noheadings.html`:
```html
<!DOCTYPE html>
<html>
<body><p>No title or heading.</p></body>
</html>
```

- [ ] **Step 4: Create indexer/package.json**

```json
{
  "name": "pora-indexer",
  "version": "1.0.0",
  "description": "Pora content indexer",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node --test tests/*.test.js"
  },
  "dependencies": {
    "chokidar": "^3.6.0"
  }
}
```

- [ ] **Step 5: Install indexer dependencies**

```bash
cd indexer && npm install && cd ..
```

Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 6: Create indexer/Dockerfile**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY *.js ./
CMD ["node", "index.js"]
```

- [ ] **Step 7: Initialize git and commit scaffold**

```bash
git init
git add .gitignore content/ indexer/package.json indexer/package-lock.json indexer/Dockerfile docs/
git commit -m "chore: project scaffold with sample content and indexer deps"
```

---

## Task 2: HTML Title Extractor

**Files:**
- Create: `indexer/extractor.js`
- Create: `indexer/tests/extractor.test.js`

- [ ] **Step 1: Write failing tests**

Create `indexer/tests/extractor.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { extractTitle } = require('../extractor');

function writeTempFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pora-test-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

test('extracts <title> tag content', () => {
  const file = writeTempFile('test.html', '<html><head><title>My Report</title></head><body></body></html>');
  assert.equal(extractTitle(file), 'My Report');
});

test('falls back to first <h1> when no <title>', () => {
  const file = writeTempFile('test.html', '<html><body><h1>Heading One</h1></body></html>');
  assert.equal(extractTitle(file), 'Heading One');
});

test('falls back to filename stem when no title or h1', () => {
  const file = writeTempFile('my-report.html', '<html><body><p>No heading.</p></body></html>');
  assert.equal(extractTitle(file), 'my report');
});

test('trims whitespace from extracted title', () => {
  const file = writeTempFile('test.html', '<html><head><title>  Spaced Title  </title></head></html>');
  assert.equal(extractTitle(file), 'Spaced Title');
});

test('prefers <title> over <h1> when both present', () => {
  const file = writeTempFile('test.html',
    '<html><head><title>Title Tag</title></head><body><h1>H1 Tag</h1></body></html>');
  assert.equal(extractTitle(file), 'Title Tag');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd indexer && node --test tests/extractor.test.js
```

Expected: `Cannot find module '../extractor'`

- [ ] **Step 3: Implement extractor.js**

Create `indexer/extractor.js`:
```js
const fs = require('node:fs');
const path = require('node:path');

function extractTitle(filepath) {
  const html = fs.readFileSync(filepath, 'utf8');

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();

  const stem = path.basename(filepath, path.extname(filepath));
  return stem.replace(/[-_]/g, ' ');
}

module.exports = { extractTitle };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd indexer && node --test tests/extractor.test.js
```

Expected: All 5 tests show `✓`.

- [ ] **Step 5: Commit**

```bash
git add indexer/extractor.js indexer/tests/extractor.test.js
git commit -m "feat: HTML title extractor with title/h1/filename fallback"
```

---

## Task 3: Directory Scanner

**Files:**
- Create: `indexer/scanner.js`
- Create: `indexer/tests/scanner.test.js`

- [ ] **Step 1: Write failing tests**

Create `indexer/tests/scanner.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { scanDirectory } = require('../scanner');

function makeTree(structure) {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pora-scan-'));
  for (const [relPath, content] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
  return baseDir;
}

test('finds HTML files in root directory', () => {
  const dir = makeTree({ 'report.html': '<html></html>' });
  const results = scanDirectory(dir);
  assert.equal(results.length, 1);
  assert.ok(results[0].endsWith('report.html'));
});

test('recursively finds HTML files in subdirectories', () => {
  const dir = makeTree({
    'root.html': '<html></html>',
    'sub/nested.html': '<html></html>',
    'sub/deep/file.htm': '<html></html>',
  });
  const results = scanDirectory(dir);
  assert.equal(results.length, 3);
});

test('includes .htm extension', () => {
  const dir = makeTree({ 'page.htm': '<html></html>' });
  const results = scanDirectory(dir);
  assert.equal(results.length, 1);
  assert.ok(results[0].endsWith('page.htm'));
});

test('excludes non-HTML files', () => {
  const dir = makeTree({
    'doc.pdf': 'pdf',
    'image.png': 'image',
    'data.json': '{}',
    'page.html': '<html></html>',
  });
  const results = scanDirectory(dir);
  assert.equal(results.length, 1);
});

test('returns empty array for empty directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pora-scan-'));
  assert.deepEqual(scanDirectory(dir), []);
});

test('returns empty array for non-existent directory', () => {
  assert.deepEqual(scanDirectory('/non/existent/path/xyz'), []);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd indexer && node --test tests/scanner.test.js
```

Expected: `Cannot find module '../scanner'`

- [ ] **Step 3: Implement scanner.js**

Create `indexer/scanner.js`:
```js
const fs = require('node:fs');
const path = require('node:path');

function scanDirectory(rootDir) {
  const results = [];
  if (!fs.existsSync(rootDir)) return results;

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(html|htm)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

module.exports = { scanDirectory };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd indexer && node --test tests/scanner.test.js
```

Expected: All 6 tests show `✓`.

- [ ] **Step 5: Commit**

```bash
git add indexer/scanner.js indexer/tests/scanner.test.js
git commit -m "feat: recursive HTML/HTM directory scanner"
```

---

## Task 4: Index Builder

**Files:**
- Create: `indexer/builder.js`
- Create: `indexer/tests/builder.test.js`

- [ ] **Step 1: Write failing tests**

Create `indexer/tests/builder.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { buildIndex } = require('../builder');

function makeContentDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pora-build-'));
  fs.mkdirSync(path.join(dir, 'sales'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'sales', 'q1.html'),
    '<html><head><title>Q1 Sales</title></head></html>');
  fs.writeFileSync(path.join(dir, 'readme.html'),
    '<html><body><h1>Readme</h1></body></html>');
  return dir;
}

test('returns object with generated, total, and items fields', () => {
  const index = buildIndex(makeContentDir());
  assert.equal(typeof index.generated, 'string');
  assert.ok(Array.isArray(index.items));
  assert.equal(typeof index.total, 'number');
});

test('items have path, title, folder, filename, modified fields', () => {
  const index = buildIndex(makeContentDir());
  const item = index.items[0];
  assert.ok('path' in item, 'missing path');
  assert.ok('title' in item, 'missing title');
  assert.ok('folder' in item, 'missing folder');
  assert.ok('filename' in item, 'missing filename');
  assert.ok('modified' in item, 'missing modified');
});

test('paths start with /content/', () => {
  const index = buildIndex(makeContentDir());
  for (const item of index.items) {
    assert.ok(item.path.startsWith('/content/'), `path "${item.path}" must start with /content/`);
  }
});

test('folder is empty string for root-level files', () => {
  const index = buildIndex(makeContentDir());
  const root = index.items.find(i => i.filename === 'readme.html');
  assert.ok(root, 'readme.html not found');
  assert.equal(root.folder, '');
});

test('folder reflects subdirectory name', () => {
  const index = buildIndex(makeContentDir());
  const sub = index.items.find(i => i.filename === 'q1.html');
  assert.ok(sub, 'q1.html not found');
  assert.equal(sub.folder, 'sales');
});

test('total equals items.length', () => {
  const index = buildIndex(makeContentDir());
  assert.equal(index.total, index.items.length);
});

test('returns zero total for empty directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pora-build-'));
  const index = buildIndex(dir);
  assert.equal(index.total, 0);
  assert.deepEqual(index.items, []);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd indexer && node --test tests/builder.test.js
```

Expected: `Cannot find module '../builder'`

- [ ] **Step 3: Implement builder.js**

Create `indexer/builder.js`:
```js
const fs = require('node:fs');
const path = require('node:path');
const { scanDirectory } = require('./scanner');
const { extractTitle } = require('./extractor');

function buildIndex(contentDir) {
  const files = scanDirectory(contentDir);
  const items = files.map(filepath => {
    const rel = path.relative(contentDir, filepath);
    const folder = path.dirname(rel);
    const stat = fs.statSync(filepath);
    return {
      path: '/content/' + rel.replace(/\\/g, '/'),
      title: extractTitle(filepath),
      folder: folder === '.' ? '' : folder.replace(/\\/g, '/'),
      filename: path.basename(filepath),
      modified: stat.mtime.toISOString(),
    };
  });

  return {
    generated: new Date().toISOString(),
    total: items.length,
    items,
  };
}

module.exports = { buildIndex };
```

- [ ] **Step 4: Run all indexer tests**

```bash
cd indexer && node --test tests/*.test.js
```

Expected: All 18 tests pass (5 extractor + 6 scanner + 7 builder).

- [ ] **Step 5: Commit**

```bash
git add indexer/builder.js indexer/tests/builder.test.js
git commit -m "feat: index builder combining scanner and extractor"
```

---

## Task 5: Indexer Entry + Watcher

**Files:**
- Create: `indexer/index.js`

- [ ] **Step 1: Create indexer/index.js**

```js
const fs = require('node:fs');
const path = require('node:path');
const chokidar = require('chokidar');
const { buildIndex } = require('./builder');

const CONTENT_DIR = process.env.CONTENT_DIR || '/content';
const OUTPUT_FILE = process.env.OUTPUT_FILE || '/data/index.json';
const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS || '1000', 10);

function writeIndex() {
  const index = buildIndex(CONTENT_DIR);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`[pora] indexed ${index.total} files → ${OUTPUT_FILE}`);
}

writeIndex();

let debounceTimer;
chokidar
  .watch(CONTENT_DIR, { ignoreInitial: true, persistent: true })
  .on('all', (event, filePath) => {
    console.log(`[pora] ${event}: ${filePath}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(writeIndex, DEBOUNCE_MS);
  });

console.log(`[pora] watching ${CONTENT_DIR}`);
```

- [ ] **Step 2: Smoke test locally**

```bash
cd indexer
CONTENT_DIR=../content OUTPUT_FILE=/tmp/pora-index.json node index.js
```

Expected output:
```
[pora] indexed 4 files → /tmp/pora-index.json
[pora] watching ../content
```

Press Ctrl+C after confirming.

- [ ] **Step 3: Verify output JSON**

```bash
cat /tmp/pora-index.json
```

Expected: valid JSON with `generated`, `total: 4`, `items` array. Each item has `path` starting with `/content/`, `title`, `folder`, `filename`, `modified`.

- [ ] **Step 4: Commit**

```bash
git add indexer/index.js
git commit -m "feat: indexer entry with chokidar watcher and debounced re-index"
```

---

## Task 6: Dashboard HTML

**Files:**
- Create: `dashboard/index.html`

- [ ] **Step 1: Create dashboard/index.html**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pora</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <h1 class="site-title">Pora</h1>
      <div class="controls">
        <input
          type="search"
          id="search"
          class="search-input"
          placeholder="Search..."
          aria-label="Search content"
        >
        <select id="sort" class="sort-select" aria-label="Sort by">
          <option value="title">Sort: Title</option>
          <option value="folder">Sort: Folder</option>
          <option value="modified">Sort: Modified</option>
        </select>
        <button id="theme-toggle" class="theme-btn" aria-label="Toggle dark mode" title="Toggle theme">
          <span class="icon-light">☀️</span>
          <span class="icon-dark">🌙</span>
        </button>
      </div>
    </div>
  </header>

  <main class="site-main">
    <div id="status" class="status" aria-live="polite">Loading...</div>
    <div id="groups" class="groups" hidden></div>
    <div id="empty" class="empty-state" hidden>No content found.</div>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: dashboard HTML shell"
```

---

## Task 7: Dashboard CSS

**Files:**
- Create: `dashboard/style.css`

- [ ] **Step 1: Create dashboard/style.css**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #f1f5f9;
  --surface: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --accent: #2563eb;
  --border: #e2e8f0;
  --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-hover: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
  --radius: 8px;
}

[data-theme="dark"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --accent: #60a5fa;
  --border: #334155;
  --shadow: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-hover: 0 4px 6px rgba(0,0,0,0.5);
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.5;
}

.site-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: var(--shadow);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.site-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.025em;
  margin-right: auto;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 12px;
  font-size: 0.875rem;
  background: var(--bg);
  color: var(--text);
  width: 220px;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: var(--accent);
}

.sort-select {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 8px;
  font-size: 0.875rem;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  outline: none;
}

.theme-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  color: var(--text);
  transition: background 0.15s;
}

.theme-btn:hover {
  background: var(--border);
}

[data-theme="light"] .icon-dark,
[data-theme="dark"] .icon-light {
  display: none;
}

.site-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.status {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.folder-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow);
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
  border-color: var(--accent);
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
}

.card-filename {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: monospace;
}

.card-modified {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 4px;
}

@media (max-width: 600px) {
  .site-title { font-size: 1rem; }
  .search-input { width: 140px; }
  .card-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Visual check — create a static preview**

```bash
cat > /tmp/pora-preview.html << 'EOF'
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pora CSS Preview</title>
  <link rel="stylesheet" href="/home/san/workspace/Porta/dashboard/style.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <h1 class="site-title">Pora</h1>
      <div class="controls">
        <input type="search" class="search-input" placeholder="Search...">
        <select class="sort-select"><option>Sort: Title</option></select>
        <button class="theme-btn"><span class="icon-light">☀️</span><span class="icon-dark">🌙</span></button>
      </div>
    </div>
  </header>
  <main class="site-main">
    <div class="groups">
      <div>
        <div class="folder-label">sales</div>
        <div class="card-grid">
          <a href="#" class="card">
            <div class="card-title">Q1 Sales Report</div>
            <div class="card-filename">q1.html</div>
            <div class="card-modified">Jan 31, 2026</div>
          </a>
          <a href="#" class="card">
            <div class="card-title">Q2 Sales Report</div>
            <div class="card-filename">q2.html</div>
            <div class="card-modified">Apr 30, 2026</div>
          </a>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
EOF
xdg-open /tmp/pora-preview.html
```

Expected: Sticky header, search/sort/theme button, card grid with two cards, hover effect visible.

- [ ] **Step 3: Commit**

```bash
git add dashboard/style.css
git commit -m "feat: dashboard CSS with light/dark themes, card grid, responsive layout"
```

---

## Task 8: Dashboard JavaScript

**Files:**
- Create: `dashboard/app.js`

- [ ] **Step 1: Create dashboard/app.js**

```js
// Pure functions — no DOM side-effects, safe to test in Node

function filterItems(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.filename.toLowerCase().includes(q) ||
    item.folder.toLowerCase().includes(q)
  );
}

function sortItems(items, sortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === 'modified') return b.modified.localeCompare(a.modified);
    if (sortBy === 'folder') {
      const cmp = a.folder.localeCompare(b.folder);
      return cmp !== 0 ? cmp : a.title.localeCompare(b.title);
    }
    return a.title.localeCompare(b.title);
  });
}

function groupByFolder(items) {
  const groups = {};
  for (const item of items) {
    const key = item.folder || '';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// DOM rendering

function renderCard(item) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = item.path;
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML =
    `<div class="card-title">${escapeHtml(item.title)}</div>` +
    `<div class="card-filename">${escapeHtml(item.filename)}</div>` +
    `<div class="card-modified">${formatDate(item.modified)}</div>`;
  return a;
}

function renderGroups(items, sortBy) {
  const sorted = sortItems(items, sortBy);
  const groups = groupByFolder(sorted);
  const container = document.getElementById('groups');
  container.innerHTML = '';

  for (const folder of Object.keys(groups).sort()) {
    const groupEl = document.createElement('div');

    const label = document.createElement('div');
    label.className = 'folder-label';
    label.textContent = folder || 'Root';
    groupEl.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'card-grid';
    for (const item of groups[folder]) {
      grid.appendChild(renderCard(item));
    }
    groupEl.appendChild(grid);
    container.appendChild(groupEl);
  }
}

// App state

let allItems = [];

function update() {
  const query = document.getElementById('search').value;
  const sortBy = document.getElementById('sort').value;
  const filtered = filterItems(allItems, query);
  const groups = document.getElementById('groups');
  const empty = document.getElementById('empty');

  if (filtered.length === 0) {
    groups.hidden = true;
    empty.hidden = false;
  } else {
    groups.hidden = false;
    empty.hidden = true;
    renderGroups(filtered, sortBy);
  }
}

// Theme

function initTheme() {
  const saved = localStorage.getItem('pora-theme') || 'light';
  document.documentElement.dataset.theme = saved;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('pora-theme', next);
}

// Boot

let searchTimer;

async function boot() {
  initTheme();
  document.getElementById('search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 200);
  });
  document.getElementById('sort').addEventListener('change', update);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  const status = document.getElementById('status');
  try {
    const res = await fetch('/index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allItems = data.items || [];
    status.hidden = true;
    update();
  } catch (err) {
    status.textContent = `Failed to load index: ${err.message}`;
  }
}

boot();
```

- [ ] **Step 2: Test pure functions with Node**

```bash
node -e "
// Paste pure functions inline for Node verification
function filterItems(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(i =>
    i.title.toLowerCase().includes(q) ||
    i.filename.toLowerCase().includes(q) ||
    i.folder.toLowerCase().includes(q)
  );
}
function sortItems(items, sortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === 'modified') return b.modified.localeCompare(a.modified);
    if (sortBy === 'folder') {
      const cmp = a.folder.localeCompare(b.folder);
      return cmp !== 0 ? cmp : a.title.localeCompare(b.title);
    }
    return a.title.localeCompare(b.title);
  });
}
function groupByFolder(items) {
  const groups = {};
  for (const item of items) {
    const key = item.folder || '';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

const items = [
  { title: 'Q1 Sales', filename: 'q1.html', folder: 'sales', path: '/content/sales/q1.html', modified: '2026-01-01T00:00:00Z' },
  { title: 'Alpha Report', filename: 'alpha.html', folder: 'reports', path: '/content/reports/alpha.html', modified: '2026-03-01T00:00:00Z' },
  { title: 'Budget', filename: 'budget.html', folder: '', path: '/content/budget.html', modified: '2026-02-01T00:00:00Z' },
];

const filtered = filterItems(items, 'sales');
console.assert(filtered.length === 1, 'FAIL: filter sales count');
console.assert(filtered[0].title === 'Q1 Sales', 'FAIL: filter result');

const byTitle = sortItems(items, 'title');
console.assert(byTitle[0].title === 'Alpha Report', 'FAIL: sort by title');

const byModified = sortItems(items, 'modified');
console.assert(byModified[0].title === 'Alpha Report', 'FAIL: sort by modified (newest first)');

const groups = groupByFolder(items);
console.assert(Object.keys(groups).length === 3, 'FAIL: group count');
console.assert(groups['sales'].length === 1, 'FAIL: sales group');
console.assert(groups[''].length === 1, 'FAIL: root group');

console.log('All pure function checks passed.');
"
```

Expected: `All pure function checks passed.`

- [ ] **Step 3: Commit**

```bash
git add dashboard/app.js
git commit -m "feat: dashboard JS with search, sort, folder grouping, and theme toggle"
```

---

## Task 9: Nginx Configuration

**Files:**
- Create: `nginx/nginx.conf`

- [ ] **Step 1: Create nginx/nginx.conf**

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    charset utf-8;

    # Generated index.json served from shared volume (no-cache: always fresh)
    location = /index.json {
        alias /data/index.json;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Type "application/json";
    }

    # Content files served directly
    location /content/ {
        try_files $uri =404;
    }

    # Dashboard SPA (everything else)
    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
```

- [ ] **Step 2: Validate nginx config syntax**

```bash
docker run --rm \
  -v "$(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine nginx -t
```

Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 3: Commit**

```bash
git add nginx/nginx.conf
git commit -m "feat: nginx config serving dashboard, index.json alias, and content files"
```

---

## Task 10: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  indexer:
    build: ./indexer
    environment:
      CONTENT_DIR: /content
      OUTPUT_FILE: /data/index.json
      DEBOUNCE_MS: "1000"
    volumes:
      - ./content:/content:ro
      - index_data:/data
    restart: unless-stopped

  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./dashboard:/usr/share/nginx/html:ro
      - index_data:/data:ro
      - ./content:/usr/share/nginx/html/content:ro
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - indexer
    restart: unless-stopped

volumes:
  index_data:
```

- [ ] **Step 2: Build images**

```bash
docker compose build
```

Expected: `indexer` builds from `./indexer/Dockerfile`. No errors.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: Docker Compose wiring indexer and nginx with shared volume"
```

---

## Task 11: End-to-End Integration Test

**Files:** None — verification only.

- [ ] **Step 1: Start the stack**

```bash
docker compose up -d
```

- [ ] **Step 2: Confirm both containers running**

```bash
docker compose ps
```

Expected: `indexer` and `web` both show status `running`.

- [ ] **Step 3: Check indexer logs**

```bash
docker compose logs indexer
```

Expected output includes:
```
[pora] indexed 4 files → /data/index.json
[pora] watching /content
```

- [ ] **Step 4: Verify index.json endpoint**

```bash
curl -s http://localhost:8080/index.json | python3 -m json.tool | head -20
```

Expected: valid JSON with `generated`, `total: 4`, `items` array where each item has `path` starting with `/content/`.

- [ ] **Step 5: Verify a content file is served**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/content/sales/q1.html
```

Expected: `200`

- [ ] **Step 6: Open dashboard and verify UI**

```bash
xdg-open http://localhost:8080
```

Manual checks:
- Dashboard loads with 4 content cards
- Cards grouped by folder (example, sales, root)
- Typing `sales` in search shows only Q1 Sales card
- Sort dropdown reorders cards
- Theme toggle switches light ↔ dark and persists on reload
- Clicking a card opens the HTML file in a new tab at `/content/...` URL

- [ ] **Step 7: Test live file detection**

```bash
echo '<html><head><title>Live Test</title></head><body><h1>Live</h1></body></html>' \
  > content/live-test.html
```

Wait 2 seconds, refresh dashboard. Expected: "Live Test" card appears.

- [ ] **Step 8: Clean up test file and stop stack**

```bash
rm content/live-test.html
docker compose down
```

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "chore: integration verified — all systems working"
```

---

## Self-Review

**Spec coverage:**
- ✅ Recursively scan directories (`scanner.js` walks the tree)
- ✅ Automatically detect HTML/HTM files (regex `/\.(html|htm)$/i`)
- ✅ Extract page titles (title → h1 → filename, `extractor.js`)
- ✅ Group content by folder (`groupByFolder` in `app.js`)
- ✅ Generate searchable metadata (`index.json` written by `builder.js`)
- ✅ Detect content changes automatically (chokidar watcher with debounce)
- ✅ Responsive card-based interface (CSS grid `auto-fill minmax(240px,1fr)`)
- ✅ Fast search (client-side filter with 200ms debounce)
- ✅ Client-side sorting (title / folder / modified)
- ✅ Light and dark themes (CSS custom properties + localStorage)
- ✅ Mobile-friendly layout (`@media max-width: 600px`)
- ✅ Direct file access (`/content/sales/q1.html` URL, nginx `try_files`)
- ✅ No database, no API server, no frontend framework
- ✅ Docker deployment (Compose + Dockerfile)
- ✅ Nginx Alpine web server
- ✅ Node.js 22 + chokidar

**Type consistency:**
- `buildIndex(contentDir)` → `{ generated: string, total: number, items: Item[] }`
- `Item` → `{ path: string, title: string, folder: string, filename: string, modified: string }`
- `filterItems(items, query)` → `Item[]` — consistent Task 8
- `sortItems(items, sortBy)` → `Item[]` — consistent Task 8
- `groupByFolder(items)` → `Record<string, Item[]>` — consistent Task 8

**No placeholders found.**
