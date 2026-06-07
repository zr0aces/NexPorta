const fs = require('node:fs');
const path = require('node:path');

function extractTitle(filepath) {
  const html = fs.readFileSync(filepath, 'utf8');

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();

  const stem = path.basename(filepath, path.extname(filepath));
  return stem.replace(/[-_]/g, ' ');
}

module.exports = { extractTitle };
