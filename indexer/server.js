import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Allowed file extensions (case-insensitive)
const ALLOWED_EXT_REGEX = /\.(html|htm|md|markdown)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Password protection setup
let apiPassword = process.env.API_PASSWORD;
if (!apiPassword) {
  apiPassword = crypto.randomBytes(16).toString('hex');
  console.warn(`[nexporta-api] WARNING: API_PASSWORD environment variable is not set! Generating a secure random ephemeral password: ${apiPassword}`);
}

function verifyPassword(reqPassword) {
  if (!reqPassword) return false;
  const hashConfig = crypto.createHash('sha256').update(apiPassword).digest();
  const hashReq = crypto.createHash('sha256').update(reqPassword).digest();
  return crypto.timingSafeEqual(hashConfig, hashReq);
}

function sendJson(res, statusCode, data) {
  if (res.headersSent) return;
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

export function createApiServer(contentDir) {
  const resolvedContentDir = path.resolve(contentDir);

  function getSafeFolderPath(subfolder) {
    if (!subfolder) {
      return resolvedContentDir;
    }

    // Single-level directory check: no slashes, backslashes, or relative path dots
    if (subfolder.includes('/') || subfolder.includes('\\') || subfolder.includes('..') || subfolder === '.' || subfolder === '') {
      throw new Error('Invalid folder name: Only single-level directories are supported.');
    }

    const resolvedPath = path.resolve(path.join(resolvedContentDir, subfolder));

    // Ensure path resolves inside the content directory and has trailing separator to prevent partial matching bypasses
    if (!resolvedPath.startsWith(resolvedContentDir + path.sep)) {
      throw new Error('Directory traversal detected.');
    }

    return resolvedPath;
  }

  function getSafeFilePath(subfolder, filename) {
    const folderPath = getSafeFolderPath(subfolder);

    if (!filename) {
      throw new Error('Filename is required.');
    }

    // Filename must be plain name: no path separators or relative references
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new Error('Invalid filename.');
    }

    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      throw new Error('Invalid filename structure.');
    }

    // Check allowed extension
    if (!ALLOWED_EXT_REGEX.test(sanitizedFilename)) {
      throw new Error('Forbidden file type: Only HTML (.html, .htm) and Markdown (.md, .markdown) files are allowed.');
    }

    const resolvedPath = path.resolve(path.join(folderPath, sanitizedFilename));

    // Verify prefix
    const expectedPrefix = folderPath === resolvedContentDir ? resolvedContentDir + path.sep : folderPath + path.sep;
    if (!resolvedPath.startsWith(expectedPrefix)) {
      throw new Error('Path traversal detected.');
    }

    return resolvedPath;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const method = req.method;

      console.log(`[nexporta-api] ${method} ${url.pathname}`);

      // CORS headers
      const allowedCorsOrigin = process.env.ALLOWED_CORS_ORIGIN || '*';
      if (allowedCorsOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedCorsOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename, x-folder, x-password, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle OPTIONS preflight requests
      if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');

      // Route: GET /api/config
      if (url.pathname === '/api/config' && method === 'GET') {
        const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
        return sendJson(res, 200, {
          sessionTimeoutMinutes: isNaN(sessionTimeout) ? 30 : sessionTimeout
        });
      }

      // Route: POST /api/directory
      if (url.pathname === '/api/directory' && method === 'POST') {
        try {
          const reqPassword = req.headers['x-password'];
          if (!verifyPassword(reqPassword)) {
            return sendJson(res, 401, { success: false, error: 'Unauthorized: Invalid password.' });
          }

          const body = await getJsonBody(req);
          const folder = body.folder;

          if (!folder) {
            return sendJson(res, 400, { success: false, error: 'Folder name is required' });
          }

          let targetDir;
          try {
            targetDir = getSafeFolderPath(folder);
          } catch (err) {
            return sendJson(res, 400, { success: false, error: err.message });
          }

          // Create directory
          await fs.promises.mkdir(targetDir, { recursive: true });
          return sendJson(res, 200, { success: true });
        } catch (err) {
          return sendJson(res, 400, { success: false, error: err.message });
        }
      }

      // Route: POST /api/upload
      if (url.pathname === '/api/upload' && method === 'POST') {
        try {
          const reqPassword = req.headers['x-password'];
          if (!verifyPassword(reqPassword)) {
            return sendJson(res, 401, { success: false, error: 'Unauthorized: Invalid password.' });
          }

          const filename = req.headers['x-filename'];
          const folder = req.headers['x-folder'] || '';

          if (!filename) {
            return sendJson(res, 400, { success: false, error: 'x-filename header is required' });
          }

          let targetFilePath;
          let targetFolderPath;
          try {
            targetFolderPath = getSafeFolderPath(folder);
            targetFilePath = getSafeFilePath(folder, filename);
          } catch (err) {
            return sendJson(res, 400, { success: false, error: err.message });
          }

          // Verify folder exists
          if (!fs.existsSync(targetFolderPath)) {
            return sendJson(res, 400, { success: false, error: 'Target directory does not exist. Create it first.' });
          }

          // TODO(security): Preserve original sanitized filenames rather than using random UUIDs
          // because document identity and browser navigation URLs map directly to file paths.
          // Prevent file overwrite: check if file already exists
          const fileExists = await fs.promises.access(targetFilePath)
            .then(() => true)
            .catch(() => false);

          if (fileExists) {
            return sendJson(res, 409, { success: false, error: 'File already exists.' });
          }

          // Size check via header
          const contentLength = parseInt(req.headers['content-length'], 10);
          if (!isNaN(contentLength) && contentLength > MAX_FILE_SIZE) {
            return sendJson(res, 413, { success: false, error: 'File too large. Max size is 5MB.' });
          }

          // Stream body to file
          const writeStream = fs.createWriteStream(targetFilePath);
          let bytesReceived = 0;
          let limitExceeded = false;

          return new Promise((resolve) => {
            const handleLimitExceeded = () => {
              res.writeHead(413, {
                'Connection': 'close',
                'Content-Type': 'application/json'
              });
              res.end(JSON.stringify({ success: false, error: 'File too large. Max size is 5MB.' }), () => {
                req.destroy();
              });
              resolve();
            };

            req.on('data', chunk => {
              bytesReceived += chunk.length;
              if (bytesReceived > MAX_FILE_SIZE && !limitExceeded) {
                limitExceeded = true;
                req.unpipe(writeStream);
                writeStream.destroy();
                fs.unlink(targetFilePath, () => {
                  handleLimitExceeded();
                });
              }
            });

            req.pipe(writeStream);

            writeStream.on('finish', () => {
              if (!limitExceeded) {
                const rel = path.relative(resolvedContentDir, targetFilePath);
                const pathUrl = '/content/' + rel.split(/[\\/]/).map(encodeURIComponent).join('/');
                sendJson(res, 200, { success: true, path: pathUrl });
                resolve();
              }
            });

            writeStream.on('error', err => {
              if (!limitExceeded) {
                console.error(`[nexporta-api] write stream error: ${err.message}`);
                // Delete incomplete file
                fs.unlink(targetFilePath, () => {
                  sendJson(res, 500, { success: false, error: 'Failed to write file' });
                  resolve();
                });
              }
            });
          });

        } catch (err) {
          return sendJson(res, 500, { success: false, error: err.message });
        }
      }

      // Default route
      return sendJson(res, 404, { error: 'Not Found' });
    } catch (err) {
      console.error(`[nexporta-api] request handler error: ${err.message}`);
      return sendJson(res, 500, { success: false, error: 'Internal Server Error' });
    }
  });

  return server;
}
