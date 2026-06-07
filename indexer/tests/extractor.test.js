import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { extractTitle } from '../extractor.js';

function writeTempFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexporta-test-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

test('extracts <title> tag content', () => {
  const file = writeTempFile('test.html', '<html><head><title>My Report</title></head><body></body></html>');
  assert.equal(extractTitle(file), 'My Report');
});

test('falls back to first <h1> when no <title>', () => {
  const file = writeTempFile('test.html', '<html><body><h1>Heading One</h1></body></html>');
  assert.equal(extractTitle(file), 'Heading One');
});

test('falls back to filename stem when no title or h1', () => {
  const file = writeTempFile('my-report.html', '<html><body><p>No heading.</p></body></html>');
  assert.equal(extractTitle(file), 'my report');
});

test('trims whitespace from extracted title', () => {
  const file = writeTempFile('test.html', '<html><head><title>  Spaced Title  </title></head></html>');
  assert.equal(extractTitle(file), 'Spaced Title');
});

test('prefers <title> over <h1> when both present', () => {
  const file = writeTempFile('test.html',
    '<html><head><title>Title Tag</title></head><body><h1>H1 Tag</h1></body></html>');
  assert.equal(extractTitle(file), 'Title Tag');
});

test('falls back to h1 when title is whitespace-only', () => {
  const file = writeTempFile('test.html', '<html><head><title>   </title></head><body><h1>Real Heading</h1></body></html>');
  assert.equal(extractTitle(file), 'Real Heading');
});

test('strips nested HTML tags from h1', () => {
  const file = writeTempFile('test.html',
    '<html><body><h1><a href="page.html">Linked Title</a></h1></body></html>');
  assert.equal(extractTitle(file), 'Linked Title');
});
