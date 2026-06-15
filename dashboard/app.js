// Hoisted RegExp definitions for performance optimization (js-hoist-regexp)
const SPACES_REGEX = /\s+/;

// LocalStorage caching (js-cache-storage)
const storageCache = new Map();

function getLocalStorage(key) {
  if (!storageCache.has(key)) {
    storageCache.set(key, localStorage.getItem(key));
  }
  return storageCache.get(key);
}

function setLocalStorage(key, value) {
  localStorage.setItem(key, value);
  storageCache.set(key, value);
}

// Invalidate localStorage cache on external changes
window.addEventListener('storage', (e) => {
  if (e.key) storageCache.delete(e.key);
});

// Cache for formatted dates (js-cache-repeated-function-calls)
const dateCache = new Map();

function formatDate(iso) {
  if (!iso) return '—';
  let cached = dateCache.get(iso);
  if (cached !== undefined) return cached;

  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    dateCache.set(iso, '—');
    return '—';
  }
  const formatted = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  dateCache.set(iso, formatted);
  return formatted;
}

// Icons (Static SVGs)
const ICON_FILE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M3 1h5.5L11 4v9H3V1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M8.5 1v3.5H11" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;

const ICON_FOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M1 4h12v8H1V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M1 4V3h4l1 1H1" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;

const ICON_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 11 11" fill="none" aria-hidden="true">
  <path d="M2 9L9 2M5 2h4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Pre-parsed DOM templates for SVGs to avoid recreation in render loops (js-cache-repeated-function-calls)
const parser = new DOMParser();
const SVG_TEMPLATE_FILE = parser.parseFromString(ICON_FILE, 'image/svg+xml').documentElement;
const SVG_TEMPLATE_FOLDER = parser.parseFromString(ICON_FOLDER, 'image/svg+xml').documentElement;
const SVG_TEMPLATE_ARROW = parser.parseFromString(ICON_ARROW, 'image/svg+xml').documentElement;

// Pure functions — no DOM side-effects

function filterItems(items, query) {
  if (!query) return items;
  const terms = query.toLowerCase().split(SPACES_REGEX).filter(Boolean);
  return items.filter(item => {
    // Utilize pre-lowercased properties to avoid string operations in loops (js-cache-property-access)
    const title = item.titleLower;
    const filename = item.filenameLower;
    const folder = item.folderLower;
    return terms.every(term =>
      title.includes(term) ||
      filename.includes(term) ||
      folder.includes(term)
    );
  });
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

// DOM rendering

function renderCard(item) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = item.path;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.referrerPolicy = 'no-referrer';

  const fileIcon = document.createElement('div');
  fileIcon.className = 'card-file-icon';
  // Clone pre-parsed SVG template instead of parsing string every time (js-cache-repeated-function-calls)
  const fileIconSvg = SVG_TEMPLATE_FILE.cloneNode(true);
  fileIcon.appendChild(fileIconSvg);

  const body = document.createElement('div');
  body.className = 'card-body';

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = item.title;

  const meta = document.createElement('div');
  meta.className = 'card-meta';

  const filename = document.createElement('span');
  filename.className = 'card-filename';
  filename.textContent = item.filename;

  const sep = document.createElement('span');
  sep.className = 'card-sep';
  sep.textContent = ' · ';

  const modified = document.createElement('span');
  modified.textContent = formatDate(item.modified);

  meta.append(filename, sep, modified);
  body.append(title, meta);

  const linkIcon = document.createElement('div');
  linkIcon.className = 'card-link-icon';
  // Clone pre-parsed SVG template (js-cache-repeated-function-calls)
  const linkIconSvg = SVG_TEMPLATE_ARROW.cloneNode(true);
  linkIcon.appendChild(linkIconSvg);

  a.append(fileIcon, body, linkIcon);
  return a;
}

function renderGroups(items, sortBy) {
  const sorted = sortItems(items, sortBy);
  const groups = groupByFolder(sorted);
  const container = document.getElementById('groups');
  container.replaceChildren();

  const folders = Object.keys(groups).sort();
  folders.forEach((folder, i) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'folder-group';
    groupEl.style.animationDelay = `${i * 60}ms`;

    const count = groups[folder].length;
    const header = document.createElement('div');
    header.className = 'folder-header';

    const folderIcon = document.createElement('span');
    folderIcon.className = 'folder-icon';
    // Clone pre-parsed SVG template (js-cache-repeated-function-calls)
    const folderIconSvg = SVG_TEMPLATE_FOLDER.cloneNode(true);
    folderIcon.appendChild(folderIconSvg);

    const folderName = document.createElement('span');
    folderName.className = 'folder-name';
    folderName.textContent = folder || 'Root';

    const folderCount = document.createElement('span');
    folderCount.className = 'folder-count';
    folderCount.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;

    const folderRule = document.createElement('span');
    folderRule.className = 'folder-rule';

    header.append(folderIcon, folderName, folderCount, folderRule);
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
  const searchInput = document.getElementById('search');
  const query = searchInput.value;
  const sortBy = document.getElementById('sort').value;
  const filtered = filterItems(allItems, query);
  const groups = document.getElementById('groups');
  const empty = document.getElementById('empty');

  const searchClear = document.getElementById('search-clear');
  if (searchClear) {
    searchClear.hidden = !query;
  }

  if (filtered.length === 0) {
    groups.hidden = true;
    empty.hidden = false;
    
    const emptyTitle = document.getElementById('empty-title');
    const emptySub = document.getElementById('empty-subtitle');
    if (allItems.length === 0) {
      emptyTitle.textContent = 'No files indexed yet';
      emptySub.textContent = 'Add HTML files to your content directory and the indexer will automatically discover them.';
    } else {
      emptyTitle.textContent = 'No matching files';
      emptySub.textContent = `No files found for "${query}". Try checking your spelling or using a different query.`;
    }
  } else {
    groups.hidden = false;
    empty.hidden = true;
    renderGroups(filtered, sortBy);
  }
}

// Theme

function initTheme() {
  const saved = getLocalStorage('nexporta-theme') || 'light';
  document.documentElement.dataset.theme = saved;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  setLocalStorage('nexporta-theme', next);
}

// Boot

let searchTimer;

function initVersionLabel() {
  const el = document.getElementById('app-version');
  if (!el) return;
  const version = typeof window.NEXPORTA_VERSION === 'string' ? window.NEXPORTA_VERSION : '';
  el.textContent = version ? `v${version}` : '';
}

async function loadIndex() {
  const status = document.getElementById('status');
  status.hidden = false;
  status.replaceChildren();

  const spinner = document.createElement('span');
  spinner.className = 'status-spinner';
  status.append(spinner, document.createTextNode('Loading'));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('/index.json', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // Pre-calculate lowercased values on load to speed up search comparisons (js-cache-property-access)
    allItems = (Array.isArray(data.items) ? data.items : []).map(item => ({
      ...item,
      titleLower: (item.title || '').toLowerCase(),
      filenameLower: (item.filename || '').toLowerCase(),
      folderLower: (item.folder || '').toLowerCase()
    }));
    
    status.hidden = true;
    update();
  } catch (err) {
    clearTimeout(timeout);
    const msg = err.name === 'AbortError' ? 'Request timed out' : err.message;
    
    status.replaceChildren();
    
    const errSpan = document.createElement('span');
    errSpan.className = 'status-err';
    errSpan.textContent = `Could not load index.json — ${msg}`;
    
    const retryBtn = document.createElement('button');
    retryBtn.className = 'status-retry';
    retryBtn.textContent = 'Retry';
    retryBtn.addEventListener('click', loadIndex);
    
    status.append(errSpan, retryBtn);
  }
}

function boot() {
  initVersionLabel();
  initTheme();
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 200);
  });

  const searchClear = document.getElementById('search-clear');
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      update();
    });
  }

  // Keyboard shortcut: Press '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    } else if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.blur();
    }
  });

  document.getElementById('sort').addEventListener('change', update);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  loadIndex();
}

boot();
