const fs = require('node:fs');
const path = require('node:path');
const chokidar = require('chokidar');
const { buildIndex } = require('./builder');

const CONTENT_DIR = process.env.CONTENT_DIR || '/content';
const OUTPUT_FILE = process.env.OUTPUT_FILE || '/data/index.json';
const DEBOUNCE_MS_RAW = parseInt(process.env.DEBOUNCE_MS || '1000', 10);
const DEBOUNCE_MS = isNaN(DEBOUNCE_MS_RAW) ? 1000 : DEBOUNCE_MS_RAW;

function writeIndex() {
  try {
    const index = buildIndex(CONTENT_DIR);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    console.log(`[nexporta] indexed ${index.total} files → ${OUTPUT_FILE}`);
  } catch (err) {
    console.error(`[nexporta] index write failed: ${err.message}`);
  }
}

writeIndex();

let debounceTimer;
chokidar
  .watch(CONTENT_DIR, { ignoreInitial: true, persistent: true })
  .on('all', (event, filePath) => {
    console.log(`[nexporta] ${event}: ${filePath}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(writeIndex, DEBOUNCE_MS);
  })
  .on('error', (err) => {
    console.error(`[nexporta] watcher error: ${err.message}`);
  });

console.log(`[nexporta] watching ${CONTENT_DIR}`);
