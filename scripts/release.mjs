import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(repoRoot, 'VERSION');
const SYNC_SCRIPT = path.join(repoRoot, 'scripts', 'sync-version.mjs');

const CALVER_REGEX = /^(\d{4})\.(\d{1,2})\.(\d+)$/;

function parseCalVer(version) {
  const match = version.match(CALVER_REGEX);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    increment: Number(match[3])
  };
}

function readCurrentVersion() {
  if (!fs.existsSync(VERSION_FILE)) return null;
  const current = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  const parsed = parseCalVer(current);
  if (!parsed) {
    throw new Error(`Invalid CalVer in VERSION: "${current}". Expected YYYY.M.N`);
  }
  return parsed;
}

function nextCalVer() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const current = readCurrentVersion();

  if (current && current.year === year && current.month === month) {
    return `${year}.${month}.${current.increment + 1}`;
  }

  return `${year}.${month}.1`;
}

function writeVersion(version) {
  fs.writeFileSync(VERSION_FILE, `${version}\n`);
}

function runSync() {
  const result = spawnSync(process.execPath, [SYNC_SCRIPT], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const version = nextCalVer();
writeVersion(version);
runSync();
console.log(`Released ${version}`);
