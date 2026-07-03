import fs from 'node:fs';
import path from 'node:path';
import chokidar from 'chokidar';
import { buildIndex } from './builder.js';
import { createApiServer } from './server.js';

const CONTENT_DIR = process.env.CONTENT_DIR || '/content';
const OUTPUT_FILE = process.env.OUTPUT_FILE || '/data/index.json';
const DEBOUNCE_MS_RAW = parseInt(process.env.DEBOUNCE_MS || '1000', 10);
const DEBOUNCE_MS = isNaN(DEBOUNCE_MS_RAW) ? 1000 : DEBOUNCE_MS_RAW;

const HOST = process.env.HOST || '127.0.0.1';
const PORT_RAW = parseInt(process.env.PORT || '3000', 10);
const PORT = isNaN(PORT_RAW) ? 3000 : PORT_RAW;

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
  .watch(CONTENT_DIR, { 
    ignoreInitial: true, 
    persistent: true,
    ignored: [/(^|[\/\\])\../, '**/node_modules/**', '**/dist/**', '**/build/**']
  })
  .on('all', (event, filePath) => {
    console.log(`[nexporta] ${event}: ${filePath}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(writeIndex, DEBOUNCE_MS);
  })
  .on('error', (err) => {
    console.error(`[nexporta] watcher error: ${err.message}`);
  });

console.log(`[nexporta] watching ${CONTENT_DIR}`);

const apiServer = createApiServer(CONTENT_DIR);
apiServer.listen(PORT, HOST, () => {
  console.log(`[nexporta] API server listening on http://${HOST}:${PORT}`);
});

