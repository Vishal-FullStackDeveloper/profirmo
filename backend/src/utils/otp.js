// One-time-password (OTP) utilities for the Profirmo backend.
//
// OTPs are short, 6-digit numeric codes emailed to users for the
// password-reset flow. They are NEVER stored or logged in clear text — only
// a bcrypt hash is persisted (see src/models/PasswordResetOtp.js).

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const OTP_DIGITS = 6;

/**
 * Generate a cryptographically-random 6-digit numeric OTP.
 * The result is ALWAYS exactly 6 characters — leading zeros are preserved.
 * @returns {string} a 6-character numeric string, e.g. "048273"
 */
const generateOtp = () => {
  // crypto.randomInt is uniform over [0, 1_000_000).
  const n = crypto.randomInt(0, 10 ** OTP_DIGITS);
  return String(n).padStart(OTP_DIGITS, '0');
};

/**
 * Hash an OTP with bcrypt for at-rest storage.
 * @param {string} otp - the plain 6-digit OTP
 * @returns {Promise<string>} bcrypt hash
 */
const hashOtp = async (otp) => {
  return bcrypt.hash(String(otp == null ? '' : otp), SALT_ROUNDS);
};

/**
 * Verify a candidate OTP against a stored bcrypt hash.
 * @param {string} otp - candidate plain OTP
 * @param {string} hash - stored bcrypt hash
 * @returns {Promise<boolean>}
 */
const verifyOtp = async (otp, hash) => {
  if (!hash || typeof hash !== 'string') return false;
  return bcrypt.compare(String(otp == null ? '' : otp), hash);
};

module.exports = { generateOtp, hashOtp, verifyOtp };
