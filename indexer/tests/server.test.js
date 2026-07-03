import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let tempContentDir;
let server;
let serverUrl;
let createApiServer;

before(async () => {
  // Set API_PASSWORD before dynamically importing server.js to ensure it's evaluated with it
  process.env.API_PASSWORD = 'test-pass';
  const serverModule = await import('../server.js');
  createApiServer = serverModule.createApiServer;

  // Setup temporary content directory
  tempContentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-server-test-'));
  
  // Start server on a random port
  server = createApiServer(tempContentDir);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      serverUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  // Shutdown server and clean up temp folder
  if (server) server.close();
  if (tempContentDir && fs.existsSync(tempContentDir)) {
    fs.rmSync(tempContentDir, { recursive: true, force: true });
  }
});

test('HTTP server 404 for unknown path', async () => {
  const res = await fetch(`${serverUrl}/api/nonexistent`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.deepEqual(data, { error: 'Not Found' });
});

test('GET /api/config returns default sessionTimeoutMinutes', async () => {
  const res = await fetch(`${serverUrl}/api/config`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.sessionTimeoutMinutes, 30);
});

test('GET /api/config returns custom sessionTimeoutMinutes if set', async () => {
  process.env.SESSION_TIMEOUT_MINUTES = '45';
  const res = await fetch(`${serverUrl}/api/config`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.sessionTimeoutMinutes, 45);
  // Reset for other tests
  delete process.env.SESSION_TIMEOUT_MINUTES;
});

test('POST /api/directory rejects request without password', async () => {
  const res = await fetch(`${serverUrl}/api/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'no-pass-dir' })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Unauthorized/);
});

test('POST /api/directory rejects request with incorrect password', async () => {
  const res = await fetch(`${serverUrl}/api/directory`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-password': 'wrong-pass'
    },
    body: JSON.stringify({ folder: 'wrong-pass-dir' })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/directory creates a folder with correct password', async () => {
  const folderName = 'marketing';
  const res = await fetch(`${serverUrl}/api/directory`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-password': 'test-pass'
    },
    body: JSON.stringify({ folder: folderName })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { success: true });
  
  const folderPath = path.join(tempContentDir, folderName);
  assert.ok(fs.existsSync(folderPath));
  assert.ok(fs.statSync(folderPath).isDirectory());
});

test('POST /api/directory rejects nested folder creation with correct password', async () => {
  const res = await fetch(`${serverUrl}/api/directory`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-password': 'test-pass'
    },
    body: JSON.stringify({ folder: 'nested/subfolder' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Only single-level directories are supported/);
});

test('POST /api/directory rejects directory traversal with correct password', async () => {
  const res = await fetch(`${serverUrl}/api/directory`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-password': 'test-pass'
    },
    body: JSON.stringify({ folder: '../traversal' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/upload rejects upload without password', async () => {
  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': 'nopass.html',
      'Content-Type': 'text/html'
    },
    body: '<html></html>'
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/upload rejects upload with incorrect password', async () => {
  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': 'wrongpass.html',
      'x-password': 'wrong-password',
      'Content-Type': 'text/html'
    },
    body: '<html></html>'
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/upload uploads a file with correct password', async () => {
  // Create target directory first
  const folderName = 'reports';
  fs.mkdirSync(path.join(tempContentDir, folderName), { recursive: true });

  const filename = 'q1.html';
  const fileContent = '<html><head><title>Q1 Report</title></head><body>Hello</body></html>';

  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': filename,
      'x-folder': folderName,
      'x-password': 'test-pass',
      'Content-Type': 'text/html'
    },
    body: fileContent
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.path, `/content/${folderName}/${filename}`);

  const filePath = path.join(tempContentDir, folderName, filename);
  assert.ok(fs.existsSync(filePath));
  assert.equal(fs.readFileSync(filePath, 'utf-8'), fileContent);
});

test('POST /api/upload uploads a markdown file with correct password', async () => {
  // Create target directory first
  const folderName = 'reports';
  fs.mkdirSync(path.join(tempContentDir, folderName), { recursive: true });

  const filename = 'guide.md';
  const fileContent = '# Guide Title\nThis is markdown text.';

  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': filename,
      'x-folder': folderName,
      'x-password': 'test-pass',
      'Content-Type': 'text/markdown'
    },
    body: fileContent
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.path, `/content/${folderName}/${filename}`);

  const filePath = path.join(tempContentDir, folderName, filename);
  assert.ok(fs.existsSync(filePath));
  assert.equal(fs.readFileSync(filePath, 'utf-8'), fileContent);
});

test('POST /api/upload rejects existing files (overwrite prevention) with correct password', async () => {
  const filename = 'existing.html';
  const filePath = path.join(tempContentDir, filename);
  fs.writeFileSync(filePath, 'original content');

  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': filename,
      'x-password': 'test-pass',
      'Content-Type': 'text/html'
    },
    body: 'new content'
  });

  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'File already exists.');
  
  // Verify content was not modified
  assert.equal(fs.readFileSync(filePath, 'utf-8'), 'original content');
});

test('POST /api/upload rejects non-allowed extensions with correct password', async () => {
  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': 'malicious.js',
      'x-password': 'test-pass',
      'Content-Type': 'application/javascript'
    },
    body: 'console.log("malicious");'
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Only HTML \(.html, .htm\) and Markdown \(.md, .markdown\) files are allowed/);
});

test('POST /api/upload rejects traversal filenames with correct password', async () => {
  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': '../traversal.html',
      'x-password': 'test-pass',
      'Content-Type': 'text/html'
    },
    body: '<html></html>'
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/upload rejects nested folder upload destination with correct password', async () => {
  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': 'test.html',
      'x-folder': 'nested/path',
      'x-password': 'test-pass',
      'Content-Type': 'text/html'
    },
    body: '<html></html>'
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Only single-level directories are supported/);
});

test('POST /api/upload rejects uploads to non-existent directories with correct password', async () => {
  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'x-filename': 'test.html',
      'x-folder': 'ghost-folder',
      'x-password': 'test-pass',
      'Content-Type': 'text/html'
    },
    body: '<html></html>'
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Target directory does not exist/);
});
