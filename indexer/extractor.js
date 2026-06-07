const fs = require('node:fs');
const path = require('node:path');

function extractTitle(filepath) {
  let html;
  try {
    html = fs.readFileSync(filepath, 'utf8');
  } catch {
    const stem = path.basename(filepath, path.extname(filepath));
    return stem.replace(/[-_]+/g, ' ').trim();
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) return titleMatch[1].trim();

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1].trim()) return h1Match[1].trim();

  const stem = path.basename(filepath, path.extname(filepath));
  return stem.replace(/[-_]+/g, ' ').trim();
}

module.exports = { extractTitle };
