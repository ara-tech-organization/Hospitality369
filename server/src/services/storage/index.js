/**
 * Pluggable private file storage for resumes.
 *  - local: files kept in a non-public folder on disk; only streamed through the
 *           permission-checked download endpoint.
 *  - s3:    private S3 bucket (server-side encryption), streamed the same way.
 *
 * Each driver implements: save(buffer, { ext, mimeType }) -> key, stream(key) -> Readable, remove(key)
 */
const crypto = require('crypto');
const env = require('../../config/env');

const drivers = {
  local: () => require('./local'),
  s3: () => require('./s3'),
};

let cached;
function driver() {
  if (!cached) {
    const factory = drivers[env.storage.driver];
    if (!factory) throw new Error(`Unknown STORAGE_DRIVER "${env.storage.driver}"`);
    cached = factory();
  }
  return cached;
}

const newKey = (ext) => {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}${ext}`;
};

module.exports = {
  name: () => env.storage.driver,
  async save(buffer, { ext, mimeType }) {
    const key = newKey(ext);
    await driver().save(key, buffer, mimeType);
    return key;
  },
  stream: (key) => driver().stream(key),
  remove: (key) => driver().remove(key).catch(() => {}),
};
