// CSRF / origin-guard middleware for the Profirmo backend (Phase 5).
//
// This is the request-side half of the CSRF defense; the cookie-side half is
// the existing httpOnly + sameSite refresh-token cookie.
//
// For state-changing methods (POST/PUT/PATCH/DELETE):
//   - If an `Origin` header is present it MUST match an allowed origin,
//     otherwise the request is rejected with 403.
//   - If no `Origin` header is present the request is allowed. Browsers
//     always send `Origin` on cross-site state-changing requests, so a
//     missing Origin means a non-browser client (curl/Postman/server-to-
//     server) — those cannot be tricked into a CSRF attack, so blocking
//     them would only break legitimate API integrations.
// Safe methods (GET/HEAD/OPTIONS) always pass.

const env = require('./../config/env');
const { errorResponse } = require('../utils/responseHandler');

// Origins permitted to perform state-changing requests. The configured
// frontend URLs (env.frontendUrls includes profirmo.com / www.profirmo.com
// and any FRONTEND_URL overrides) plus the common local dev ports so dev
// tooling keeps working.
const ALLOWED_ORIGINS = [
  ...env.frontendUrls,
  'http://localhost:3000',
  'http://localhost:5001',
];

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const csrfGuard = (req, res, next) => {
  if (!STATE_CHANGING.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;

  // No Origin header -> non-browser client; CSRF is not possible. Allow.
  if (!origin) {
    return next();
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return next();
  }

  return errorResponse(res, 403, 'Request blocked: origin not allowed');
};

module.exports = { csrfGuard, ALLOWED_ORIGINS };
