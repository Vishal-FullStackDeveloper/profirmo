require('dotenv').config();
const path = require('path');

// Centralized environment configuration for the Profirmo backend.
// All other modules should import config values from here rather than
// reading process.env directly.
module.exports = {
  port: process.env.PORT || 5000,
  // Absolute path to the local-disk uploads directory (Phase 4).
  uploadsDir: path.join(__dirname, '../../uploads'),
  // Maximum accepted upload size in bytes (default 10 MB).
  maxUploadBytes:
    Number(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_secret',
  jwtExpiresIn: '7d',
  // Short-lived JWT access token lifetime.
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  // Opaque refresh token / session lifetime in days.
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 30,
  // httpOnly refresh-token cookie settings.
  cookie: {
    name: 'pf_refresh',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'demo_project_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
    ssl: process.env.DB_SSL === 'true',
  },

  // --- Phase-6: jobs / email / notifications --------------------------------
  // Public base URL of the frontend app, used to build links inside emails
  // (e.g. the email-verification link).
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  // Default "From" header for outgoing emails.
  emailFrom: process.env.EMAIL_FROM || 'Profirmo <no-reply@profirmo.com>',
  // Email delivery mode: 'dev' writes rendered emails to disk, 'smtp' uses a
  // real SMTP transport built from the `smtp` config below.
  emailTransport: process.env.EMAIL_TRANSPORT || 'dev',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    secure: process.env.SMTP_SECURE === 'true',
  },
  // Background-job worker poll interval in milliseconds.
  jobPollMs: Number(process.env.JOB_POLL_MS) || 4000,
  // How long an email-verification token stays valid, in hours.
  emailVerificationExpiryHours:
    Number(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS) || 48,
};
