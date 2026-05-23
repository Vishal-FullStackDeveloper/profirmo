// Notification service — wraps the /api/notifications endpoints.
// Every call returns the parsed `data` payload from the API envelope
// `{ success, message, data }`. The access token is attached automatically
// by api.js, so callers never pass tokens here.

import { get, patch } from '@/services/api';

/** Unwrap the API envelope and return its `data` payload. */
function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }
  return response;
}

/**
 * List notifications, newest first.
 * @param {{page?:number, limit?:number}} [opts]
 * @returns {Promise<Array>} array of notification objects
 */
export async function listNotifications({ page = 1, limit = 20 } = {}) {
  const res = await get('/api/notifications', { params: { page, limit } });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

/**
 * Get the count of unread notifications.
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const res = await get('/api/notifications/unread-count');
  const data = unwrap(res);
  return (data && Number(data.count)) || 0;
}

/**
 * Mark a single notification as read.
 * @param {string} id - notification id
 * @returns {Promise<Object>}
 */
export async function markRead(id) {
  const res = await patch(`/api/notifications/${id}/read`);
  return unwrap(res);
}

/**
 * Mark every notification as read.
 * @returns {Promise<Object>}
 */
export async function markAllRead() {
  const res = await patch('/api/notifications/read-all');
  return unwrap(res);
}

export default {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
