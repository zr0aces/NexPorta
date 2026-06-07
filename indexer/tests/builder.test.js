import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { buildIndex } from '../builder.js';

function makeContentDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-build-'));
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-build-'));
  const index = buildIndex(dir);
  assert.equal(index.total, 0);
  assert.deepEqual(index.items, []);
});
