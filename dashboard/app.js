// Pure functions — no DOM side-effects

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
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Icons

const ICON_FILE = `<svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M3 1h5.5L11 4v9H3V1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M8.5 1v3.5H11" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;

const ICON_FOLDER = `<svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M1 4h12v8H1V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M1 4V3h4l1 1H1" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;

const ICON_ARROW = `<svg width="14" height="14" viewBox="0 0 11 11" fill="none" aria-hidden="true">
  <path d="M2 9L9 2M5 2h4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// DOM rendering

function renderCard(item) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = item.path;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.referrerPolicy = 'no-referrer';
  a.innerHTML =
    `<div class="card-file-icon">${ICON_FILE}</div>` +
    `<div class="card-body">` +
      `<div class="card-title">${escapeHtml(item.title)}</div>` +
      `<div class="card-meta">` +
        `<span class="card-filename">${escapeHtml(item.filename)}</span>` +
        `<span class="card-sep">·</span>` +
        `<span>${formatDate(item.modified)}</span>` +
      `</div>` +
    `</div>` +
    `<div class="card-link-icon">${ICON_ARROW}</div>`;
  return a;
}

function renderGroups(items, sortBy) {
  const sorted = sortItems(items, sortBy);
  const groups = groupByFolder(sorted);
  const container = document.getElementById('groups');
  container.innerHTML = '';

  const folders = Object.keys(groups).sort();
  folders.forEach((folder, i) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'folder-group';
    groupEl.style.animationDelay = `${i * 60}ms`;

    const count = groups[folder].length;
    const header = document.createElement('div');
    header.className = 'folder-header';
    header.innerHTML =
      `<span class="folder-icon">${ICON_FOLDER}</span>` +
      `<span class="folder-name">${escapeHtml(folder || 'Root')}</span>` +
      `<span class="folder-count">${count} ${count === 1 ? 'file' : 'files'}</span>` +
      `<span class="folder-rule"></span>`;
    groupEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'card-grid';
    for (const item of groups[folder]) {
      grid.appendChild(renderCard(item));
    }
    groupEl.appendChild(grid);
    container.appendChild(groupEl);
  });
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
  const saved = localStorage.getItem('nexporta-theme') || 'light';
  document.documentElement.dataset.theme = saved;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('nexporta-theme', next);
}

// Boot

let searchTimer;

async function loadIndex() {
  const status = document.getElementById('status');
  status.hidden = false;
  status.innerHTML = '<span class="status-spinner"></span>Loading';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('/index.json', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allItems = Array.isArray(data.items) ? data.items : [];
    status.hidden = true;
    update();
  } catch (err) {
    clearTimeout(timeout);
    const msg = err.name === 'AbortError' ? 'Request timed out' : err.message;
    status.innerHTML =
      `<span class="status-err">Could not load index.json — ${escapeHtml(msg)}</span>` +
      `<button class="status-retry">Retry</button>`;
    status.querySelector('.status-retry').addEventListener('click', loadIndex);
  }
}

function boot() {
  initTheme();
  document.getElementById('search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 200);
  });
  document.getElementById('sort').addEventListener('change', update);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  loadIndex();
}

boot();
