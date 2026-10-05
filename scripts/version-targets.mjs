import { packageVersion, npmLockVersion } from './version-control.mjs';

export default {
  targets: [
    { path: 'indexer/package.json', transform: packageVersion },
    { path: 'indexer/package-lock.json', transform: npmLockVersion },
    { path: 'dashboard/version.js', generated: true, transform: (_, version) => `window.NEXPORTA_VERSION = '${version}';\n` },
  ],
};
