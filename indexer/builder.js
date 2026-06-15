import fs from 'node:fs';
import path from 'node:path';
import { scanDirectory } from './scanner.js';
import { extractTitle } from './extractor.js';

// Hoisted RegExp definitions for performance optimization (js-hoist-regexp)
const PATH_SPLIT_REGEX = /[\\/]/;
const BACKSLASH_REGEX = /\\/g;

export function buildIndex(contentDir) {
  const files = scanDirectory(contentDir);
  const resolvedContentDir = path.resolve(contentDir);
  const items = files.flatMap(filepath => {
    let stat;
    try {
      stat = fs.statSync(filepath);
    } catch {
      return [];
    }
    const resolvedFilepath = path.resolve(filepath);
    const rel = path.relative(resolvedContentDir, resolvedFilepath);
    // Ensure filepath is strictly inside contentDir to prevent directory traversal
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return [];
    }
    const folder = path.dirname(rel);
    return [{
      path: '/content/' + rel.split(PATH_SPLIT_REGEX).map(encodeURIComponent).join('/'),
      title: extractTitle(filepath),
      folder: folder === '.' ? '' : folder.replace(BACKSLASH_REGEX, '/'),
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

