// Upload middleware for the Profirmo backend (Phase 4).
//
// Configures multer for local-disk storage with strict security defaults:
//   - Stored filenames are server-generated UUIDs (the client filename is
//     NEVER used on disk -> no path traversal / overwrite attacks).
//   - A strict MIME-type whitelist rejects everything that is not an image
//     or a PDF.
//   - A hard size limit is enforced by multer.
//
// `uploadSingle` accepts one file under the form field `file`.
// `handleUploadErrors` converts any multer error into a clean 400 JSON
// response so a bad upload never crashes the process.

const multer = require('multer');
const crypto = require('crypto');
const env = require('../config/env');
const { errorResponse } = require('../utils/responseHandler');

// Allowed MIME types -> canonical file extension used for the stored file.
const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  // All files land in the configured uploads directory.
  destination: (req, file, cb) => {
    cb(null, env.uploadsDir);
  },
  // Server-generated unique name + extension derived from the validated
  // MIME type. The client-supplied filename is intentionally ignored.
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

// Reject any file whose MIME type is not on the whitelist.
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(null, true);
  }
  const err = new Error(
    'Unsupported file type. Allowed types: JPEG, PNG, WEBP, GIF, PDF.'
  );
  err.code = 'UNSUPPORTED_FILE_TYPE';
  return cb(err, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadBytes },
});

// Configured single-file handler — expects the form field named `file`.
const uploadSingle = upload.single('file');

/**
 * Express error-handling middleware that turns a multer error (file too
 * large, wrong type, etc.) into a clean 400 JSON response. Mount this
 * immediately after the `uploadSingle` middleware on the upload route.
 */
// eslint-disable-next-line no-unused-vars
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload failed.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = Math.round(env.maxUploadBytes / (1024 * 1024));
      message = `File too large. Maximum allowed size is ${maxMb} MB.`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field. Use the "file" field.';
    }
    return errorResponse(res, 400, message);
  }
  if (err && err.code === 'UNSUPPORTED_FILE_TYPE') {
    return errorResponse(res, 400, err.message);
  }
  if (err) {
    return errorResponse(res, 400, err.message || 'File upload failed.');
  }
  return next();
};

module.exports = {
  uploadSingle,
  handleUploadErrors,
  ALLOWED_MIME_TYPES,
};
