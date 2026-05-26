'use client';

// ProfessionalRegistrationForm — the shared dynamic professional form used by
// both the signup page (full registration) and the application-status page
// (resubmission). It renders multi-section collapsible cards with a progress
// indicator, switches the Legal vs Tax section based on professionalType, and
// owns all field state. The parent supplies `mode` ('register' | 'resubmit'),
// optional `initialValues`, a `submitLabel`, an `onSubmit(payload)` callback,
// plus `submitting` / `banner` state.

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Scale,
  Calculator,
} from 'lucide-react';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Combobox from '@/components/common/Combobox';
import MultiCombobox from '@/components/common/MultiCombobox';
import FileUpload from '@/components/common/FileUpload';
import PhotoUpload from '@/components/common/PhotoUpload';
import { isEmail, isPhone, isStrongPassword } from '@/utils/validators';
import { useCategories, useCities } from '@/hooks/useAppSettings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PROFESSIONAL_TYPES = {
  LEGAL: 'Legal Consultant',
  TAX: 'Tax Consultant',
};

const CONSULTATION_TYPE_OPTIONS = [
  { value: 'Online', label: 'Online' },
  { value: 'In-person', label: 'In-person' },
  { value: 'Both', label: 'Both' },
];

const TAX_EXPERTISE_FLAGS = [
  { key: 'gstExpertise', label: 'GST expertise' },
  { key: 'incomeTaxExpertise', label: 'Income tax expertise' },
  { key: 'corporateTaxExpertise', label: 'Corporate tax expertise' },
  { key: 'businessAdvisory', label: 'Business advisory' },
  { key: 'accountingServices', label: 'Accounting services' },
  { key: 'financialPlanning', label: 'Financial planning' },
];

// ---------------------------------------------------------------------------
// Empty form shape
// ---------------------------------------------------------------------------

function emptyValues() {
  return {
    // Personal
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    country: '',
    state: '',
    city: '',
    addressLine: '',
    bio: '',
    profilePhoto: '',
    // Admin-managed taxonomy: array of selected SubCategory ids.
    subCategoryIds: [],
    // Admin-managed list: cities the professional actually practises in.
    practiceCities: [],
    // Professional details
    yearsOfExperience: '',
    skills: '',
    languages: '',
    education: '',
    certifications: '',
    website: '',
    linkedin: '',
    consultationFee: '',
    availability: '',
    // Common documents
    governmentId: '',
    resume: '',
    degreeCertificate: '',
    // Legal fields
    barRegistrationNumber: '',
    enrollmentNumber: '',
    advocateLicenseNumber: '',
    practiceAreas: '',
    courtPractice: '',
    jurisdiction: '',
    chamberAddress: '',
    lawDegree: '',
    legalConsultationType: '',
    yearsOfPractice: '',
    advocateLicense: '',
    barCouncilRegistration: '',
    practiceCertificate: '',
    lawDegreeDocument: '',
    supportingCertificates: [],
    // Tax fields
    taxRegistrationNumber: '',
    specializationAreas: '',
    gstExpertise: false,
    incomeTaxExpertise: false,
    corporateTaxExpertise: false,
    businessAdvisory: false,
    accountingServices: false,
    financialPlanning: false,
    taxConsultationType: '',
    taxConsultantCertificate: '',
    registrationCertificate: '',
    professionalLicense: '',
    supportingCertifications: [],
  };
}

// ---------------------------------------------------------------------------
// Comma-string <-> array helpers
// ---------------------------------------------------------------------------

/** Split a comma-separated string into a trimmed, de-empty'd array. */
function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Join an array into a comma-separated string for an input field. */
function toCsv(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'string') return value;
  return '';
}

/**
 * Build a populated values object from API profile data. Accepts the loose
 * shape returned by GET /api/profile (user / professionalDetail / lawyerDetail
 * / techDetail and any nested professional / legal / tax detail objects).
 */
export function valuesFromProfile(data) {
  const v = emptyValues();
  if (!data || typeof data !== 'object') return v;

  const user = data.user || {};
  const address = data.address || user.address || {};
  const pro =
    data.professionalDetail ||
    data.professional ||
    data.professionalDetails ||
    {};
  const legal = data.lawyerDetail || data.legal || data.legalDetail || {};
  const tax = data.techDetail || data.tax || data.taxDetail || {};

  const pick = (...candidates) => {
    for (const c of candidates) {
      if (c !== undefined && c !== null && c !== '') return c;
    }
    return '';
  };

  v.firstName = pick(user.firstName, data.firstName);
  v.lastName = pick(user.lastName, data.lastName);
  v.email = pick(user.email, data.email);
  v.mobileNumber = pick(user.mobileNumber, data.mobileNumber);
  v.country = pick(address.country, pro.country);
  v.state = pick(address.state, pro.state);
  v.city = pick(address.city, pro.city);
  v.subCategoryIds = Array.isArray(pro.subCategoryIds)
    ? pro.subCategoryIds.filter(Boolean)
    : [];
  v.practiceCities = Array.isArray(pro.practiceCities)
    ? pro.practiceCities.filter(Boolean)
    : [];
  v.addressLine = pick(address.addressLine, address.line1, pro.addressLine);
  v.bio = pick(pro.bio, user.bio);
  v.profilePhoto = pick(user.profilePhoto, pro.profilePhoto, data.profilePhoto);

  v.yearsOfExperience =
    pro.yearsOfExperience !== undefined && pro.yearsOfExperience !== null
      ? String(pro.yearsOfExperience)
      : '';
  v.skills = toCsv(pro.skills);
  v.expertise = toCsv(pro.expertise);
  v.languages = toCsv(pro.languages);
  v.education = toCsv(pro.education);
  v.certifications = toCsv(pro.certifications);
  v.website = pick(pro.website);
  v.linkedin = pick(pro.linkedin);
  v.consultationFee =
    pro.consultationFee !== undefined && pro.consultationFee !== null
      ? String(pro.consultationFee)
      : '';
  v.availability = toCsv(pro.availability);
  v.governmentId = pick(pro.governmentId);
  v.resume = pick(pro.resume);
  v.degreeCertificate = pick(pro.degreeCertificate);

  // Legal
  v.barRegistrationNumber = pick(legal.barRegistrationNumber);
  v.enrollmentNumber = pick(legal.enrollmentNumber);
  v.advocateLicenseNumber = pick(legal.advocateLicenseNumber);
  v.practiceAreas = toCsv(legal.practiceAreas);
  v.courtPractice = toCsv(legal.courtPractice);
  v.jurisdiction = pick(legal.jurisdiction);
  v.chamberAddress = pick(legal.chamberAddress);
  v.lawDegree = pick(legal.lawDegree);
  v.legalConsultationType = pick(legal.consultationType);
  v.yearsOfPractice =
    legal.yearsOfPractice !== undefined && legal.yearsOfPractice !== null
      ? String(legal.yearsOfPractice)
      : '';
  v.advocateLicense = pick(legal.advocateLicense);
  v.barCouncilRegistration = pick(legal.barCouncilRegistration);
  v.practiceCertificate = pick(legal.practiceCertificate);
  v.lawDegreeDocument = pick(legal.lawDegreeDocument);
  v.supportingCertificates = Array.isArray(legal.supportingCertificates)
    ? legal.supportingCertificates.filter(Boolean)
    : [];

  // Tax
  v.taxRegistrationNumber = pick(tax.taxRegistrationNumber);
  v.specializationAreas = toCsv(tax.specializationAreas);
  v.gstExpertise = Boolean(tax.gstExpertise);
  v.incomeTaxExpertise = Boolean(tax.incomeTaxExpertise);
  v.corporateTaxExpertise = Boolean(tax.corporateTaxExpertise);
  v.businessAdvisory = Boolean(tax.businessAdvisory);
  v.accountingServices = Boolean(tax.accountingServices);
  v.financialPlanning = Boolean(tax.financialPlanning);
  v.taxConsultationType = pick(tax.consultationType);
  v.taxConsultantCertificate = pick(tax.taxConsultantCertificate);
  v.registrationCertificate = pick(tax.registrationCertificate);
  v.professionalLicense = pick(tax.professionalLicense);
  v.supportingCertifications = Array.isArray(tax.supportingCertifications)
    ? tax.supportingCertifications.filter(Boolean)
    : [];

  return v;
}

/**
 * Build the API payload from the form values for a given professionalType.
 * `mode` 'register' includes credentials + role-detail nesting at the top
 * level; 'resubmit' wraps the professional detail under `professional`.
 */
export function buildPayload(values, professionalType, mode) {
  const isLegal = professionalType === PROFESSIONAL_TYPES.LEGAL;

  const professional = {
    yearsOfExperience: values.yearsOfExperience
      ? Number(values.yearsOfExperience)
      : undefined,
    skills: toArray(values.skills),
    languages: toArray(values.languages),
    education: toArray(values.education),
    certifications: toArray(values.certifications),
    website: values.website.trim(),
    linkedin: values.linkedin.trim(),
    consultationFee: values.consultationFee
      ? Number(values.consultationFee)
      : undefined,
    availability: toArray(values.availability),
    profilePhoto: values.profilePhoto || '',
    governmentId: values.governmentId || '',
    resume: values.resume || '',
    degreeCertificate: values.degreeCertificate || '',
    bio: values.bio.trim(),
    country: values.country.trim(),
    state: values.state.trim(),
    city: values.city.trim(),
    addressLine: values.addressLine.trim(),
    subCategoryIds: Array.isArray(values.subCategoryIds)
      ? values.subCategoryIds
      : [],
    practiceCities: Array.isArray(values.practiceCities)
      ? values.practiceCities.filter(Boolean)
      : [],
  };

  const legal = {
    barRegistrationNumber: values.barRegistrationNumber.trim(),
    enrollmentNumber: values.enrollmentNumber.trim(),
    advocateLicenseNumber: values.advocateLicenseNumber.trim(),
    practiceAreas: toArray(values.practiceAreas),
    courtPractice: toArray(values.courtPractice),
    jurisdiction: values.jurisdiction.trim(),
    chamberAddress: values.chamberAddress.trim(),
    lawDegree: values.lawDegree.trim(),
    consultationType: values.legalConsultationType || '',
    yearsOfPractice: values.yearsOfPractice
      ? Number(values.yearsOfPractice)
      : undefined,
    advocateLicense: values.advocateLicense || '',
    barCouncilRegistration: values.barCouncilRegistration || '',
    practiceCertificate: values.practiceCertificate || '',
    lawDegreeDocument: values.lawDegreeDocument || '',
    supportingCertificates: (values.supportingCertificates || []).filter(
      Boolean
    ),
  };

  const tax = {
    taxRegistrationNumber: values.taxRegistrationNumber.trim(),
    gstExpertise: Boolean(values.gstExpertise),
    incomeTaxExpertise: Boolean(values.incomeTaxExpertise),
    corporateTaxExpertise: Boolean(values.corporateTaxExpertise),
    businessAdvisory: Boolean(values.businessAdvisory),
    accountingServices: Boolean(values.accountingServices),
    financialPlanning: Boolean(values.financialPlanning),
    consultationType: values.taxConsultationType || '',
    taxConsultantCertificate: values.taxConsultantCertificate || '',
    registrationCertificate: values.registrationCertificate || '',
    professionalLicense: values.professionalLicense || '',
    supportingCertifications: (values.supportingCertifications || []).filter(
      Boolean
    ),
  };

  if (mode === 'resubmit') {
    const payload = { professionalType, professional };
    if (isLegal) payload.legal = legal;
    else payload.tax = tax;
    return payload;
  }

  // Registration: flat top-level professional payload.
  const payload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    mobileNumber: values.mobileNumber.trim(),
    password: values.password,
    professionalType,
    ...professional,
  };
  if (isLegal) payload.legal = legal;
  else payload.tax = tax;
  return payload;
}

/**
 * Validate the form for a given professionalType / mode.
 * Returns a { field: message } errors object (empty when valid).
 */
export function validateValues(values, professionalType, mode) {
  const errors = {};
  const req = (field, message) => {
    if (!String(values[field] || '').trim()) errors[field] = message;
  };

  req('firstName', 'First name is required.');
  req('lastName', 'Last name is required.');

  if (mode === 'register') {
    if (!values.email.trim()) errors.email = 'Email is required.';
    else if (!isEmail(values.email))
      errors.email = 'Enter a valid email address.';
    if (!values.mobileNumber.trim())
      errors.mobileNumber = 'Mobile number is required.';
    else if (!isPhone(values.mobileNumber))
      errors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    if (!values.password) errors.password = 'Password is required.';
    else if (!isStrongPassword(values.password))
      errors.password = 'Password must be at least 8 characters.';
    if (values.confirmPassword !== values.password)
      errors.confirmPassword = 'Passwords do not match.';
  }

  req('country', 'Country is required.');
  req('state', 'State is required.');
  req('city', 'City is required.');

  if (professionalType === PROFESSIONAL_TYPES.LEGAL) {
    req('barRegistrationNumber', 'Bar registration number is required.');
    req('enrollmentNumber', 'Enrollment number is required.');
    req('advocateLicenseNumber', 'Advocate license number is required.');
    if (toArray(values.practiceAreas).length === 0)
      errors.practiceAreas = 'At least one practice area is required.';
    req('jurisdiction', 'Jurisdiction is required.');
  } else if (professionalType === PROFESSIONAL_TYPES.TAX) {
    req('taxRegistrationNumber', 'Tax registration number is required.');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A collapsible section card with a step number badge. */
function SectionCard({ index, title, description, complete, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
            complete
              ? 'bg-teal-100 text-teal-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {complete ? <CheckCircle2 size={16} /> : index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            {title}
          </span>
          {description && (
            <span className="block text-xs text-slate-500">{description}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-5">{children}</div>
      )}
    </div>
  );
}

/** A multi-file add/remove list — array of stored URLs. */
function MultiFileList({ label, hint, category, value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  return (
    <div className="w-full">
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="space-y-3">
        {list.map((url, i) => (
          <div key={`${url}-${i}`} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <FileUpload
                value={url}
                category={category}
                onChange={(next) => {
                  const copy = [...list];
                  if (next) copy[i] = next;
                  else copy.splice(i, 1);
                  onChange(copy);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const copy = [...list];
                copy.splice(i, 1);
                onChange(copy);
              }}
              className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {/* An empty uploader to append a new file. */}
        <FileUpload
          value=""
          category={category}
          hint="Add another document"
          onChange={(next) => {
            if (next) onChange([...list, next]);
          }}
        />
      </div>
    </div>
  );
}

/** A simple labelled textarea matching the design system. */
function TextArea({ label, name, value, onChange, placeholder, error }) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * ProfessionalRegistrationForm
 * Props:
 *  - mode: 'register' | 'resubmit'
 *  - professionalType: 'Legal Consultant' | 'Tax Consultant'
 *  - initialValues: optional partial values to prefill
 *  - submitLabel: button text
 *  - submitting: boolean — disables the submit button + shows a spinner
 *  - banner: error banner text
 *  - serverErrors: { field: msg } map from a backend 422 response
 *  - onSubmit: (payload) => void
 */
export default function ProfessionalRegistrationForm({
  mode = 'register',
  professionalType,
  initialValues,
  submitLabel = 'Submit',
  submitting = false,
  banner = '',
  serverErrors,
  onSubmit,
}) {
  const [values, setValues] = useState(() => ({
    ...emptyValues(),
    ...(initialValues || {}),
  }));
  const [errors, setErrors] = useState({});

  const isLegal = professionalType === PROFESSIONAL_TYPES.LEGAL;

  // Admin-managed taxonomy + cities power the dropdowns.
  const { categories } = useCategories();
  const { cities } = useCities();
  const categoryForType = useMemo(() => {
    if (!Array.isArray(categories)) return null;
    const target = isLegal ? 'legal' : 'tax';
    return categories.find((c) => String(c.slug || '').toLowerCase() === target);
  }, [categories, isLegal]);

  function toggleSubCategory(id) {
    setValues((v) => {
      const set = new Set(v.subCategoryIds || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...v, subCategoryIds: Array.from(set) };
    });
  }
  const allErrors = useMemo(
    () => ({ ...(serverErrors || {}), ...errors }),
    [serverErrors, errors]
  );

  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setField(name, type === 'checkbox' ? checked : value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateValues(values, professionalType, mode);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Scroll to top so the user sees the banner / first error.
      if (typeof window !== 'undefined')
        window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const payload = buildPayload(values, professionalType, mode);
    if (typeof onSubmit === 'function') onSubmit(payload);
  }

  // Section completion flags drive the progress indicator.
  const personalDone =
    !!values.firstName.trim() &&
    !!values.lastName.trim() &&
    !!values.country.trim() &&
    !!values.state.trim() &&
    !!values.city.trim() &&
    (mode !== 'register' ||
      (isEmail(values.email) &&
        isPhone(values.mobileNumber) &&
        isStrongPassword(values.password) &&
        values.password === values.confirmPassword));
  const typeDone = isLegal
    ? !!values.barRegistrationNumber.trim() &&
      !!values.enrollmentNumber.trim() &&
      !!values.advocateLicenseNumber.trim() &&
      toArray(values.practiceAreas).length > 0 &&
      !!values.jurisdiction.trim()
    : !!values.taxRegistrationNumber.trim();

  const sections = [personalDone, true, true, typeDone];
  const completedCount = sections.filter(Boolean).length;
  const progress = Math.round((completedCount / sections.length) * 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Progress indicator */}
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-card">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>
            {isLegal ? (
              <span className="inline-flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-amber-600" />
                Legal Consultant / Advocate
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-amber-600" />
                Tax Consultant
              </span>
            )}
          </span>
          <span>{completedCount} of 4 sections ready</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {banner && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {/* Section 1 — Personal */}
      <SectionCard
        index={1}
        title="Personal information"
        description="Tell us who you are."
        complete={personalDone}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Profile photo
            </p>
            <PhotoUpload
              value={values.profilePhoto}
              onChange={(url) => setField('profilePhoto', url)}
              category="profile_photo"
              shape="circle"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              placeholder="Aarav"
              required
              error={allErrors.firstName}
            />
            <Input
              label="Last name"
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              placeholder="Mehta"
              required
              error={allErrors.lastName}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email address"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required={mode === 'register'}
              disabled={mode !== 'register'}
              error={allErrors.email}
            />
            <Input
              label="Mobile number"
              name="mobileNumber"
              type="tel"
              value={values.mobileNumber}
              onChange={handleChange}
              placeholder="9876543210"
              required={mode === 'register'}
              disabled={mode !== 'register'}
              error={allErrors.mobileNumber}
            />
          </div>
          {mode === 'register' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                error={allErrors.password}
              />
              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                error={allErrors.confirmPassword}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Country"
              name="country"
              value={values.country}
              onChange={handleChange}
              placeholder="India"
              required
              error={allErrors.country}
            />
            <Input
              label="State"
              name="state"
              value={values.state}
              onChange={handleChange}
              placeholder="Maharashtra"
              required
              error={allErrors.state}
            />
            <Combobox
              label="City"
              name="city"
              value={values.city}
              onChange={handleChange}
              options={cities.map((c) => ({ value: c.name, label: c.name }))}
              placeholder="Select city…"
              required
              error={allErrors.city}
            />
          </div>
          <MultiCombobox
            label="Practice cities"
            name="practiceCities"
            value={values.practiceCities}
            onChange={(next) =>
              setValues((v) => ({ ...v, practiceCities: next }))
            }
            options={cities.map((c) => ({ value: c.name, label: c.name }))}
            placeholder="Select every city you take clients in…"
            hint="These also appear when clients filter the listing by city."
          />
          <Input
            label="Address line"
            name="addressLine"
            value={values.addressLine}
            onChange={handleChange}
            placeholder="Street, building, area"
            error={allErrors.addressLine}
          />
          <TextArea
            label="Short bio"
            name="bio"
            value={values.bio}
            onChange={handleChange}
            placeholder="A brief introduction about your practice."
            error={allErrors.bio}
          />

          {/* Admin-managed sub-categories filtered by Legal/Tax. Pick every
              area you practise in — drives search filters + profile tags. */}
          {categoryForType &&
            Array.isArray(categoryForType.subCategories) &&
            categoryForType.subCategories.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {categoryForType.name} sub-categories
                </label>
                <p className="mb-2 text-xs text-slate-500">
                  Select every {categoryForType.name.toLowerCase()} area you
                  practise in.
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryForType.subCategories.map((s) => {
                    const checked = (values.subCategoryIds || []).includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                          checked
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleSubCategory(s.id)}
                        />
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </SectionCard>

      {/* Section 2 — Professional details */}
      <SectionCard
        index={2}
        title="Professional details"
        description="Your experience, skills and availability."
        complete
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Years of experience"
              name="yearsOfExperience"
              type="number"
              min="0"
              value={values.yearsOfExperience}
              onChange={handleChange}
              placeholder="5"
              error={allErrors.yearsOfExperience}
            />
            <Input
              label="Consultation fee (₹)"
              name="consultationFee"
              type="number"
              min="0"
              value={values.consultationFee}
              onChange={handleChange}
              placeholder="1500"
              error={allErrors.consultationFee}
            />
          </div>
          <Input
            label="Skills"
            name="skills"
            value={values.skills}
            onChange={handleChange}
            placeholder="Litigation, Drafting, Negotiation"
            hint="Comma-separated"
            error={allErrors.skills}
          />
          <Input
            label="Languages"
            name="languages"
            value={values.languages}
            onChange={handleChange}
            placeholder="English, Hindi, Marathi"
            hint="Comma-separated"
            error={allErrors.languages}
          />
          <Input
            label="Education"
            name="education"
            value={values.education}
            onChange={handleChange}
            placeholder="LLB - Mumbai University, LLM - NLU"
            hint="Comma-separated"
            error={allErrors.education}
          />
          <Input
            label="Certifications"
            name="certifications"
            value={values.certifications}
            onChange={handleChange}
            placeholder="Certified Mediator, GST Practitioner"
            hint="Comma-separated"
            error={allErrors.certifications}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Website"
              name="website"
              value={values.website}
              onChange={handleChange}
              placeholder="https://example.com"
              error={allErrors.website}
            />
            <Input
              label="LinkedIn"
              name="linkedin"
              value={values.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/you"
              error={allErrors.linkedin}
            />
          </div>
          <Input
            label="Availability"
            name="availability"
            value={values.availability}
            onChange={handleChange}
            placeholder="Mon, Tue, Wed, Fri"
            hint="Comma-separated (e.g. days or time slots)"
            error={allErrors.availability}
          />
        </div>
      </SectionCard>

      {/* Section 3 — Common documents */}
      <SectionCard
        index={3}
        title="Documents"
        description="Upload your verification documents."
        complete
      >
        <div className="space-y-4">
          <FileUpload
            label="Government ID"
            value={values.governmentId}
            onChange={(url) => setField('governmentId', url)}
            category="identity_document"
            hint="Aadhaar, passport or other government-issued ID."
          />
          <FileUpload
            label="Resume / CV"
            value={values.resume}
            onChange={(url) => setField('resume', url)}
            category="resume"
            hint="Your professional resume."
          />
          <FileUpload
            label="Degree certificate"
            value={values.degreeCertificate}
            onChange={(url) => setField('degreeCertificate', url)}
            category="certification"
            hint="Your highest qualifying degree."
          />
        </div>
      </SectionCard>

      {/* Section 4 — Type-specific (switches dynamically) */}
      <SectionCard
        index={4}
        title={
          isLegal ? 'Legal practice details' : 'Tax practice details'
        }
        description={
          isLegal
            ? 'Registration, practice areas and legal documents.'
            : 'Registration, specializations and tax documents.'
        }
        complete={typeDone}
      >
        {isLegal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Bar registration number"
                name="barRegistrationNumber"
                value={values.barRegistrationNumber}
                onChange={handleChange}
                placeholder="MAH/1234/2020"
                required
                error={allErrors.barRegistrationNumber}
              />
              <Input
                label="Enrollment number"
                name="enrollmentNumber"
                value={values.enrollmentNumber}
                onChange={handleChange}
                placeholder="ENR-56789"
                required
                error={allErrors.enrollmentNumber}
              />
            </div>
            <Input
              label="Advocate license number"
              name="advocateLicenseNumber"
              value={values.advocateLicenseNumber}
              onChange={handleChange}
              placeholder="ADV-001122"
              required
              error={allErrors.advocateLicenseNumber}
            />
            <Input
              label="Practice areas"
              name="practiceAreas"
              value={values.practiceAreas}
              onChange={handleChange}
              placeholder="Criminal, Civil, Family"
              hint="Comma-separated"
              required
              error={allErrors.practiceAreas}
            />
            <Input
              label="Courts you practice in"
              name="courtPractice"
              value={values.courtPractice}
              onChange={handleChange}
              placeholder="High Court, District Court"
              hint="Comma-separated"
              error={allErrors.courtPractice}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Jurisdiction"
                name="jurisdiction"
                value={values.jurisdiction}
                onChange={handleChange}
                placeholder="Maharashtra"
                required
                error={allErrors.jurisdiction}
              />
              <Input
                label="Law degree"
                name="lawDegree"
                value={values.lawDegree}
                onChange={handleChange}
                placeholder="LLB"
                error={allErrors.lawDegree}
              />
            </div>
            <Input
              label="Chamber address"
              name="chamberAddress"
              value={values.chamberAddress}
              onChange={handleChange}
              placeholder="Your chamber / office address"
              error={allErrors.chamberAddress}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Consultation type"
                name="legalConsultationType"
                value={values.legalConsultationType}
                onChange={handleChange}
                options={CONSULTATION_TYPE_OPTIONS}
                placeholder="Select consultation type"
                error={allErrors.legalConsultationType}
              />
              <Input
                label="Years of practice"
                name="yearsOfPractice"
                type="number"
                min="0"
                value={values.yearsOfPractice}
                onChange={handleChange}
                placeholder="8"
                error={allErrors.yearsOfPractice}
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Legal documents
              </p>
              <div className="space-y-4">
                <FileUpload
                  label="Advocate license"
                  value={values.advocateLicense}
                  onChange={(url) => setField('advocateLicense', url)}
                  category="certification"
                />
                <FileUpload
                  label="Bar council registration"
                  value={values.barCouncilRegistration}
                  onChange={(url) =>
                    setField('barCouncilRegistration', url)
                  }
                  category="certification"
                />
                <FileUpload
                  label="Practice certificate"
                  value={values.practiceCertificate}
                  onChange={(url) => setField('practiceCertificate', url)}
                  category="certification"
                />
                <FileUpload
                  label="Law degree document"
                  value={values.lawDegreeDocument}
                  onChange={(url) => setField('lawDegreeDocument', url)}
                  category="certification"
                />
                <MultiFileList
                  label="Supporting certificates"
                  hint="Add any additional certificates."
                  category="certification"
                  value={values.supportingCertificates}
                  onChange={(list) =>
                    setField('supportingCertificates', list)
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Tax registration number"
              name="taxRegistrationNumber"
              value={values.taxRegistrationNumber}
              onChange={handleChange}
              placeholder="TRN-99887766"
              required
              error={allErrors.taxRegistrationNumber}
            />
            {/* Specialization areas are now covered by the admin-managed
                sub-categories selected at the top of the form, so this field
                is no longer rendered. */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Expertise
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TAX_EXPERTISE_FLAGS.map((flag) => (
                  <label
                    key={flag.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/50"
                  >
                    <input
                      type="checkbox"
                      name={flag.key}
                      checked={Boolean(values[flag.key])}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-200"
                    />
                    {flag.label}
                  </label>
                ))}
              </div>
            </div>
            <Select
              label="Consultation type"
              name="taxConsultationType"
              value={values.taxConsultationType}
              onChange={handleChange}
              options={CONSULTATION_TYPE_OPTIONS}
              placeholder="Select consultation type"
              error={allErrors.taxConsultationType}
            />

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Tax documents
              </p>
              <div className="space-y-4">
                <FileUpload
                  label="Tax consultant certificate"
                  value={values.taxConsultantCertificate}
                  onChange={(url) =>
                    setField('taxConsultantCertificate', url)
                  }
                  category="certification"
                />
                <FileUpload
                  label="Registration certificate"
                  value={values.registrationCertificate}
                  onChange={(url) =>
                    setField('registrationCertificate', url)
                  }
                  category="certification"
                />
                <FileUpload
                  label="Professional license"
                  value={values.professionalLicense}
                  onChange={(url) => setField('professionalLicense', url)}
                  category="certification"
                />
                <MultiFileList
                  label="Supporting certifications"
                  hint="Add any additional certifications."
                  category="certification"
                  value={values.supportingCertifications}
                  onChange={(list) =>
                    setField('supportingCertifications', list)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-glow-sm transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
