// Professional service — wraps the /api/professionals endpoints.

import { get, patch, post } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';

const BASE = API_ENDPOINTS.professionals;

/** Unwrap the API envelope and return its `data` payload. */
function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }
  return response;
}

/**
 * Resubmit a professional's application after a REJECTED / INFO_REQUESTED
 * decision. Hits POST /api/professionals/resubmit (auth, role professional).
 * Body uses the same `professional` / `legal` / `tax` detail shapes as
 * registration. Resets the approval status back to PENDING_APPROVAL.
 * @param {Object} payload - { professional, legal?, tax? }
 * @returns {Promise<Object>}
 */
export async function resubmitProfessional(payload) {
  const res = await post('/api/professionals/resubmit', payload);
  return unwrap(res);
}

/**
 * List professionals, optionally filtered/sorted via query params.
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

/** Fetch a single professional by id — returns the unwrapped detail object. */
export async function getById(id) {
  const res = await get(`${BASE}/${id}`);
  return unwrap(res);
}

/**
 * Fetch the distinct filter values (cities, professionalTypes,
 * specializations, languages) drawn from live data.
 */
export async function getFilterOptions() {
  const res = await get(`${BASE}/filter-options`);
  return (
    unwrap(res) || {
      professionalTypes: [],
      cities: [],
      specializations: [],
      languages: [],
    }
  );
}

/** Search professionals by a free-text query string — returns `{ data, meta }`. */
export function search(query) {
  return getAll({ search: query });
}

/** Fetch reviews for a professional. */
export function getReviews(id) {
  return get(`${BASE}/${id}/reviews`);
}

/** Fetch availability slots for a professional. */
export function getAvailability(id) {
  return get(`${BASE}/${id}/availability`);
}

/** Update a professional's `availableNow` toggle (auth required). */
export function updateAvailability(id, value, token) {
  return patch(`${BASE}/${id}/availability`, { availableNow: value }, { token });
}

/** Update a professional's per-minute rate (auth required). */
export function updateRate(id, value, token) {
  return patch(`${BASE}/${id}/rate`, { perMinuteRate: value }, { token });
}

export default {
  getAll,
  getById,
  getFilterOptions,
  search,
  getReviews,
  getAvailability,
  updateAvailability,
  updateRate,
  resubmitProfessional,
};
