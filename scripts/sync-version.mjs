import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const VERSION_FILE = path.join(repoRoot, 'VERSION');
const INDEXER_PACKAGE_FILE = path.join(repoRoot, 'indexer', 'package.json');
const INDEXER_LOCK_FILE = path.join(repoRoot, 'indexer', 'package-lock.json');
const DASHBOARD_VERSION_FILE = path.join(repoRoot, 'dashboard', 'version.js');

const CALVER_REGEX = /^(\d{4})\.(\d{1,2})\.(\d+)$/;

function readVersion() {
  const version = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  if (!CALVER_REGEX.test(version)) {
    throw new Error(`Invalid CalVer in VERSION: "${version}". Expected YYYY.M.N`);
  }
  return version;
}

function writeJson(filePath, updater) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  updater(json);
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

function syncVersion() {
  const version = readVersion();

  writeJson(INDEXER_PACKAGE_FILE, (json) => {
    json.version = version;
  });

  writeJson(INDEXER_LOCK_FILE, (json) => {
    json.version = version;
    if (json.packages && json.packages['']) {
      json.packages[''].version = version;
    }
  });

  fs.writeFileSync(
    DASHBOARD_VERSION_FILE,
    `window.NEXPORTA_VERSION = '${version}';\n`
  );

  console.log(`Synced version ${version}`);
}

syncVersion();
