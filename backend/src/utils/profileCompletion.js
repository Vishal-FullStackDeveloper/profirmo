// Profile completion calculator.
//
// Given a user's role plus their loaded profile records, computes an integer
// completion percentage (0-100) by counting filled vs. expected fields that
// are relevant to that role.

// A value counts as "filled" when it is a non-empty string, a non-empty
// array, or a non-null/non-undefined non-string scalar (e.g. a number).
const isFilled = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Compute a profile completion percentage for a user.
 *
 * @param {object} args
 * @param {string} args.role - user role
 * @param {object} args.user - users row (sanitized or raw)
 * @param {object|null} args.address - addresses row
 * @param {object|null} args.professionalDetail - professional_details row
 * @param {object|null} args.lawFirm - law_firms row
 * @returns {number} integer 0-100
 */
const computeProfileCompletion = ({
  role,
  user = {},
  address = null,
  professionalDetail = null,
  lawFirm = null,
} = {}) => {
  const checks = [];

  // --- Fields expected of every role --------------------------------------
  checks.push(isFilled(user.firstName));
  checks.push(isFilled(user.lastName));
  checks.push(isFilled(user.mobileNumber));
  checks.push(isFilled(user.profilePhoto));
  checks.push(isFilled(address && address.country));
  checks.push(isFilled(address && address.state));
  checks.push(isFilled(address && address.city));
  checks.push(isFilled(address && address.addressLine));
  checks.push(isFilled(address && address.postalCode));

  // --- Professional-specific fields ---------------------------------------
  if (role === 'professional') {
    const pd = professionalDetail || {};
    checks.push(isFilled(pd.professionalType));
    checks.push(isFilled(pd.designation));
    checks.push(isFilled(pd.organization));
    checks.push(isFilled(pd.yearsOfExperience));
    checks.push(isFilled(pd.bio));
    checks.push(isFilled(pd.skills));
    checks.push(isFilled(pd.expertise));
    checks.push(isFilled(pd.languages));
  }

  // --- Firm-specific fields -----------------------------------------------
  if (role === 'firm') {
    const lf = lawFirm || {};
    checks.push(isFilled(lf.firmName));
    checks.push(isFilled(lf.registrationNumber));
    checks.push(isFilled(lf.about));
    checks.push(isFilled(lf.headquarters));
    checks.push(isFilled(lf.contactEmail));
    checks.push(isFilled(lf.practiceAreas));
  }

  const total = checks.length;
  if (total === 0) return 0;
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / total) * 100);
};

module.exports = { computeProfileCompletion, isFilled };
