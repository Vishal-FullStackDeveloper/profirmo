// Rate-limiting middleware for the Profirmo backend (Phase 5).
//
// Uses express-rate-limit with the in-memory store. Two limiters are
// exported:
//   - globalLimiter: a generous cap applied to ALL /api routes, intended to
//     soak up abusive bursts without affecting normal traffic.
//   - authLimiter: a much stricter cap applied to brute-force-prone
//     endpoints (login / signup / register-*). It is deliberately NOT used
//     on /api/auth/refresh, which the frontend calls on every app load.
//
// Every limiter responds with the standard { success, message } JSON
// envelope so clients get a consistent error shape.

const rateLimit = require('express-rate-limit');

// Shared JSON handler so a rate-limited request still returns the standard
// error envelope instead of express-rate-limit's default plain-text body.
const jsonHandler = (message) => (req, res /* , next, options */) => {
  res.status(429).json({ success: false, message });
};

// Generous, app-wide limiter. 600 requests / 15 minutes per IP.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  handler: jsonHandler('Too many requests, please try again later.'),
});

// Strict limiter for authentication endpoints. 30 attempts / 15 minutes
// per IP — enough for a real user, hostile to credential-stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  handler: jsonHandler(
    'Too many authentication attempts, please try again later.'
  ),
});

module.exports = { globalLimiter, authLimiter };
