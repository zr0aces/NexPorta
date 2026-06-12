// Pure functions — no DOM side-effects

function filterItems(items, query) {
  if (!query) return items;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const title = item.title.toLowerCase();
    const filename = item.filename.toLowerCase();
    const folder = item.folder.toLowerCase();
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

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Icons

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
  const fileIconSvg = new DOMParser().parseFromString(ICON_FILE, 'image/svg+xml').documentElement;
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
  const linkIconSvg = new DOMParser().parseFromString(ICON_ARROW, 'image/svg+xml').documentElement;
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
    const folderIconSvg = new DOMParser().parseFromString(ICON_FOLDER, 'image/svg+xml').documentElement;
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
    allItems = Array.isArray(data.items) ? data.items : [];
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
