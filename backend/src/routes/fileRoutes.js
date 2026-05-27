// File-upload routes for the Profirmo backend (Phase 4), mounted at
// /api/files. /upload uses optional auth so the signup wizard can upload
// profile photos + documents BEFORE the user has finished registering;
// list / get / delete still require authentication so users can only
// see / mutate their own uploads.

const express = require('express');
const fileController = require('../controllers/fileController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const {
  uploadSingle,
  handleUploadErrors,
} = require('../middleware/uploadMiddleware');

const router = express.Router();

// POST /api/files/upload — single file upload. Optional auth: anonymous
// callers (signup wizard before Step 1 register) get a row with
// userId = null; authenticated callers get the row attributed to them.
router.post(
  '/upload',
  optionalAuth,
  uploadSingle,
  handleUploadErrors,
  fileController.uploadFile
);

// All remaining routes are owner-only.
router.use(authenticate);

// GET /api/files — list the caller's uploads.
router.get('/', fileController.listFiles);

// GET /api/files/:id — single upload metadata.
router.get('/:id', fileController.getFile);

// DELETE /api/files/:id — owner-only delete (row + file on disk).
router.delete('/:id', fileController.deleteFile);

module.exports = router;
