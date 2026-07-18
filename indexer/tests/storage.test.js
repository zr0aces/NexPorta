import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Readable } from 'node:stream';
import {
  ContentStorage,
  TraversalError,
  InvalidFolderError,
  InvalidFilenameError,
  InvalidExtensionError,
  FileExistsError,
  FileTooLargeError
} from '../storage.js';

let tempContentDir;
let storage;

before(() => {
  tempContentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-storage-test-'));
  storage = new ContentStorage(tempContentDir);
});

after(() => {
  if (tempContentDir && fs.existsSync(tempContentDir)) {
    fs.rmSync(tempContentDir, { recursive: true, force: true });
  }
});

test('ContentStorage resolves safe folder path correctly', () => {
  const p = storage.getSafeFolderPath('sub');
  assert.equal(p, path.join(tempContentDir, 'sub'));
});

test('ContentStorage throws on folder traversal', () => {
  assert.throws(() => {
    storage.getSafeFolderPath('../traversal');
  }, InvalidFolderError);

  assert.throws(() => {
    storage.getSafeFolderPath('sub/sub2');
  }, InvalidFolderError);
});

test('ContentStorage throws on invalid filename', () => {
  assert.throws(() => {
    storage.getSafeFilePath('', 'sub/file.html');
  }, InvalidFilenameError);

  assert.throws(() => {
    storage.getSafeFilePath('', 'invalid.js');
  }, InvalidExtensionError);
});

test('ContentStorage creates directory correctly', async () => {
  const folder = 'new-dir';
  await storage.createDirectory(folder);
  const fullPath = path.join(tempContentDir, folder);
  assert.ok(fs.existsSync(fullPath));
  assert.ok(fs.statSync(fullPath).isDirectory());
});

test('ContentStorage saves file correctly', async () => {
  const folder = 'reports';
  await storage.createDirectory(folder);
  
  const content = '<html>hello</html>';
  const stream = Readable.from([content]);
  
  const urlPath = await storage.saveFile(folder, 'test.html', stream, content.length);
  assert.equal(urlPath, '/content/reports/test.html');
  
  const filePath = path.join(tempContentDir, folder, 'test.html');
  assert.ok(fs.existsSync(filePath));
  assert.equal(fs.readFileSync(filePath, 'utf-8'), content);
});

test('ContentStorage throws if directory does not exist', async () => {
  const stream = Readable.from(['content']);
  await assert.rejects(async () => {
    await storage.saveFile('nonexistent-dir-123', 'file.html', stream);
  }, InvalidFolderError);
});

test('ContentStorage throws if file already exists', async () => {
  const folder = 'reports';
  const filePath = path.join(tempContentDir, folder, 'test.html');
  // File exists from previous test
  const stream = Readable.from(['new content']);
  await assert.rejects(async () => {
    await storage.saveFile(folder, 'test.html', stream);
  }, FileExistsError);
});

test('ContentStorage throws if file exceeds size limit via content-length', async () => {
  const folder = 'reports';
  const stream = Readable.from(['a']);
  const largeSize = 5 * 1024 * 1024 + 1;
  await assert.rejects(async () => {
    await storage.saveFile(folder, 'large.html', stream, largeSize);
  }, FileTooLargeError);
});

test('ContentStorage throws if file exceeds size limit via data stream', async () => {
  const folder = 'reports';
  // Send 6 chunks of 1MB
  let chunkCount = 6;
  let sentChunks = 0;
  const stream = new Readable({
    read() {
      if (sentChunks < chunkCount) {
        this.push(Buffer.alloc(1024 * 1024, 'a'));
        sentChunks++;
      } else {
        this.push(null);
      }
    }
  });

  await assert.rejects(async () => {
    await storage.saveFile(folder, 'large-stream.html', stream);
  }, FileTooLargeError);

  const filePath = path.join(tempContentDir, folder, 'large-stream.html');
  assert.ok(!fs.existsSync(filePath));
});
