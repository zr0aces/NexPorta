import fs from 'node:fs';
import path from 'node:path';

const PATH_SPLIT_REGEX = /[\\/]/;
const BACKSLASH_REGEX = /\\/g;

const EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.claude']);
const ALLOWED_EXT_REGEX = /\.(html|htm|md|markdown)$/i;

const DASH_UNDERSCORE_REGEX = /[-_]+/g;
const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;
const AMP_REGEX = /&amp;/g;
const LT_REGEX = /&lt;/g;
const GT_REGEX = /&gt;/g;
const QUOT_REGEX = /&quot;/g;
const APOS_REGEX = /&(apos|#39);/g;
const HEX_ENTITY_REGEX = /&#x([0-9a-fA-F]+);/g;
const DEC_ENTITY_REGEX = /&#([0-9]+);/g;
const TITLE_TAG_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const H1_TAG_REGEX = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
const HTML_TAG_REGEX = /<[^>]+>/g;
const SPACES_REGEX = /\s+/g;

function decodeEntities(str) {
  if (!str.includes('&')) return str;

  return str
    .replace(AMP_REGEX, '&')
    .replace(LT_REGEX, '<')
    .replace(GT_REGEX, '>')
    .replace(QUOT_REGEX, '"')
    .replace(APOS_REGEX, "'")
    .replace(HEX_ENTITY_REGEX, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(DEC_ENTITY_REGEX, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

export function extractTitle(filepath) {
  let content;
  try {
    content = fs.readFileSync(filepath, 'utf8');
  } catch {
    const stem = path.basename(filepath, path.extname(filepath));
    return stem.replace(DASH_UNDERSCORE_REGEX, ' ').trim();
  }

  const ext = path.extname(filepath).toLowerCase();
  if (ext === '.md' || ext === '.markdown') {
    const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (fmMatch) {
      const fmContent = fmMatch[1];
      const titleLine = fmContent.split('\n').find(line => line.trim().startsWith('title:'));
      if (titleLine) {
        let val = titleLine.split(':').slice(1).join(':').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (val) return val.trim();
      }
    }

    const atxMatch = content.match(/^#\s+(.+)$/m);
    if (atxMatch) {
      let t = atxMatch[1].trim();
      t = t.replace(/[\*_`#]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(SPACES_REGEX, ' ').trim();
      if (t) return t;
    }

    const stem = path.basename(filepath, ext);
    return stem.replace(DASH_UNDERSCORE_REGEX, ' ').trim();
  }

  const cleanHtml = content.replace(HTML_COMMENT_REGEX, '');

  const titleMatch = cleanHtml.match(TITLE_TAG_REGEX);
  if (titleMatch) {
    const t = decodeEntities(titleMatch[1].replace(HTML_TAG_REGEX, '')).replace(SPACES_REGEX, ' ').trim();
    if (t) return t;
  }

  const h1Match = cleanHtml.match(H1_TAG_REGEX);
  if (h1Match) {
    const t = decodeEntities(h1Match[1].replace(HTML_TAG_REGEX, '')).replace(SPACES_REGEX, ' ').trim();
    if (t) return t;
  }

  const stem = path.basename(filepath, ext);
  return stem.replace(DASH_UNDERSCORE_REGEX, ' ').trim();
}

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
      } else if (ALLOWED_EXT_REGEX.test(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  walk(rootDir);
  return results;
}

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
