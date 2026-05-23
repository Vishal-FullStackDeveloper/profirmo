'use client';

// Application status — for a logged-in professional who is not yet approved.
//  - PENDING_APPROVAL : informational "under review" screen.
//  - REJECTED         : shows the rejection reason + a resubmit form.
//  - INFO_REQUESTED   : shows the requested-info message + a resubmit form.
// The resubmit form reuses ProfessionalRegistrationForm (mode 'resubmit'),
// prefilled from GET /api/profile. On success the page refreshes the user
// (refreshUser) and shows a "resubmitted" confirmation.

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Clock,
  XCircle,
  Info,
  CheckCircle2,
  LogOut,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/components/AuthProvider';
import { getProfile } from '@/services/profileService';
import { resubmitProfessional } from '@/services/professionalService';
import ProfessionalRegistrationForm, {
  PROFESSIONAL_TYPES,
  valuesFromProfile,
} from '@/components/professionals/ProfessionalRegistrationForm';

const PROFESSIONAL_ROLES = ['professional', 'firm_professional'];

const STATUS_META = {
  PENDING_APPROVAL: {
    label: 'Under review',
    variant: 'amber',
    icon: Clock,
    iconBg: 'bg-amber-100 text-amber-600',
    title: 'Your application is under review',
    body: 'Our team is verifying your professional details and documents. This usually takes 1-2 business days. You will receive an email as soon as a decision is made — no action is needed from you right now.',
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'red',
    icon: XCircle,
    iconBg: 'bg-red-100 text-red-600',
    title: 'Your application was not approved',
    body: 'Please review the reason below, update your details and documents, then resubmit your application.',
  },
  INFO_REQUESTED: {
    label: 'More info needed',
    variant: 'blue',
    icon: Info,
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'We need more information',
    body: 'Our reviewers have requested additional details. Please address the request below and resubmit your application.',
  },
};

/** Pull the professionalType out of profile data, defaulting to Legal. */
function detectType(data) {
  if (!data) return PROFESSIONAL_TYPES.LEGAL;
  const raw =
    (data.professionalDetail && data.professionalDetail.professionalType) ||
    data.professionalType ||
    (data.user && data.user.professionalType) ||
    '';
  if (/tax/i.test(raw)) return PROFESSIONAL_TYPES.TAX;
  if (/legal|advocate|lawyer/i.test(raw)) return PROFESSIONAL_TYPES.LEGAL;
  // Fall back: a present tax detail implies a tax consultant.
  if (data.techDetail || data.tax || data.taxDetail)
    return PROFESSIONAL_TYPES.TAX;
  return PROFESSIONAL_TYPES.LEGAL;
}

/** Read the review note / reason from various possible profile shapes. */
function reviewNote(data, user) {
  const approval =
    (data && data.professionalApproval) ||
    (data && data.professionalDetail && data.professionalDetail.approval) ||
    {};
  return (
    approval.rejectionReason ||
    approval.reason ||
    approval.message ||
    approval.requestedInfo ||
    approval.note ||
    (user && user.approvalReason) ||
    (user && user.approvalNote) ||
    ''
  );
}

/** Map a backend 422 errors map onto our flat field names. */
function mapServerErrors(err) {
  const out = {};
  const errs = err && err.payload && err.payload.errors;
  if (errs && typeof errs === 'object') {
    for (const [k, v] of Object.entries(errs)) {
      const short = k.includes('.') ? k.split('.').pop() : k;
      out[short] = typeof v === 'string' ? v : String(v);
    }
  }
  return out;
}

function Shell({ children, onLogout }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 via-white to-teal-50">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo variant="light" />
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
            >
              Back to home
            </Link>
          )}
        </div>
      </header>
      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}

function CenterLoader({ label }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 py-20 text-sm text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      {label}
    </div>
  );
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const [resubmitted, setResubmitted] = useState(false);

  const status = user && user.approvalStatus;
  const isProfessional = PROFESSIONAL_ROLES.includes(user && user.role);

  // Auth guard.
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    // Not a professional, or already approved — send to the dashboard router.
    if (!isProfessional || status === 'APPROVED' || !status) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, isProfessional, status, router]);

  // Load the current profile to prefill the resubmit form.
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setProfileError(
        (err && err.message) || 'Unable to load your application details.'
      );
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && isProfessional) {
      loadProfile();
    }
  }, [loading, isAuthenticated, isProfessional, loadProfile]);

  async function handleResubmit(payload) {
    setBanner('');
    setServerErrors({});
    setSubmitting(true);
    try {
      await resubmitProfessional(payload);
      setResubmitted(true);
      await refreshUser();
      if (typeof window !== 'undefined')
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerErrors(mapServerErrors(err));
      setBanner(
        (err && err.message) ||
          'Unable to resubmit your application. Please try again.'
      );
      if (typeof window !== 'undefined')
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Render guards -----------------------------------------------------
  if (loading || !isAuthenticated || !isProfessional) {
    return (
      <Shell>
        <CenterLoader label="Loading your application…" />
      </Shell>
    );
  }

  const meta = STATUS_META[status] || STATUS_META.PENDING_APPROVAL;
  const Icon = meta.icon;
  const note = reviewNote(profile, user);
  const proType = detectType(profile);
  const canResubmit = status === 'REJECTED' || status === 'INFO_REQUESTED';

  // ---- Resubmitted confirmation -----------------------------------------
  if (resubmitted) {
    return (
      <Shell onLogout={logout}>
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 text-center shadow-card sm:p-8">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-600">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Application resubmitted
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Thanks — your updated details have been submitted and your
              application is pending review again. We&apos;ll email you once a
              decision is made.
            </p>
            <button
              type="button"
              onClick={() => {
                setResubmitted(false);
                loadProfile();
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            >
              <RefreshCw className="h-4 w-4" />
              Back to application status
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onLogout={logout}>
      <div className="w-full max-w-2xl">
        {/* Status card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-7">
          <div className="flex items-start gap-4">
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${meta.iconBg}`}
            >
              <Icon size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {meta.title}
                </h1>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">{meta.body}</p>
            </div>
          </div>

          {/* Reviewer note for REJECTED / INFO_REQUESTED */}
          {canResubmit && note && (
            <div
              className={`mt-4 rounded-xl border px-3.5 py-3 text-sm ${
                status === 'REJECTED'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              <p className="mb-0.5 font-semibold">
                {status === 'REJECTED'
                  ? 'Reason for rejection'
                  : 'Information requested'}
              </p>
              <p className="whitespace-pre-line">{note}</p>
            </div>
          )}
        </div>

        {/* PENDING — informational only, no form */}
        {status === 'PENDING_APPROVAL' && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500 shadow-card">
            <p>
              You&apos;ll get full access to your professional dashboard as soon
              as your application is approved.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Explore Pro Firmo while you wait
            </Link>
          </div>
        )}

        {/* REJECTED / INFO_REQUESTED — the resubmit form */}
        {canResubmit && (
          <div className="mt-6">
            <h2 className="mb-1 text-base font-bold text-slate-900">
              Update &amp; resubmit your application
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Edit your details and re-upload any documents, then resubmit for
              review.
            </p>

            {profileLoading ? (
              <CenterLoader label="Loading your details…" />
            ) : profileError ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div className="flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{profileError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadProfile}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : (
              <ProfessionalRegistrationForm
                key={proType}
                mode="resubmit"
                professionalType={proType}
                initialValues={valuesFromProfile(profile)}
                submitLabel="Resubmit application"
                submitting={submitting}
                banner={banner}
                serverErrors={serverErrors}
                onSubmit={handleResubmit}
              />
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
