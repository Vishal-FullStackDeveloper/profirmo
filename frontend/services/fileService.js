// fileService — uploads, deletes and resolves file URLs for the Profirmo
// backend file API (POST /api/files/upload, DELETE /api/files/:id).
//
// The backend stores files and returns a RELATIVE url (e.g. /uploads/x.png).
// `resolveFileUrl` turns that into an absolute URL for use in <img>/<iframe>.

import { getApiBaseUrl, getAccessToken, apiRequest } from '@/services/api';

// Allowed MIME types and max size mirror the backend validation.
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** True when the MIME type is an allowed image type. */
export function isImageType(mimeType) {
  return IMAGE_MIME_TYPES.includes(String(mimeType || '').toLowerCase());
}

/** True when the MIME type is a PDF. */
export function isPdfType(mimeType) {
  return String(mimeType || '').toLowerCase() === 'application/pdf';
}

/**
 * Validate a File before uploading.
 * @param {File} file
 * @param {{ imageOnly?: boolean }} [opts]
 * @returns {string|null} an error message, or null when valid.
 */
export function validateFile(file, { imageOnly = false } = {}) {
  if (!file) return 'No file selected.';
  const type = String(file.type || '').toLowerCase();
  const allowed = imageOnly ? IMAGE_MIME_TYPES : ALLOWED_MIME_TYPES;
  if (!allowed.includes(type)) {
    return imageOnly
      ? 'Please choose an image file (JPEG, PNG, WEBP or GIF).'
      : 'Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF or PDF.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. The maximum size is 10 MB.';
  }
  return null;
}

/**
 * Resolve a stored file URL into an absolute URL.
 * - Absolute URLs (starting with http) are returned unchanged.
 * - Relative paths are prefixed with the API base URL.
 * - Empty / null values return ''.
 */
export function resolveFileUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = getApiBaseUrl() || '';
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

/**
 * Upload a single file to the backend.
 * @param {File} file - the file to upload.
 * @param {string} category - the file category (e.g. 'profile_photo').
 * @returns {Promise<{id,url,originalName,mimeType,size,category,createdAt}>}
 */
export async function uploadFile(file, category) {
  if (!file) throw new Error('No file selected.');

  // category appended FIRST, then the file (per the backend contract).
  const formData = new FormData();
  formData.append('category', category || '');
  formData.append('file', file);

  const headers = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // NOTE: do NOT set Content-Type — the browser adds the multipart boundary.

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/files/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });
  } catch (networkError) {
    const err = new Error(
      'Unable to reach the server. Please check your connection.'
    );
    err.isNetworkError = true;
    throw err;
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `Upload failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return (payload && payload.data) || payload || {};
}

/**
 * Delete a previously uploaded file by id.
 * @param {string} id
 * @returns {Promise<{ success:boolean, data?:{ id:string } }>}
 */
export async function deleteFile(id) {
  if (!id) throw new Error('No file id provided.');
  return apiRequest(`/api/files/${id}`, { method: 'DELETE' });
}

/**
 * List the current user's uploaded files.
 * @returns {Promise<Array>}
 */
export async function listFiles() {
  const res = await apiRequest('/api/files', { method: 'GET' });
  return (res && res.data) || [];
}

export default {
  uploadFile,
  deleteFile,
  listFiles,
  resolveFileUrl,
  validateFile,
  isImageType,
  isPdfType,
  ALLOWED_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_FILE_SIZE,
};
