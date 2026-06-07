const fs = require('node:fs');
const path = require('node:path');
const { scanDirectory } = require('./scanner');
const { extractTitle } = require('./extractor');

function buildIndex(contentDir) {
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
      path: '/content/' + rel.replace(/\\/g, '/'),
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

module.exports = { buildIndex };
