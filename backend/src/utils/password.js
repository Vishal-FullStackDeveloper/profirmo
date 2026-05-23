// Password hashing helpers.
//
// New accounts store a bcrypt hash. Legacy demo accounts may still hold a
// plain-text password; verifyPassword() detects the bcrypt `$2` prefix and
// falls back to a direct comparison so old demo logins keep working.

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password with bcrypt.
 * @param {string} plain - plain-text password
 * @returns {Promise<string>} bcrypt hash
 */
const hashPassword = async (plain) => {
  return bcrypt.hash(String(plain == null ? '' : plain), SALT_ROUNDS);
};

/**
 * Verify a plain-text password against a stored value.
 * If `stored` looks like a bcrypt hash (`$2...`) it is compared with bcrypt;
 * otherwise it is treated as a legacy plain-text password.
 * @param {string} plain - candidate plain-text password
 * @param {string} stored - stored hash or legacy plain text
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plain, stored) => {
  if (stored == null) return false;
  const candidate = String(plain == null ? '' : plain);
  if (typeof stored === 'string' && stored.startsWith('$2')) {
    return bcrypt.compare(candidate, stored);
  }
  return candidate === String(stored);
};

module.exports = { hashPassword, verifyPassword };
