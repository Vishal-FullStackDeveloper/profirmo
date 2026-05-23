// File service for the Profirmo backend (Phase 4).
//
// Database logic behind the /api/files endpoints: recording uploaded files
// in the `uploads` table, listing a user's uploads, fetching a single
// upload, and deleting an upload (owner-scoped — removes both the database
// row and the file on local disk).

const fs = require('fs');
const path = require('path');
const { Upload } = require('../models');
const env = require('../config/env');

/**
 * Insert an `uploads` row from a multer file object.
 * @param {object} params
 * @param {string} params.userId - owning user id
 * @param {string} params.category - logical category bucket
 * @param {object} params.file - multer file object (already saved to disk)
 * @returns {Promise<object>} the created Upload record
 */
const createUpload = async ({ userId, category, file }) => {
  const upload = await Upload.create({
    userId,
    category,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/${file.filename}`,
  });
  return upload;
};

/**
 * Fetch a single upload by id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getUploadById = async (id) => {
  return Upload.findByPk(id);
};

/**
 * List all uploads owned by a user, newest first.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
const listUserUploads = async (userId) => {
  return Upload.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Delete an upload owned by the given user. Removes the database row and
 * unlinks the file from local disk.
 * @param {string} id - upload id
 * @param {string} userId - id of the user requesting the delete
 * @returns {Promise<boolean>} true if deleted; false if not found / not owner
 */
const deleteUpload = async (id, userId) => {
  const upload = await Upload.findByPk(id);
  if (!upload || upload.userId !== userId) {
    return false;
  }

  // Remove the file from disk. The stored name is a server-generated UUID,
  // so this path is always inside the uploads directory.
  const diskPath = path.join(env.uploadsDir, upload.storedName);
  try {
    await fs.promises.unlink(diskPath);
  } catch (err) {
    // A missing file should not block removal of the orphaned DB row.
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  await upload.destroy();
  return true;
};

module.exports = {
  createUpload,
  getUploadById,
  listUserUploads,
  deleteUpload,
};
