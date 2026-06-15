import fs from 'node:fs';
import path from 'node:path';

// Hoisted RegExp definitions for performance optimization (js-hoist-regexp)
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

// Helper to decode HTML entities hoisted to module level (js-hoist-regexp)
function decodeEntities(str) {
  // Early return if the string does not contain an ampersand (js-early-exit)
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
  let html;
  try {
    html = fs.readFileSync(filepath, 'utf8');
  } catch {
    const stem = path.basename(filepath, path.extname(filepath));
    return stem.replace(DASH_UNDERSCORE_REGEX, ' ').trim();
  }

  // Strip HTML comments to avoid matching commented-out tags
  const cleanHtml = html.replace(HTML_COMMENT_REGEX, '');

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

  const stem = path.basename(filepath, path.extname(filepath));
  return stem.replace(DASH_UNDERSCORE_REGEX, ' ').trim();
}

