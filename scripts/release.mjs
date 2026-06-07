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

function printHelp() {
  console.log(`Usage:
  node scripts/release.mjs
  node scripts/release.mjs --version <YYYY.M.N>
  node scripts/release.mjs <YYYY.M.N>
  node scripts/release.mjs --help

Description:
  - Without arguments: bumps to the next monthly CalVer and syncs versioned files.
  - With --version or positional version: sets VERSION manually, then syncs files.

Examples:
  node scripts/release.mjs
  node scripts/release.mjs --version 2026.6.3
  node scripts/release.mjs 2026.6.3`);
}

function parseCalVer(version) {
  const match = version.match(CALVER_REGEX);
  if (!match) return null;

  const month = Number(match[2]);
  const increment = Number(match[3]);
  if (month < 1 || month > 12 || increment < 1) return null;

  return {
    year: Number(match[1]),
    month,
    increment
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

function resolveTargetVersion(argv) {
  if (argv.length === 0) {
    return nextCalVer();
  }

  if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) {
    printHelp();
    process.exit(0);
  }

  if (argv.length === 1) {
    const positionalVersion = argv[0];
    if (!parseCalVer(positionalVersion)) {
      console.error(
        `Invalid version "${positionalVersion}". Expected YYYY.M.N with month 1-12 and N >= 1.`
      );
      process.exit(1);
    }
    return positionalVersion;
  }

  if (argv.length === 2 && (argv[0] === '--version' || argv[0] === '-v')) {
    const explicitVersion = argv[1];
    if (!parseCalVer(explicitVersion)) {
      console.error(
        `Invalid version "${explicitVersion}". Expected YYYY.M.N with month 1-12 and N >= 1.`
      );
      process.exit(1);
    }
    return explicitVersion;
  }

  console.error('Invalid arguments. Use --help for usage.');
  process.exit(1);
}

const version = resolveTargetVersion(process.argv.slice(2));
writeVersion(version);
runSync();
console.log(`Released ${version}`);
console.log('Suggested next steps:');
console.log('  git add -A');
console.log(`  git commit -m "release: v${version}"`);
console.log(`  git tag -a "v${version}" -m "Release v${version}"`);
console.log('  git push origin main --tags');
