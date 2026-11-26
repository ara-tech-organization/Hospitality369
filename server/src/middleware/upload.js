const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword', 'application/octet-stream'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
};

/** Verify actual file content ("magic bytes"), not just the client-supplied extension/MIME */
function sniff(buffer, ext) {
  if (!buffer || buffer.length < 8) return false;
  const hex = buffer.subarray(0, 8).toString('hex');
  if (ext === '.pdf') return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === '.docx') {
    // ZIP container + must contain the Word main document part
    return hex.startsWith('504b0304') && buffer.includes(Buffer.from('word/'));
  }
  if (ext === '.doc') return hex === 'd0cf11e0a1b11ae1'; // OLE2 compound file
  return false;
}

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.storage.maxResumeBytes, files: 1, fields: 20 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED[ext] || !ALLOWED[ext].includes(file.mimetype)) {
      return cb(ApiError.badRequest('Resume must be a PDF, DOC or DOCX file', { field: 'resume' }));
    }
    cb(null, true);
  },
}).single('resume');

/** Wraps multer to convert its errors into friendly API errors and validate content */
function handleResumeUpload(req, res, next) {
  resumeUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest(`Resume must be smaller than ${Math.round(env.storage.maxResumeBytes / 1048576)} MB`, { field: 'resume' }));
        }
        return next(ApiError.badRequest('Invalid upload', { field: 'resume' }));
      }
      return next(err);
    }
    if (!req.file) return next(ApiError.badRequest('Please attach your CV/Resume', { field: 'resume' }));
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!sniff(req.file.buffer, ext)) {
      return next(ApiError.badRequest('The uploaded file appears to be corrupted or is not a genuine PDF/Word document', { field: 'resume' }));
    }
    req.file.ext = ext;
    next();
  });
}

module.exports = { handleResumeUpload, sniff };
