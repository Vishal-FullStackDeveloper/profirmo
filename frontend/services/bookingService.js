// Booking service — wraps the /api/bookings endpoints.

import { get, post, patch } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';

const BASE = API_ENDPOINTS.bookings;

function unwrap(res) {
  if (res && Object.prototype.hasOwnProperty.call(res, 'data')) {
    return res.data;
  }
  return res;
}

/** List bookings, optionally filtered via query params. */
export function getAll(params = {}) {
  return get(BASE, { params });
}

/** Fetch a single booking by id. */
export async function getById(id) {
  const res = await get(`${BASE}/${id}`);
  return unwrap(res);
}

/** Create a new booking. clientId is auto-filled from the authenticated user. */
export async function createBooking(data) {
  const res = await post(BASE, data);
  return unwrap(res);
}

/** Bookings the caller made as a client. */
export async function getMyBookings() {
  const res = await get(`${BASE}/mine`);
  return unwrap(res) || [];
}

/** Bookings assigned to the caller as a professional. */
export async function getMyAssignedBookings() {
  const res = await get(`${BASE}/mine-as-professional`);
  return unwrap(res) || [];
}

/** Update the status of a booking. */
export async function updateStatus(id, status) {
  const res = await patch(`${BASE}/${id}/status`, { status });
  return unwrap(res);
}

/** Fetch all bookings for a given client. */
export function getByClient(clientId) {
  return get(`${BASE}/client/${clientId}`);
}

/** Fetch all bookings for a given professional. */
export function getByProfessional(professionalId) {
  return get(`${BASE}/professional/${professionalId}`);
}

/** Booking detail payload: booking + professional + notes + review. */
export async function getDetail(id) {
  const res = await get(`${BASE}/${id}/detail`);
  return unwrap(res);
}

/**
 * Append a note/message to the booking. Accepts either:
 *   addNote(id, "free text")
 * or
 *   addNote(id, { body, attachments })
 */
export async function addNote(id, payload) {
  const body =
    typeof payload === 'string'
      ? { body: payload, attachments: [] }
      : {
          body: (payload && payload.body) || '',
          attachments: (payload && payload.attachments) || [],
        };
  const res = await post(`${BASE}/${id}/notes`, body);
  return unwrap(res);
}

/** Pro-only: convert the booking into a case carrying the notes over. */
export async function convertToCase(id, payload = {}) {
  const res = await post(`${BASE}/${id}/convert-to-case`, payload);
  return unwrap(res);
}

export default {
  getAll,
  getById,
  createBooking,
  getMyBookings,
  getMyAssignedBookings,
  updateStatus,
  getByClient,
  getByProfessional,
  getDetail,
  addNote,
  convertToCase,
};
