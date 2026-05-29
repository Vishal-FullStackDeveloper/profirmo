// paymentsService — Razorpay integration + payment lifecycle.
//
// Surface:
//   createOrderForBooking({ bookingId, user }) -> { order, payment, keyId }
//   verifyAndRecordPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
//   handleWebhookEvent(event)            -> for payment.failed / refund.processed
//   refundPayment(paymentId, { amount, reason, adminId })
//
// Amounts are paise (integer) end-to-end; rupees only appear in formatters.

const crypto = require('crypto');
const Razorpay = require('razorpay');
const {
  sequelize,
  Payment,
  EscrowEntry,
  Booking,
  User,
  WalletTransaction,
  ProfessionalClient,
} = require('../models');
const env = require('../config/env');
const { logAudit } = require('../utils/auditLogger');
const { enqueue } = require('./queueService');
const notificationService = require('./notificationService');
const adminSettingsService = require('./adminSettingsService');

let _client = null;

/**
 * Lazily build the Razorpay SDK client so the backend can boot even when
 * keys aren't configured (the create-order endpoint will return a clear
 * error instead of crashing at startup).
 */
function razorpay() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw {
      statusCode: 500,
      message:
        'Razorpay is not configured. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in backend/.env.',
    };
  }
  if (!_client) {
    _client = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    });
  }
  return _client;
}

/**
 * Compute the platform fee + net payout for a gross paise amount. The bps
 * comes from the admin-managed AdminSetting row (key=bookingMarkupBps) so
 * the rate can be updated from the dashboard without a redeploy. Falls back
 * to env.platformFeeBps when nothing is stored.
 * @param {number} grossPaise
 * @returns {Promise<{ platformFee: number, netAmount: number, bps: number }>}
 */
async function splitFee(grossPaise) {
  let bps;
  try {
    bps = await adminSettingsService.getNumber('bookingMarkupBps');
  } catch {
    bps = Number(env.platformFeeBps) || 1000;
  }
  bps = Math.max(0, Math.min(10000, bps));
  const platformFee = Math.floor((grossPaise * bps) / 10000);
  const netAmount = grossPaise - platformFee;
  return { platformFee, netAmount, bps };
}

/**
 * Resolve a Booking's payee — for legacy `Professional.id` rows we follow
 * the chain via User.linkedId; for new-model rows we read ProfessionalDetail.
 *
 * @param {object} booking
 * @returns {Promise<string|null>} payee user id, or null when no payee
 */
async function resolvePayeeUserId(booking) {
  if (!booking || !booking.professionalId) return null;
  // New-model: ProfessionalDetail.id matches; userId is directly on it.
  const { ProfessionalDetail } = require('../models');
  const detail = await ProfessionalDetail.findOne({
    where: { id: booking.professionalId },
    raw: true,
  });
  if (detail && detail.userId) return detail.userId;
  // Legacy: lookup users.linkedId -> professionalId.
  const user = await User.findOne({
    where: { linkedId: booking.professionalId, role: 'professional' },
    raw: true,
  });
  return user ? user.id : null;
}

/**
 * Create a Razorpay order for a booking. Each call inserts a new Payment
 * row in state=created; the client uses the returned `order_id` to open
 * the checkout modal.
 */
async function createOrderForBooking({ bookingId, user }) {
  if (!user || !user.id) {
    throw { statusCode: 401, message: 'Authentication required.' };
  }
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw { statusCode: 404, message: 'Booking not found.' };
  }

  // Pre-flight: only the booking's client may pay. clientId on bookings is
  // a users.id directly per the bookingService write path.
  if (booking.clientId && booking.clientId !== user.id) {
    throw {
      statusCode: 403,
      message: 'You can only pay for your own bookings.',
    };
  }

  const rupees = Number(booking.estimatedCost) || 0;
  if (rupees <= 0) {
    throw {
      statusCode: 422,
      message: 'Booking has no payable amount.',
    };
  }
  const paise = Math.round(rupees * 100);
  if (paise < 100) {
    throw {
      statusCode: 422,
      message: 'Amount must be at least ₹1.',
    };
  }
  const receipt = `bk_${booking.id.slice(-32)}`;

  const order = await razorpay().orders.create({
    amount: paise,
    currency: 'INR',
    receipt,
    notes: { bookingId: booking.id },
  });

  const payeeUserId = await resolvePayeeUserId(booking);
  if (!payeeUserId) {
    throw {
      statusCode: 422,
      message: 'Could not resolve the booking\'s professional for payout.',
    };
  }

  const payment = await Payment.create({
    bookingId: booking.id,
    userId: user.id,
    professionalUserId: payeeUserId,
    razorpayOrderId: order.id,
    receipt,
    amount: paise,
    currency: 'INR',
    status: 'created',
    rawOrder: order,
  });

  await logAudit({
    userId: user.id,
    action: 'payment.order_created',
    entity: 'payment',
    entityId: payment.id,
    status: 'success',
    metadata: { bookingId: booking.id, razorpayOrderId: order.id, amount: paise },
  });

  return {
    order,
    payment: payment.get({ plain: true }),
    keyId: env.razorpay.keyId,
  };
}

/**
 * HMAC SHA-256 over `${orderId}|${paymentId}` with the Razorpay secret.
 * Re-used by both the verify endpoint and the webhook handler.
 */
function expectedSignature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

/**
 * Verify the signature returned by Razorpay's success callback, then mark
 * the booking paid, create the escrow entry and credit the professional's
 * wallet — all inside a single transaction so a half-applied state cannot
 * exist on failure.
 */
async function verifyAndRecordPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  userId,
}) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw {
      statusCode: 400,
      message: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.',
    };
  }
  if (!env.razorpay.keySecret) {
    throw {
      statusCode: 500,
      message: 'Razorpay is not configured on the server.',
    };
  }

  const payment = await Payment.findOne({
    where: { razorpayOrderId: razorpay_order_id },
  });
  if (!payment) {
    throw { statusCode: 404, message: 'No payment matches this order.' };
  }
  if (userId && payment.userId !== userId) {
    throw {
      statusCode: 403,
      message: 'You cannot verify a payment that is not yours.',
    };
  }

  const expected = expectedSignature(razorpay_order_id, razorpay_payment_id);
  if (expected !== razorpay_signature) {
    await payment.update({
      status: 'failed',
      failureReason: 'Signature mismatch',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    await logAudit({
      userId: payment.userId,
      action: 'payment.signature_mismatch',
      entity: 'payment',
      entityId: payment.id,
      status: 'failure',
      metadata: { razorpay_order_id, razorpay_payment_id },
    });
    throw { statusCode: 400, message: 'Payment signature verification failed.' };
  }

  // Idempotent: if we've already marked this paid, return what we have.
  if (payment.status === 'paid') {
    const existingEscrow = await EscrowEntry.findOne({
      where: { paymentId: payment.id },
    });
    return {
      payment: payment.get({ plain: true }),
      escrow: existingEscrow ? existingEscrow.get({ plain: true }) : null,
      alreadyVerified: true,
    };
  }

  const { platformFee, netAmount } = await splitFee(payment.amount);

  let escrowSnapshot = null;
  await sequelize.transaction(async (t) => {
    await payment.update(
      {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        platformFee,
        netAmount,
        capturedAt: new Date(),
      },
      { transaction: t }
    );

    const escrow = await EscrowEntry.create(
      {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        professionalUserId: payment.professionalUserId,
        grossAmount: payment.amount,
        platformFee,
        netAmount,
        status: 'escrowed',
      },
      { transaction: t }
    );
    escrowSnapshot = escrow.get({ plain: true });

    await WalletTransaction.create(
      {
        walletUserId: payment.professionalUserId,
        entryType: 'credit',
        category: 'escrow_in',
        amount: netAmount,
        bookingId: payment.bookingId,
        paymentId: payment.id,
        escrowId: escrow.id,
        escrowStatus: 'escrowed',
        description: 'Payment escrowed after successful Razorpay capture.',
      },
      { transaction: t }
    );

    if (payment.bookingId) {
      await Booking.update(
        { status: 'confirmed' },
        { where: { id: payment.bookingId }, transaction: t }
      );
    }

    // Auto-link the paying client to the professional's clients list. The
    // booking row carries the public professional id, which is what the
    // ProfessionalClient table FKs against (see lawFirmService.getFirmClients
    // for the dual lookup). Skip silently if the booking has no professional
    // or if the link already exists (the unique index would throw).
    if (payment.bookingId) {
      const bookingRow = await Booking.findByPk(payment.bookingId, {
        transaction: t,
        attributes: ['professionalId'],
      });
      const professionalListingId = bookingRow && bookingRow.professionalId;
      if (professionalListingId && payment.userId) {
        const existingLink = await ProfessionalClient.findOne({
          where: {
            professionalId: professionalListingId,
            clientUserId: payment.userId,
          },
          transaction: t,
        });
        if (!existingLink) {
          await ProfessionalClient.create(
            {
              professionalId: professionalListingId,
              clientUserId: payment.userId,
              addedByUserId: payment.userId,
            },
            { transaction: t }
          );
        }
      }
    }
  });

  await logAudit({
    userId: payment.userId,
    action: 'payment.verified',
    entity: 'payment',
    entityId: payment.id,
    status: 'success',
    metadata: {
      bookingId: payment.bookingId,
      razorpay_payment_id,
      amount: payment.amount,
      platformFee,
      netAmount,
    },
  });

  // Notifications — best-effort, fire-and-forget. Failures here must not
  // unwind the verified payment.
  try {
    await notificationService.createNotification({
      userId: payment.userId,
      type: 'payment_success',
      title: 'Payment received',
      message: `We received your payment of ₹${(payment.amount / 100).toFixed(2)}. Your booking is confirmed.`,
      link: payment.bookingId
        ? `/dashboard/client/bookings`
        : '/dashboard',
      metadata: { paymentId: payment.id },
    });
    await notificationService.createNotification({
      userId: payment.professionalUserId,
      type: 'escrow_created',
      title: 'New escrowed booking',
      message: `₹${(netAmount / 100).toFixed(2)} is now held in escrow for your upcoming consultation.`,
      link: '/dashboard/professional/wallet',
      metadata: { paymentId: payment.id, escrowId: escrowSnapshot.id },
    });
    if (payment.userId) {
      await enqueue('email', {
        to: (await User.findByPk(payment.userId, { raw: true })).email,
        template: 'paymentReceipt',
        vars: {
          amount: (payment.amount / 100).toFixed(2),
          bookingId: payment.bookingId,
          paymentId: payment.id,
        },
      });
    }
  } catch (err) {
    console.warn(`[paymentsService] notification failure: ${err.message}`);
  }

  return {
    payment: await Payment.findByPk(payment.id).then((p) => p.get({ plain: true })),
    escrow: escrowSnapshot,
  };
}

/**
 * Handle a Razorpay webhook event. The webhook secret is configured in the
 * Razorpay dashboard and validated by the route handler before calling this.
 */
async function handleWebhookEvent(event) {
  if (!event || !event.event) return { ignored: true };

  // payment.failed → record the failure if we still have a Payment row.
  if (event.event === 'payment.failed') {
    const ent = (event.payload && event.payload.payment && event.payload.payment.entity) || {};
    const payment = await Payment.findOne({
      where: { razorpayOrderId: ent.order_id || '' },
    });
    if (payment && payment.status !== 'paid') {
      await payment.update({
        status: 'failed',
        razorpayPaymentId: ent.id || payment.razorpayPaymentId,
        failureReason: ent.error_description || 'payment.failed webhook',
        rawPayment: ent,
      });
      await logAudit({
        userId: payment.userId,
        action: 'payment.failed',
        entity: 'payment',
        entityId: payment.id,
        status: 'failure',
        metadata: { code: ent.error_code, reason: ent.error_description },
      });
    }
    return { handled: 'payment.failed', paymentId: payment ? payment.id : null };
  }

  // refund.processed → mark the parent payment refunded + reverse escrow.
  if (event.event === 'refund.processed') {
    const refund = (event.payload && event.payload.refund && event.payload.refund.entity) || {};
    const payment = await Payment.findOne({
      where: { razorpayPaymentId: refund.payment_id || '' },
    });
    if (payment) {
      await refundPayment(payment.id, {
        amount: Number(refund.amount) || payment.amount,
        reason: 'Refund processed via Razorpay',
        source: 'webhook',
      });
    }
    return { handled: 'refund.processed', paymentId: payment ? payment.id : null };
  }

  return { ignored: true, event: event.event };
}

/**
 * Issue a refund through Razorpay and reverse the escrow + wallet entries.
 * `amount` is in paise; pass `payment.amount` for a full refund.
 */
async function refundPayment(paymentId, { amount, reason, adminId, source }) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    throw { statusCode: 404, message: 'Payment not found.' };
  }
  if (payment.status !== 'paid' && payment.status !== 'refunded') {
    throw {
      statusCode: 400,
      message: 'Only paid payments can be refunded.',
    };
  }
  const refundPaise = Math.max(1, Math.min(amount || payment.amount, payment.amount - payment.refundedAmount));
  if (refundPaise <= 0) {
    throw { statusCode: 400, message: 'No remaining amount to refund.' };
  }

  // Only call the Razorpay refund API for admin-initiated refunds; webhook
  // events already mean Razorpay processed the refund themselves.
  if (source !== 'webhook' && payment.razorpayPaymentId) {
    try {
      await razorpay().payments.refund(payment.razorpayPaymentId, {
        amount: refundPaise,
        notes: { reason: reason || 'Admin refund', paymentId: payment.id },
      });
    } catch (err) {
      throw {
        statusCode: 502,
        message: `Razorpay refund failed: ${err.message || err}`,
      };
    }
  }

  // Reverse escrow + wallet ledger.
  await sequelize.transaction(async (t) => {
    const escrow = await EscrowEntry.findOne({
      where: { paymentId: payment.id },
      transaction: t,
    });
    if (escrow) {
      await escrow.update({ status: 'refunded' }, { transaction: t });
      await WalletTransaction.create(
        {
          walletUserId: escrow.professionalUserId,
          entryType: 'debit',
          category: 'refund_reversal',
          amount: escrow.netAmount,
          bookingId: payment.bookingId,
          paymentId: payment.id,
          escrowId: escrow.id,
          escrowStatus: 'refunded',
          description: reason || 'Payment refunded',
          metadata: { adminId: adminId || null, refundPaise },
        },
        { transaction: t }
      );
    }
    await payment.update(
      {
        status: 'refunded',
        refundedAmount: payment.refundedAmount + refundPaise,
      },
      { transaction: t }
    );
  });

  await logAudit({
    userId: adminId || null,
    action: 'payment.refunded',
    entity: 'payment',
    entityId: payment.id,
    status: 'success',
    metadata: { refundPaise, reason, source: source || 'admin' },
  });

  return { payment: (await Payment.findByPk(payment.id)).get({ plain: true }) };
}

/**
 * Verify a Razorpay webhook signature header. Returns true / false; the
 * route handler responds with 400 on false.
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!env.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(String(signatureHeader || ''), 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = {
  createOrderForBooking,
  verifyAndRecordPayment,
  refundPayment,
  handleWebhookEvent,
  verifyWebhookSignature,
  splitFee,
};
