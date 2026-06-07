const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { scanDirectory } = require('../scanner');

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
