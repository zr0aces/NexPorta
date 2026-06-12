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

  // Strip HTML comments to avoid matching commented-out tags
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '');

  // Helper to decode HTML entities
  function decodeEntities(str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&(apos|#39);/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  }

  const titleMatch = cleanHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const t = decodeEntities(titleMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (t) return t;
  }

  const h1Match = cleanHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const t = decodeEntities(h1Match[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (t) return t;
  }

  const stem = path.basename(filepath, path.extname(filepath));
  return stem.replace(/[-_]+/g, ' ').trim();
}
