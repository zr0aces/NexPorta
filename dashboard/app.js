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
