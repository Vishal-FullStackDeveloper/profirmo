const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateRequest');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// --- Signup / login / session ---------------------------------------------

// Public signup. role: client | professional | law_firm.
// authLimiter throttles brute-force / mass-registration abuse.
router.post(
  '/signup',
  authLimiter,
  validateBody({
    firstName: 'required',
    lastName: 'required',
    email: 'required|email',
    password: 'required|min:6',
    role: 'required|in:client,professional,law_firm',
    mobileNumber: 'phone',
  }),
  authController.signup
);

// authLimiter throttles credential-stuffing / brute-force attempts.
router.post(
  '/login',
  authLimiter,
  validateBody({ email: 'required|email', password: 'required' }),
  authController.login
);

// Logout + refresh read the httpOnly cookie; no body validation needed.
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// --- Email verification (Phase 6) -----------------------------------------

// Confirm an email-verification token. On success the account is activated
// and the user is logged in.
router.post(
  '/verify-email',
  validateBody({ token: 'required' }),
  authController.verifyEmail
);

// Resend the verification email. authLimiter throttles abuse; the response
// is intentionally generic so it never reveals whether an account exists.
router.post(
  '/resend-verification',
  authLimiter,
  validateBody({ email: 'required|email' }),
  authController.resendVerification
);

// --- Legacy registration endpoints (kept for the existing frontend) -------

router.post(
  '/register-client',
  authLimiter,
  validateBody({
    name: 'required',
    email: 'required|email',
    password: 'required|min:6',
    phone: 'phone',
  }),
  authController.registerClient
);

// Phase 7: dynamic professional registration. Field-level validation is done
// in professionalRegistrationService (it varies by professionalType), so no
// static validateBody schema is applied here — the service returns a 422 with
// a per-field errors object on failure.
router.post(
  '/register-professional',
  authLimiter,
  authController.registerProfessional
);

router.post(
  '/register-firm',
  authLimiter,
  validateBody({
    name: 'required',
    email: 'required|email',
    password: 'required|min:6',
    firmType: 'required',
    city: 'required',
    phone: 'phone',
  }),
  authController.registerFirm
);

// --- Password reset (forgot-password + email OTP) -------------------------

// Begin a password reset. authLimiter throttles abuse; the response is
// intentionally generic so it never reveals whether an account exists.
router.post(
  '/forgot-password',
  authLimiter,
  validateBody({ email: 'required|email' }),
  authController.forgotPassword
);

// Resend the password-reset OTP. authLimiter throttles abuse on top of the
// service-level 60s cooldown / 5-resend cap.
router.post(
  '/resend-otp',
  authLimiter,
  validateBody({ email: 'required|email' }),
  authController.resendOtp
);

// Verify the 6-digit OTP; on success a short-lived resetToken is returned.
router.post(
  '/verify-password-otp',
  authLimiter,
  validateBody({ email: 'required|email', otp: 'required' }),
  authController.verifyPasswordOtp
);

// Complete the reset using a verified resetToken.
router.post(
  '/reset-password',
  authLimiter,
  validateBody({
    resetToken: 'required',
    newPassword: 'required',
    confirmPassword: 'required',
  }),
  authController.resetPassword
);

// Current authenticated user (requires Bearer access token).
router.get('/me', authenticate, authController.getMe);

module.exports = router;
