// File controller for the Profirmo backend (Phase 4).
//
// Thin, asyncHandler-wrapped handlers for the /api/files endpoints. The
// heavy lifting (multer disk storage, MIME whitelist, size limit) happens
// in the upload middleware; the database logic lives in fileService.

const fs = require('fs');
const fileService = require('../services/fileService');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  errorResponse,
} = require('../utils/responseHandler');

// Known upload categories. `category` defaults to 'other' when omitted.
const CATEGORIES = [
  'profile_photo',
  'cover_photo',
  'resume',
  'license_document',
  'identity_document',
  'certification',
  'firm_logo',
  'firm_registration',
  'business_license',
  'tax_document',
  'other',
];

// Categories that must be an image (no PDFs).
const IMAGE_ONLY_CATEGORIES = [
  'profile_photo',
  'cover_photo',
  'firm_logo',
];

// Project an Upload record down to the public response shape.
const toPublicUpload = (u) => ({
  id: u.id,
  url: u.url,
  originalName: u.originalName,
  mimeType: u.mimeType,
  size: u.size,
  category: u.category,
  createdAt: u.createdAt,
});

// Best-effort removal of a just-saved file when validation fails after
// multer has already written it to disk.
const cleanupTempFile = (file) => {
  if (file && file.path) {
    fs.promises.unlink(file.path).catch(() => {});
  }
};

// POST /api/files/upload — store one file and record it.
const uploadFile = asyncHandler(async (req, res) => {
  const { file } = req;
  if (!file) {
    return errorResponse(res, 400, 'No file provided. Use the "file" field.');
  }

  const category = (req.body.category || 'other').trim() || 'other';

  if (!CATEGORIES.includes(category)) {
    cleanupTempFile(file);
    return errorResponse(
      res,
      400,
      `Invalid category. Allowed: ${CATEGORIES.join(', ')}.`
    );
  }

  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  // Photo/logo categories must be images; document categories accept
  // images or PDFs.
  if (IMAGE_ONLY_CATEGORIES.includes(category) && !isImage) {
    cleanupTempFile(file);
    return errorResponse(
      res,
      400,
      `Category "${category}" requires an image file.`
    );
  }
  if (!isImage && !isPdf) {
    cleanupTempFile(file);
    return errorResponse(
      res,
      400,
      'Unsupported file type for this category.'
    );
  }

  const upload = await fileService.createUpload({
    userId: req.user.id,
    category,
    file,
  });

  return successResponse(
    res,
    201,
    'File uploaded',
    toPublicUpload(upload)
  );
});

// GET /api/files — list the caller's uploads.
const listFiles = asyncHandler(async (req, res) => {
  const uploads = await fileService.listUserUploads(req.user.id);
  return successResponse(
    res,
    200,
    'Uploads fetched',
    uploads.map(toPublicUpload)
  );
});

// GET /api/files/:id — single upload metadata.
const getFile = asyncHandler(async (req, res) => {
  const upload = await fileService.getUploadById(req.params.id);
  if (!upload) {
    return errorResponse(res, 404, 'Upload not found');
  }
  return successResponse(
    res,
    200,
    'Upload fetched',
    toPublicUpload(upload)
  );
});

// DELETE /api/files/:id — owner-scoped delete (row + file on disk).
const deleteFile = asyncHandler(async (req, res) => {
  const deleted = await fileService.deleteUpload(
    req.params.id,
    req.user.id
  );
  if (!deleted) {
    return errorResponse(res, 404, 'Upload not found');
  }
  return successResponse(res, 200, 'Upload deleted', { id: req.params.id });
});

module.exports = {
  uploadFile,
  listFiles,
  getFile,
  deleteFile,
};
