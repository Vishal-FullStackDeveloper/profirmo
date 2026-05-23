// Firm service — wraps the /api/firms endpoints (public directory) and the
// /api/law-firm + /api/invitations endpoints (Phase 8 firm management).

import { apiRequest, get, post, del } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';

const BASE = API_ENDPOINTS.firms;

/** Unwrap the API envelope `{ success, message, data }` and return `data`. */
function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }
  return response;
}

/** Coerce an unknown payload shape into an array. */
function toList(value, ...keys) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    for (const key of keys) {
      if (Array.isArray(value[key])) return value[key];
    }
  }
  return [];
}

/**
 * List firms, optionally filtered via query params.
 * Returns the normalised shape `{ data, meta }` where `data` is always an
 * array and `meta` carries pagination info (page, limit, total, totalPages).
 */
export async function getAll(params = {}) {
  const res = await get(BASE, { params });
  return {
    data: Array.isArray(res && res.data) ? res.data : [],
    meta: (res && res.meta) || null,
  };
}

/** Fetch a single firm by id — returns the unwrapped detail object. */
export async function getById(id) {
  const res = await get(`${BASE}/${id}`);
  return unwrap(res);
}

/** Fetch all professionals belonging to a firm. */
export function getProfessionals(id) {
  return get(`${BASE}/${id}/professionals`);
}

/** Fetch all clients associated with a firm. */
export function getClients(id) {
  return get(`${BASE}/${id}/clients`);
}

/** Fetch all cases associated with a firm. */
export function getCases(id) {
  return get(`${BASE}/${id}/cases`);
}

/** Add a professional to a firm (auth required). */
export function addProfessional(id, data, token) {
  return post(`${BASE}/${id}/professionals`, data, { token });
}

// ---------------------------------------------------------------------------
// Phase 8 — firm management + invitations.
// Every call below returns the parsed `data` payload from the API envelope.
// The access token is attached automatically by api.js.
// ---------------------------------------------------------------------------

/**
 * Fetch the firm the current user belongs to (owns or is a member of).
 * @returns {Promise<{lawFirm:Object|null, members:Array, myRole:string|null,
 *                     approval:Object|null}>}
 */
export async function getMyFirm() {
  const res = await get('/api/law-firm/mine');
  const data = unwrap(res) || {};
  return {
    lawFirm: data.lawFirm || null,
    members: toList(data.members, 'members'),
    myRole: data.myRole || null,
    approval: data.approval || null,
  };
}

/** Create a new law firm (approved professionals only). */
export async function createFirm(data) {
  const res = await post('/api/law-firm', data);
  return unwrap(res);
}

/** Update the current user's law firm (owner / co-owner). */
export async function updateFirm(data) {
  const res = await apiRequest('/api/law-firm/mine', {
    method: 'PUT',
    body: data,
  });
  return unwrap(res);
}

/** Change a firm member's role (owner only). */
export async function updateMemberRole(memberId, role) {
  const res = await apiRequest(
    `/api/law-firm/mine/members/${memberId}/role`,
    { method: 'PATCH', body: { role } }
  );
  return unwrap(res);
}

/** Remove a firm member (owner / co-owner). */
export async function removeMember(memberId) {
  const res = await del(`/api/law-firm/mine/members/${memberId}`);
  return unwrap(res);
}

/** Search approved professionals to invite. */
export async function searchProfessionals(q) {
  const res = await get('/api/law-firm/search-professionals', {
    params: { q },
  });
  const data = unwrap(res);
  return toList(data, 'professionals', 'results');
}

/** Send a firm invitation (owner / co-owner). */
export async function sendInvitation({ email, role }) {
  const res = await post('/api/law-firm/mine/invitations', { email, role });
  return unwrap(res);
}

/** List invitations the firm has sent. */
export async function listSentInvitations() {
  const res = await get('/api/law-firm/mine/invitations');
  const data = unwrap(res);
  return toList(data, 'invitations');
}

/** Cancel a pending sent invitation (owner / co-owner). */
export async function cancelInvitation(id) {
  const res = await del(`/api/law-firm/mine/invitations/${id}`);
  return unwrap(res);
}

/** List invitations the current user has received (pending). */
export async function getMyInvitations() {
  const res = await get('/api/invitations/mine');
  const data = unwrap(res);
  return toList(data, 'invitations');
}

/** Accept a received invitation. */
export async function acceptInvitation(id) {
  const res = await post(`/api/invitations/${id}/accept`);
  return unwrap(res);
}

/** Reject a received invitation. */
export async function rejectInvitation(id) {
  const res = await post(`/api/invitations/${id}/reject`);
  return unwrap(res);
}

export default {
  getAll,
  getById,
  getProfessionals,
  getClients,
  getCases,
  addProfessional,
  // Phase 8
  getMyFirm,
  createFirm,
  updateFirm,
  updateMemberRole,
  removeMember,
  searchProfessionals,
  sendInvitation,
  listSentInvitations,
  cancelInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
};
