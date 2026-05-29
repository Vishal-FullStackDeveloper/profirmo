// paymentService — Razorpay checkout + wallet + payout helpers.
//
// All amounts coming back from the API are in paise (integer). UI rendering
// should convert to rupees via `paiseToRupees`.

import { get, post } from '@/services/api';

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }
  return response;
}

export const paiseToRupees = (n) =>
  typeof n === 'number' && Number.isFinite(n)
    ? (n / 100).toFixed(2)
    : '0.00';

export const formatINR = (paise) =>
  `₹${paiseToRupees(Number(paise) || 0)}`;

/**
 * Create a Razorpay order on the backend for an existing booking.
 * @returns {Promise<{ order, payment, keyId }>}
 */
export async function createOrder(bookingId) {
  const res = await post('/api/payments/orders', { bookingId });
  return unwrap(res);
}

/**
 * Verify the signature returned by Razorpay's success callback. Backend
 * also flips the booking + escrow + wallet state atomically.
 */
/**
 * Payment history for the caller. `side`:
 *  - 'client'        — payments I made
 *  - 'professional'  — payments I received (into escrow)
 *  - 'any'           — union (default)
 */
export async function listMyPayments(side = 'any') {
  const res = await get('/api/payments/mine', { params: { side } });
  const data = unwrap(res);
  return (data && data.items) || [];
}

export async function verifyPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  const res = await post('/api/payments/verify', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return unwrap(res);
}

// --- Wallet --------------------------------------------------------------

export async function getWalletSummary() {
  const res = await get('/api/wallet/summary');
  return unwrap(res);
}

export async function listWalletTransactions(params = {}) {
  const res = await get('/api/wallet/transactions', { params });
  return {
    items: (res && res.data) || [],
    meta: (res && res.meta) || null,
  };
}

// --- Payouts (pro) -------------------------------------------------------

export async function getAvailableForPayout() {
  const res = await get('/api/payouts/me/available');
  return unwrap(res);
}

export async function listMyPayouts() {
  const res = await get('/api/payouts/mine');
  const data = unwrap(res);
  return (data && data.items) || [];
}

export async function createPayoutRequest(body) {
  const res = await post('/api/payouts/mine', body);
  return unwrap(res);
}

// --- Admin payments + payouts -------------------------------------------

export async function adminListPayments(params = {}) {
  const res = await get('/api/admin/payments', { params });
  return {
    items: (res && res.data) || [],
    meta: (res && res.meta) || null,
  };
}

export async function adminRefundPayment(id, { amount, reason } = {}) {
  const res = await post(`/api/admin/payments/${id}/refund`, { amount, reason });
  return unwrap(res);
}

export async function adminListPayouts(params = {}) {
  const res = await get('/api/admin/payouts', { params });
  return {
    items: (res && res.data) || [],
    meta: (res && res.meta) || null,
  };
}

export async function adminApprovePayout(id, reason) {
  const res = await post(`/api/admin/payouts/${id}/approve`, { reason });
  return unwrap(res);
}

export async function adminRejectPayout(id, reason) {
  const res = await post(`/api/admin/payouts/${id}/reject`, { reason });
  return unwrap(res);
}

export async function adminMarkPayoutPaid(id, transferRef) {
  const res = await post(`/api/admin/payouts/${id}/paid`, { transferRef });
  return unwrap(res);
}

// --- Razorpay checkout opener -------------------------------------------

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Inject the Razorpay Standard Checkout script on demand. */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Razorpay'))
      );
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

/**
 * Convenience: end-to-end "Pay Now" — creates the order, opens the modal,
 * verifies the signature, and returns the verified payment. Handles
 * cancellation by resolving with `{ cancelled: true }` so callers can show
 * a friendly message instead of throwing.
 *
 * @param {object} opts
 * @param {string} opts.bookingId
 * @param {{ name?: string, email?: string, phone?: string }} [opts.prefill]
 * @param {string} [opts.notes]
 * @returns {Promise<{ payment?, escrow?, cancelled?: boolean }>}
 */
export async function payForBooking({ bookingId, prefill = {}, notes = '' }) {
  await loadRazorpayScript();
  const { order, payment, keyId } = await createOrder(bookingId);
  if (!keyId) {
    throw new Error('Razorpay is not configured on the server.');
  }

  return new Promise((resolve, reject) => {
    // Razorpay's checkout supports in-modal retries: a failed attempt fires
    // `payment.failed`, but the user can immediately try another method/card
    // in the same modal. We must NOT settle the outer Promise on the first
    // failure — only the eventual outcome matters.
    //
    // Track the most recent failure here and use it ONLY if the modal is
    // dismissed without a successful capture. If `handler` fires afterwards
    // the success wins.
    let lastFailure = null;
    let settled = false;
    const settleResolve = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const settleReject = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'Profirmo',
      description: notes || 'Consultation booking',
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.phone || '',
      },
      theme: { color: '#d97706' },
      handler: async (response) => {
        try {
          const verified = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          settleResolve(verified);
        } catch (err) {
          settleReject(err);
        }
      },
      modal: {
        ondismiss: () => {
          if (lastFailure) {
            settleReject(
              new Error(
                lastFailure.description ||
                  lastFailure.reason ||
                  'Payment failed. Please try again.'
              )
            );
          } else {
            settleResolve({ cancelled: true, paymentId: payment.id });
          }
        },
      },
    });
    // Capture the failure, but DO NOT settle here — the user may retry and
    // succeed on a subsequent attempt within the same modal.
    rzp.on('payment.failed', (response) => {
      lastFailure = (response && response.error) || lastFailure;
    });
    rzp.open();
  });
}

export default {
  paiseToRupees,
  formatINR,
  createOrder,
  verifyPayment,
  getWalletSummary,
  listWalletTransactions,
  getAvailableForPayout,
  listMyPayouts,
  createPayoutRequest,
  adminListPayments,
  adminRefundPayment,
  adminListPayouts,
  adminApprovePayout,
  adminRejectPayout,
  adminMarkPayoutPaid,
  loadRazorpayScript,
  payForBooking,
};
