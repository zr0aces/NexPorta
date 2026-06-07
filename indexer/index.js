const fs = require('node:fs');
const path = require('node:path');
const chokidar = require('chokidar');
const { buildIndex } = require('./builder');

const CONTENT_DIR = process.env.CONTENT_DIR || '/content';
const OUTPUT_FILE = process.env.OUTPUT_FILE || '/data/index.json';
const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS || '1000', 10);

function writeIndex() {
  const index = buildIndex(CONTENT_DIR);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`[pora] indexed ${index.total} files → ${OUTPUT_FILE}`);
}

writeIndex();

let debounceTimer;
chokidar
  .watch(CONTENT_DIR, { ignoreInitial: true, persistent: true })
  .on('all', (event, filePath) => {
    console.log(`[pora] ${event}: ${filePath}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(writeIndex, DEBOUNCE_MS);
  });

console.log(`[pora] watching ${CONTENT_DIR}`);
