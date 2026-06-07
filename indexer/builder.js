import fs from 'node:fs';
import path from 'node:path';
import { scanDirectory } from './scanner.js';
import { extractTitle } from './extractor.js';

export function buildIndex(contentDir) {
  const files = scanDirectory(contentDir);
  const items = files.flatMap(filepath => {
    let stat;
    try {
      stat = fs.statSync(filepath);
    } catch {
      return [];
    }
    const rel = path.relative(contentDir, filepath);
    const folder = path.dirname(rel);
    return [{
      path: '/content/' + rel.split(/[\\/]/).map(encodeURIComponent).join('/'),
      title: extractTitle(filepath),
      folder: folder === '.' ? '' : folder.replace(/\\/g, '/'),
      filename: path.basename(filepath),
      modified: stat.mtime.toISOString(),
    }];
  });

  return {
    generated: new Date().toISOString(),
    total: items.length,
    items,
  };
}
