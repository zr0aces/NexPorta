import fs from 'node:fs';
import path from 'node:path';

export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TraversalError extends StorageError {}
export class InvalidFolderError extends StorageError {}
export class InvalidFilenameError extends StorageError {}
export class InvalidExtensionError extends StorageError {}
export class FileExistsError extends StorageError {}
export class FileTooLargeError extends StorageError {}

const ALLOWED_EXT_REGEX = /\.(html|htm|md|markdown)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class ContentStorage {
  constructor(contentDir) {
    if (!contentDir) {
      throw new Error('contentDir is required');
    }
    this.resolvedContentDir = path.resolve(contentDir);
  }

  getSafeFolderPath(subfolder) {
    if (!subfolder) {
      return this.resolvedContentDir;
    }

    if (subfolder.includes('/') || subfolder.includes('\\') || subfolder.includes('..') || subfolder === '.' || subfolder === '') {
      throw new InvalidFolderError('Invalid folder name: Only single-level directories are supported.');
    }

    const resolvedPath = path.resolve(path.join(this.resolvedContentDir, subfolder));

    if (!resolvedPath.startsWith(this.resolvedContentDir + path.sep)) {
      throw new TraversalError('Directory traversal detected.');
    }

    return resolvedPath;
  }

  getSafeFilePath(subfolder, filename) {
    const folderPath = this.getSafeFolderPath(subfolder);

    if (!filename) {
      throw new InvalidFilenameError('Filename is required.');
    }

    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new InvalidFilenameError('Invalid filename.');
    }

    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      throw new InvalidFilenameError('Invalid filename structure.');
    }

    if (!ALLOWED_EXT_REGEX.test(sanitizedFilename)) {
      throw new InvalidExtensionError('Forbidden file type: Only HTML (.html, .htm) and Markdown (.md, .markdown) files are allowed.');
    }

    const resolvedPath = path.resolve(path.join(folderPath, sanitizedFilename));

    const expectedPrefix = folderPath === this.resolvedContentDir ? this.resolvedContentDir + path.sep : folderPath + path.sep;
    if (!resolvedPath.startsWith(expectedPrefix)) {
      throw new TraversalError('Path traversal detected.');
    }

    return resolvedPath;
  }

  async createDirectory(folderName) {
    const targetDir = this.getSafeFolderPath(folderName);
    await fs.promises.mkdir(targetDir, { recursive: true });
    return targetDir;
  }

  async saveFile(folderName, filename, readStream, contentLength) {
    const folderPath = this.getSafeFolderPath(folderName);
    const targetFilePath = this.getSafeFilePath(folderName, filename);

    if (!fs.existsSync(folderPath)) {
      throw new InvalidFolderError('Target directory does not exist. Create it first.');
    }

    const fileExists = await fs.promises.access(targetFilePath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      throw new FileExistsError('File already exists.');
    }

    if (contentLength !== undefined && !isNaN(contentLength) && contentLength > MAX_FILE_SIZE) {
      throw new FileTooLargeError('File too large. Max size is 5MB.');
    }

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(targetFilePath);
      let bytesReceived = 0;
      let limitExceeded = false;

      const cleanUpAndReject = (error) => {
        writeStream.destroy();
        fs.unlink(targetFilePath, () => {
          reject(error);
        });
      };

      readStream.on('data', chunk => {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_FILE_SIZE && !limitExceeded) {
          limitExceeded = true;
          readStream.unpipe(writeStream);
          cleanUpAndReject(new FileTooLargeError('File too large. Max size is 5MB.'));
        }
      });

      readStream.pipe(writeStream);

      writeStream.on('finish', () => {
        if (!limitExceeded) {
          const rel = path.relative(this.resolvedContentDir, targetFilePath);
          const pathUrl = '/content/' + rel.split(/[\\/]/).map(encodeURIComponent).join('/');
          resolve(pathUrl);
        }
      });

      writeStream.on('error', err => {
        if (!limitExceeded) {
          cleanUpAndReject(err);
        }
      });
    });
  }
}
