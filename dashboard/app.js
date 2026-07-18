import { DashboardStore } from './store.js';

const store = new DashboardStore();

// Icons (Static SVGs)
const ICON_FILE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M3 1h5.5L11 4v9H3V1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M8.5 1v3.5H11" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;

const ICON_MARKDOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M3 1h5.5L11 4v9H3V1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M8.5 1v3.5H11" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M4.5 6.5v2.5m0-2.5l1.25 1.25 1.25-1.25v2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.5 6.5h1.2c.4 0 .7.3.7.7v0c0 .4-.3.7-.7.7h-1.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ICON_FOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M1 4h12v8H1V4z" to="currentColor" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M1 4V3h4l1 1H1" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;

const ICON_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 11 11" fill="none" aria-hidden="true">
  <path d="M2 9L9 2M5 2h4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Pre-parsed DOM templates for SVGs to avoid recreation in render loops (js-cache-repeated-function-calls)
const parser = new DOMParser();
const SVG_TEMPLATE_FILE = parser.parseFromString(ICON_FILE, 'image/svg+xml').documentElement;
const SVG_TEMPLATE_MARKDOWN = parser.parseFromString(ICON_MARKDOWN, 'image/svg+xml').documentElement;
const SVG_TEMPLATE_FOLDER = parser.parseFromString(ICON_FOLDER, 'image/svg+xml').documentElement;
const SVG_TEMPLATE_ARROW = parser.parseFromString(ICON_ARROW, 'image/svg+xml').documentElement;

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
  const isMd = item.filename.endsWith('.md') || item.filename.endsWith('.markdown');
  const fileIconSvg = isMd ? SVG_TEMPLATE_MARKDOWN.cloneNode(true) : SVG_TEMPLATE_FILE.cloneNode(true);
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
  modified.textContent = store.formatDate(item.modified);

  meta.append(filename, sep, modified);
  body.append(title, meta);

  const linkIcon = document.createElement('div');
  linkIcon.className = 'card-link-icon';
  const linkIconSvg = SVG_TEMPLATE_ARROW.cloneNode(true);
  linkIcon.appendChild(linkIconSvg);

  a.append(fileIcon, body, linkIcon);
  return a;
}

function renderGroups(items, sortBy) {
  const groups = store.groupByFolder(items);
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

function update() {
  const searchInput = document.getElementById('search');
  const query = searchInput.value;
  const sortBy = document.getElementById('sort').value;
  const filtered = store.filterAndSort(query, sortBy);
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
    if (store.allItems.length === 0) {
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
  const saved = store.getLocalStorage('nexporta-theme') || 'light';
  document.documentElement.dataset.theme = saved;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.setLocalStorage('nexporta-theme', next);
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
    await store.loadIndex(controller.signal);
    clearTimeout(timeout);
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

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const content = document.createElement('div');
  content.className = 'toast-content';
  content.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.innerHTML = '&times;';
  close.addEventListener('click', () => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => toast.remove());
  });

  toast.append(content, close);
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      toast.addEventListener('transitionend', () => toast.remove());
    }
  }, 4000);
}

// Modal management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');

  const input = modal.querySelector('input, select');
  if (input) input.focus();

  modal.addEventListener('keydown', trapFocus);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  modal.removeEventListener('keydown', trapFocus);
}

function trapFocus(e) {
  const modal = e.currentTarget;
  const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }
}

// Populate the destination folders dropdown
function populateUploadFolders() {
  const select = document.getElementById('select-upload-folder');
  if (!select) return;

  select.replaceChildren();
  const rootOpt = document.createElement('option');
  rootOpt.value = '';
  rootOpt.textContent = 'Root /';
  select.appendChild(rootOpt);

  const folders = new Set();
  store.allItems.forEach(item => {
    if (item.folder) folders.add(item.folder);
  });

  const sortedFolders = Array.from(folders).sort();
  sortedFolders.forEach(folder => {
    const opt = document.createElement('option');
    opt.value = folder;
    opt.textContent = folder;
    select.appendChild(opt);
  });
}

// Helper: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      const isInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (!isInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    } else if (e.key === 'Escape') {
      if (document.activeElement === searchInput) {
        searchInput.blur();
      }
      closeModal('modal-folder');
      closeModal('modal-upload');
    }
  });

  document.getElementById('sort').addEventListener('change', update);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  const btnNewFolder = document.getElementById('btn-new-folder');
  const btnUpload = document.getElementById('btn-upload');

  if (btnNewFolder) {
    btnNewFolder.addEventListener('click', () => {
      const errorEl = document.getElementById('folder-error');
      errorEl.hidden = true;
      errorEl.textContent = '';
      document.getElementById('input-folder-name').value = '';
      document.getElementById('input-folder-password').value = store.getSessionPassword();
      openModal('modal-folder');
    });
  }

  if (btnUpload) {
    btnUpload.addEventListener('click', () => {
      populateUploadFolders();
      const errorEl = document.getElementById('upload-error');
      errorEl.hidden = true;
      errorEl.textContent = '';
      document.getElementById('upload-progress-wrap').hidden = true;
      const uploadPassInput = document.getElementById('input-upload-password');
      if (uploadPassInput) uploadPassInput.value = store.getSessionPassword();
      clearSelectedFile();
      openModal('modal-upload');
    });
  }

  const btnCancelFolder = document.getElementById('btn-cancel-folder');
  const btnCloseFolderModal = document.getElementById('btn-close-folder-modal');
  const modalFolderBackdrop = document.getElementById('modal-folder-backdrop');

  const closeFolder = () => closeModal('modal-folder');
  if (btnCancelFolder) btnCancelFolder.addEventListener('click', closeFolder);
  if (btnCloseFolderModal) btnCloseFolderModal.addEventListener('click', closeFolder);
  if (modalFolderBackdrop) modalFolderBackdrop.addEventListener('click', closeFolder);

  const btnCancelUpload = document.getElementById('btn-cancel-upload');
  const btnCloseUploadModal = document.getElementById('btn-close-upload-modal');
  const modalUploadBackdrop = document.getElementById('modal-upload-backdrop');

  const closeUpload = () => closeModal('modal-upload');
  if (btnCancelUpload) btnCancelUpload.addEventListener('click', closeUpload);
  if (btnCloseUploadModal) btnCloseUploadModal.addEventListener('click', closeUpload);
  if (modalUploadBackdrop) modalUploadBackdrop.addEventListener('click', closeUpload);

  const formFolder = document.getElementById('form-folder');
  if (formFolder) {
    formFolder.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('input-folder-name');
      const passwordInput = document.getElementById('input-folder-password');
      const errorEl = document.getElementById('folder-error');
      const folderName = input.value.trim();
      const folderPassword = passwordInput.value;

      errorEl.hidden = true;
      errorEl.textContent = '';

      const regex = /^[a-zA-Z0-9_-]+$/;
      if (!regex.test(folderName)) {
        errorEl.textContent = 'Invalid folder name. Only alphanumeric characters, underscores, and dashes are allowed.';
        errorEl.hidden = false;
        return;
      }

      try {
        const res = await fetch('/api/directory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-password': folderPassword
          },
          body: JSON.stringify({ folder: folderName })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (res.status === 401) {
            store.clearPasswordSession();
          }
          throw new Error(data.error || 'Failed to create directory');
        }

        store.savePasswordSession(folderPassword);
        showToast(`Folder "${folderName}" created successfully!`, 'success');
        closeModal('modal-folder');
        input.value = '';
        passwordInput.value = '';
        loadIndex();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });
  }

  const dragDropZone = document.getElementById('drag-drop-zone');
  const inputFile = document.getElementById('input-file');
  const fileInfo = document.getElementById('selected-file-info');
  const fileName = document.getElementById('selected-file-name');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const btnSubmitUpload = document.getElementById('btn-submit-upload');

  const clearSelectedFile = () => {
    if (inputFile) inputFile.value = '';
    if (fileInfo) fileInfo.hidden = true;
    if (dragDropZone) dragDropZone.style.display = 'flex';
    if (btnSubmitUpload) btnSubmitUpload.disabled = true;
    const passwordInput = document.getElementById('input-upload-password');
    if (passwordInput) passwordInput.value = store.getSessionPassword();
  };

  const handleFileSelected = (file) => {
    const errorEl = document.getElementById('upload-error');
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.html' && ext !== '.htm' && ext !== '.md' && ext !== '.markdown') {
      if (errorEl) {
        errorEl.textContent = 'Invalid file type. Only HTML (.html, .htm) and Markdown (.md, .markdown) files are allowed.';
        errorEl.hidden = false;
      }
      clearSelectedFile();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (errorEl) {
        errorEl.textContent = 'File too large. Max size is 5MB.';
        errorEl.hidden = false;
      }
      clearSelectedFile();
      return;
    }

    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputFile) inputFile.files = dt.files;

    if (fileName) fileName.textContent = `${file.name} (${formatBytes(file.size)})`;
    if (fileInfo) fileInfo.hidden = false;
    if (dragDropZone) dragDropZone.style.display = 'none';
    if (btnSubmitUpload) btnSubmitUpload.disabled = false;
  };

  if (dragDropZone) {
    dragDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, () => {
        dragDropZone.classList.remove('dragover');
      });
    });

    dragDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropZone.classList.remove('dragover');

      if (e.dataTransfer.files.length > 0) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    dragDropZone.addEventListener('click', () => {
      if (inputFile) inputFile.click();
    });
  }

  if (inputFile) {
    inputFile.addEventListener('change', () => {
      if (inputFile.files.length > 0) {
        handleFileSelected(inputFile.files[0]);
      }
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelectedFile();
    });
  }

  const formUpload = document.getElementById('form-upload');
  if (formUpload) {
    formUpload.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = inputFile ? inputFile.files[0] : null;
      const folder = document.getElementById('select-upload-folder').value;
      const passwordInput = document.getElementById('input-upload-password');
      const errorEl = document.getElementById('upload-error');
      const progressWrap = document.getElementById('upload-progress-wrap');
      const progressBar = document.getElementById('upload-progress-fill');
      const progressText = document.getElementById('upload-progress-text');
      const uploadPassword = passwordInput.value;

      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }

      if (!file) {
        if (errorEl) {
          errorEl.textContent = 'Please select a file to upload.';
          errorEl.hidden = false;
        }
        return;
      }

      if (progressWrap) progressWrap.hidden = false;
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = '0%';
      if (btnSubmitUpload) btnSubmitUpload.disabled = true;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.setRequestHeader('x-filename', file.name);
      xhr.setRequestHeader('x-folder', folder);
      xhr.setRequestHeader('x-password', uploadPassword);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          if (progressBar) progressBar.style.width = `${percent}%`;
          if (progressText) progressText.textContent = `${percent}%`;
        }
      };

      xhr.onload = () => {
        if (progressWrap) progressWrap.hidden = true;
        if (xhr.status === 200) {
          store.savePasswordSession(uploadPassword);
          showToast(`File "${file.name}" uploaded successfully!`, 'success');
          closeModal('modal-upload');
          clearSelectedFile();
          loadIndex();
        } else {
          if (xhr.status === 401) {
            store.clearPasswordSession();
          }
          let errMsg = 'Upload failed';
          try {
            const response = JSON.parse(xhr.responseText);
            errMsg = response.error || errMsg;
          } catch (err) {}
          if (errorEl) {
            errorEl.textContent = errMsg;
            errorEl.hidden = false;
          }
          if (btnSubmitUpload) btnSubmitUpload.disabled = false;
        }
      };

      xhr.onerror = () => {
        if (progressWrap) progressWrap.hidden = true;
        if (errorEl) {
          errorEl.textContent = 'Network error during upload.';
          errorEl.hidden = false;
        }
        if (btnSubmitUpload) btnSubmitUpload.disabled = false;
      };

      xhr.send(file);
    });
  }

  store.fetchConfig().then(() => {
    loadIndex();
  });
}

boot();
