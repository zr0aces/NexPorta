export class DashboardStore {
  constructor() {
    this.allItems = [];
    this.storageCache = new Map();
    this.dateCache = new Map();
    this.sessionPassword = '';
    this.sessionExpiry = 0;
    this.sessionTimeoutMinutes = 30;

    window.addEventListener('storage', (e) => {
      if (e.key) this.storageCache.delete(e.key);
    });
  }

  getLocalStorage(key) {
    if (!this.storageCache.has(key)) {
      this.storageCache.set(key, localStorage.getItem(key));
    }
    return this.storageCache.get(key);
  }

  setLocalStorage(key, value) {
    localStorage.setItem(key, value);
    this.storageCache.set(key, value);
  }

  formatDate(iso) {
    if (!iso) return '—';
    let cached = this.dateCache.get(iso);
    if (cached !== undefined) return cached;

    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      this.dateCache.set(iso, '—');
      return '—';
    }
    const formatted = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    this.dateCache.set(iso, formatted);
    return formatted;
  }

  async fetchConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.sessionTimeoutMinutes === 'number') {
          this.sessionTimeoutMinutes = data.sessionTimeoutMinutes;
        }
      }
    } catch (err) {
      console.warn('[nexporta] Failed to fetch API config, using default timeout.', err);
    }
  }

  getSessionPassword() {
    if (this.sessionPassword && Date.now() < this.sessionExpiry) {
      return this.sessionPassword;
    }
    this.sessionPassword = '';
    this.sessionExpiry = 0;
    return '';
  }

  savePasswordSession(password) {
    if (!password) return;
    this.sessionPassword = password;
    this.sessionExpiry = Date.now() + this.sessionTimeoutMinutes * 60 * 1000;
  }

  clearPasswordSession() {
    this.sessionPassword = '';
    this.sessionExpiry = 0;
  }

  async loadIndex(signal) {
    const res = await fetch('/index.json', { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    this.allItems = (Array.isArray(data.items) ? data.items : []).map(item => ({
      ...item,
      titleLower: (item.title || '').toLowerCase(),
      filenameLower: (item.filename || '').toLowerCase(),
      folderLower: (item.folder || '').toLowerCase()
    }));
    return this.allItems;
  }

  filterAndSort(query, sortBy) {
    let filtered = this.allItems;
    if (query) {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter(item => {
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

    return [...filtered].sort((a, b) => {
      if (sortBy === 'modified') return b.modified.localeCompare(a.modified);
      if (sortBy === 'folder') {
        const cmp = a.folder.localeCompare(b.folder);
        return cmp !== 0 ? cmp : a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
  }

  groupByFolder(items) {
    const groups = {};
    for (const item of items) {
      const key = item.folder || '';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }
}
