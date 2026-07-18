import http from 'node:http';
import { DocumentAuthenticator } from './authenticator.js';
import {
  ContentStorage,
  TraversalError,
  InvalidFolderError,
  InvalidFilenameError,
  InvalidExtensionError,
  FileExistsError,
  FileTooLargeError
} from './storage.js';

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
  const authenticator = new DocumentAuthenticator(process.env.API_PASSWORD);
  const storage = new ContentStorage(contentDir);

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
          if (!authenticator.verify(reqPassword)) {
            return sendJson(res, 401, { success: false, error: 'Unauthorized: Invalid password.' });
          }

          const body = await getJsonBody(req);
          const folder = body.folder;

          if (!folder) {
            return sendJson(res, 400, { success: false, error: 'Folder name is required' });
          }

          await storage.createDirectory(folder);
          return sendJson(res, 200, { success: true });
        } catch (err) {
          const statusCode = (err instanceof TraversalError || err instanceof InvalidFolderError) ? 400 : 500;
          return sendJson(res, statusCode, { success: false, error: err.message });
        }
      }

      // Route: POST /api/upload
      if (url.pathname === '/api/upload' && method === 'POST') {
        try {
          const reqPassword = req.headers['x-password'];
          if (!authenticator.verify(reqPassword)) {
            return sendJson(res, 401, { success: false, error: 'Unauthorized: Invalid password.' });
          }

          const filename = req.headers['x-filename'];
          const folder = req.headers['x-folder'] || '';

          if (!filename) {
            return sendJson(res, 400, { success: false, error: 'x-filename header is required' });
          }

          const contentLength = parseInt(req.headers['content-length'], 10);

          try {
            const pathUrl = await storage.saveFile(folder, filename, req, contentLength);
            return sendJson(res, 200, { success: true, path: pathUrl });
          } catch (err) {
            let statusCode = 400;
            if (err instanceof FileExistsError) {
              statusCode = 409;
            } else if (err instanceof FileTooLargeError) {
              statusCode = 413;
              res.writeHead(413, {
                'Connection': 'close',
                'Content-Type': 'application/json'
              });
              res.end(JSON.stringify({ success: false, error: err.message }));
              return;
            } else if (err instanceof TraversalError || err instanceof InvalidFolderError || err instanceof InvalidFilenameError || err instanceof InvalidExtensionError) {
              statusCode = 400;
            } else {
              statusCode = 500;
            }
            return sendJson(res, statusCode, { success: false, error: err.message });
          }
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
