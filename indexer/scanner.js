import fs from 'node:fs';
import path from 'node:path';

const EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.claude']);

export function scanDirectory(rootDir) {
  const results = [];
  if (!fs.existsSync(rootDir)) return results;

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(path.join(dir, entry.name));
      } else if (/\.(html|htm)$/i.test(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  walk(rootDir);
  return results;
}
