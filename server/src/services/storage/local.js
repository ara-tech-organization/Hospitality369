const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const root = env.storage.localDir;

/** Resolve a storage key safely inside the storage root (prevents path traversal) */
function resolveKey(key) {
  const full = path.resolve(root, key);
  if (!full.startsWith(path.resolve(root) + path.sep)) throw ApiError.badRequest('Invalid file key');
  return full;
}

module.exports = {
  async save(key, buffer) {
    const full = resolveKey(key);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, buffer, { mode: 0o600 });
  },
  async stream(key) {
    const full = resolveKey(key);
    try {
      await fsp.access(full);
    } catch {
      throw ApiError.notFound('Resume file not found in storage');
    }
    return fs.createReadStream(full);
  },
  async remove(key) {
    await fsp.unlink(resolveKey(key));
  },
};
