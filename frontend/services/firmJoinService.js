// firmJoinService — wraps the /api/firm-join endpoints. A professional can
// request to join a law firm, track / cancel requests, and leave a firm; a
// firm owner can review and decide incoming join requests.

import { get, post } from '@/services/api';

function unwrap(res) {
  if (res && Object.prototype.hasOwnProperty.call(res, 'data')) {
    return res.data;
  }
  return res;
}

/** The caller's current firm membership ({ firm, member }) or null. */
export async function getMyMembership() {
  return unwrap(await get('/api/firm-join/membership'));
}

/** ACTIVE law firms the caller can request to join. */
export async function listJoinableFirms() {
  return unwrap(await get('/api/firm-join/joinable')) || [];
}

/** The caller's own join requests (newest first). */
export async function listMyRequests() {
  return unwrap(await get('/api/firm-join/requests/mine')) || [];
}

/** Send a join request to a firm. */
export async function requestJoin(firmId, message) {
  return unwrap(await post('/api/firm-join/requests', { firmId, message }));
}

/** Cancel a pending join request. */
export async function cancelRequest(id) {
  return unwrap(await post(`/api/firm-join/requests/${id}/cancel`, {}));
}

/** Leave the firm the caller belongs to. */
export async function leaveFirm() {
  return unwrap(await post('/api/firm-join/leave', {}));
}

/** Join requests for the firm the caller owns ({ firm, requests }). */
export async function listFirmRequests() {
  return unwrap(await get('/api/firm-join/requests/firm'));
}

/** Approve or reject a join request. `decision` is 'approve' | 'reject'. */
export async function decideRequest(id, decision) {
  return unwrap(
    await post(`/api/firm-join/requests/${id}/decide`, { decision })
  );
}

export default {
  getMyMembership,
  listJoinableFirms,
  listMyRequests,
  requestJoin,
  cancelRequest,
  leaveFirm,
  listFirmRequests,
  decideRequest,
};
