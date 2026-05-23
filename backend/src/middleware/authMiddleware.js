const { verifyAccessToken } = require('../utils/tokenHelper');
const { errorResponse } = require('../utils/responseHandler');

// Normalize a decoded JWT payload so downstream code can rely on `.id`.
// Access tokens carry the user id in the `sub` claim.
const normalizeUser = (decoded) => {
  if (!decoded) return decoded;
  return { ...decoded, id: decoded.id || decoded.sub };
};

/**
 * Extract a Bearer token from the Authorization header.
 * @param {object} req - Express request
 * @returns {string|null}
 */
const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
};

/**
 * Hard authentication guard. Blocks the request with 401 when no valid
 * token is supplied. On success attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return errorResponse(res, 401, 'Authentication required: missing token');
  }
  try {
    const decoded = verifyAccessToken(token);
    req.user = normalizeUser(decoded);
    return next();
  } catch (err) {
    return errorResponse(res, 401, 'Authentication failed: invalid or expired token');
  }
};

/**
 * Soft authentication. Attaches req.user when a valid token is present but
 * never blocks the request. Useful for endpoints with personalized output.
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = normalizeUser(verifyAccessToken(token));
    } catch (err) {
      // Ignore invalid tokens for optional auth.
      req.user = undefined;
    }
  }
  return next();
};

module.exports = { authenticate, optionalAuth };
