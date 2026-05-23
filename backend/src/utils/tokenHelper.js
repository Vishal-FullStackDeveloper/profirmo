const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

// Token helpers for the Profirmo auth system.
//
// Two token kinds are used:
//   - Access token : short-lived signed JWT, sent as a Bearer header.
//   - Refresh token: long-lived opaque random string, stored httpOnly cookie.
//                    Only its SHA-256 hash is persisted in the sessions table.

/**
 * Sign a JWT with the configured secret and expiry.
 * Kept for backward compatibility with any callers of the legacy helper.
 * @param {object} payload - claims to embed
 * @returns {string} signed token
 */
const signToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

/**
 * Verify a JWT. Returns the decoded payload or throws on failure.
 * @param {string} token - raw JWT string
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

/**
 * Sign a short-lived access token for a user.
 * @param {object} user - user record (needs id, role, linkedId, firmId)
 * @returns {string} signed JWT
 */
const signAccessToken = (user) => {
  const payload = {
    sub: user.id,
    role: user.role,
    linkedId: user.linkedId || null,
    firmId: user.firmId || null,
    type: 'access',
  };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.accessTokenExpiry,
  });
};

/**
 * Verify an access token. Returns the decoded payload or throws.
 * @param {string} token - raw JWT string
 * @returns {object} decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

/**
 * Generate a cryptographically random opaque refresh token.
 * @returns {string} 96-char hex string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString('hex');
};

/**
 * Hash a token with SHA-256 (used to store refresh tokens safely).
 * @param {string} token - raw token
 * @returns {string} hex digest
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

module.exports = {
  signToken,
  verifyToken,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
};
