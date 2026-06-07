const fs = require('node:fs');
const path = require('node:path');
const { scanDirectory } = require('./scanner');
const { extractTitle } = require('./extractor');

function buildIndex(contentDir) {
  const files = scanDirectory(contentDir);
  const items = files.map(filepath => {
    const rel = path.relative(contentDir, filepath);
    const folder = path.dirname(rel);
    const stat = fs.statSync(filepath);
    return {
      path: '/content/' + rel.replace(/\\/g, '/'),
      title: extractTitle(filepath),
      folder: folder === '.' ? '' : folder.replace(/\\/g, '/'),
      filename: path.basename(filepath),
      modified: stat.mtime.toISOString(),
    };
  });

  return {
    generated: new Date().toISOString(),
    total: items.length,
    items,
  };
}

module.exports = { buildIndex };
