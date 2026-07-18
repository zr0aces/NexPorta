import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { DashboardStore } from '../../dashboard/store.js';

before(() => {
  globalThis.window = {
    addEventListener: () => {}
  };

  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = String(val); }
  };

  globalThis.fetch = async (url) => {
    if (url === '/api/config') {
      return {
        ok: true,
        json: async () => ({ sessionTimeoutMinutes: 15 })
      };
    }
    if (url === '/index.json') {
      return {
        ok: true,
        json: async () => ({
          generated: 'ISO',
          items: [
            { path: '/content/sales/q1.html', title: 'Q1 Sales', folder: 'sales', filename: 'q1.html', modified: '2026-06-01T00:00:00Z' },
            { path: '/content/readme.html', title: 'Readme', folder: '', filename: 'readme.html', modified: '2026-06-02T00:00:00Z' }
          ]
        })
      };
    }
    return { ok: false };
  };
});

test('DashboardStore local storage caching works', () => {
  const store = new DashboardStore();
  store.setLocalStorage('my-theme', 'dark');
  assert.equal(store.getLocalStorage('my-theme'), 'dark');
});

test('DashboardStore date formatting handles empty and valid inputs', () => {
  const store = new DashboardStore();
  assert.equal(store.formatDate(''), '—');
  assert.equal(store.formatDate(null), '—');
  assert.ok(store.formatDate('2026-06-01T00:00:00Z').includes('Jun'));
});

test('DashboardStore loads index and builds search properties', async () => {
  const store = new DashboardStore();
  const items = await store.loadIndex();
  assert.equal(items.length, 2);
  assert.equal(items[0].titleLower, 'q1 sales');
  assert.equal(items[1].titleLower, 'readme');
});

test('DashboardStore filter and sort logic works', async () => {
  const store = new DashboardStore();
  await store.loadIndex();

  const filtered = store.filterAndSort('sales', 'title');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].filename, 'q1.html');

  const sorted = store.filterAndSort('', 'modified');
  assert.equal(sorted[0].filename, 'readme.html');
});

test('DashboardStore group by folder works', async () => {
  const store = new DashboardStore();
  await store.loadIndex();

  const groups = store.groupByFolder(store.allItems);
  assert.ok(groups['sales']);
  assert.ok(groups['']);
  assert.equal(groups['sales'][0].filename, 'q1.html');
  assert.equal(groups[''][0].filename, 'readme.html');
});
