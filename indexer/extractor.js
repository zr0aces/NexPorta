import fs from 'node:fs';
import path from 'node:path';

export function extractTitle(filepath) {
  let html;
  try {
    html = fs.readFileSync(filepath, 'utf8');
  } catch {
    const stem = path.basename(filepath, path.extname(filepath));
    return stem.replace(/[-_]+/g, ' ').trim();
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const t = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    if (t) return t;
  }

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const t = h1Match[1].replace(/<[^>]+>/g, '').trim();
    if (t) return t;
  }

  const stem = path.basename(filepath, path.extname(filepath));
  return stem.replace(/[-_]+/g, ' ').trim();
}
