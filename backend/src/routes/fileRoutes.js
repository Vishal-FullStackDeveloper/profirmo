// File-upload routes for the Profirmo backend (Phase 4), mounted at
// /api/files. Every route requires an authenticated user.

const express = require('express');
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  uploadSingle,
  handleUploadErrors,
} = require('../middleware/uploadMiddleware');

const router = express.Router();

// All file routes require an authenticated user.
router.use(authenticate);

// POST /api/files/upload — upload a single file ("file" form field).
// `handleUploadErrors` converts multer errors into clean 400 responses.
router.post(
  '/upload',
  uploadSingle,
  handleUploadErrors,
  fileController.uploadFile
);

// GET /api/files — list the caller's uploads.
router.get('/', fileController.listFiles);

// GET /api/files/:id — single upload metadata.
router.get('/:id', fileController.getFile);

// DELETE /api/files/:id — owner-only delete (row + file on disk).
router.delete('/:id', fileController.deleteFile);

module.exports = router;
