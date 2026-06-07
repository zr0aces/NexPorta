const fs = require('node:fs');
const path = require('node:path');

function scanDirectory(rootDir) {
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
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(html|htm)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

module.exports = { scanDirectory };
