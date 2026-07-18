import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { scanDirectory } from '../builder.js';

function makeTree(structure) {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-scan-'));
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-scan-'));
  assert.deepEqual(scanDirectory(dir), []);
});

test('returns empty array for non-existent directory', () => {
  assert.deepEqual(scanDirectory('/non/existent/path/xyz'), []);
});

test('finds HTML and Markdown files in subdirectories', () => {
  const dir = makeTree({
    'doc.md': '# MD',
    'nested/guide.markdown': '# Guide',
    'another.html': '<html></html>',
    'image.png': 'png'
  });
  const results = scanDirectory(dir);
  assert.equal(results.length, 3);
  const basenames = results.map(f => path.basename(f)).sort();
  assert.deepEqual(basenames, ['another.html', 'doc.md', 'guide.markdown']);
});
