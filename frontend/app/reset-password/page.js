'use client';

// Reset-password — step 3 of the email-OTP password-reset flow.
// Reads pf_reset_token from sessionStorage, collects + validates a new
// password with a live requirements checklist, then submits the reset.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { resetPassword } from '@/services/authService';

// sessionStorage keys shared across the reset flow.
const RESET_EMAIL_KEY = 'pf_reset_email';
const RESET_TOKEN_KEY = 'pf_reset_token';

// Live password-strength rules.
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  {
    id: 'upper',
    label: 'One uppercase letter',
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: 'lower',
    label: 'One lowercase letter',
    test: (v) => /[a-z]/.test(v),
  },
  { id: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  {
    id: 'special',
    label: 'One special character',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function clearResetStorage() {
  try {
    window.sessionStorage.removeItem(RESET_EMAIL_KEY);
    window.sessionStorage.removeItem(RESET_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [resetToken, setResetToken] = useState('');
  const [ready, setReady] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldError, setFieldError] = useState('');
  const [banner, setBanner] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // On mount: require pf_reset_token, else bounce to step 1.
  useEffect(() => {
    let token = '';
    try {
      token = window.sessionStorage.getItem(RESET_TOKEN_KEY) || '';
    } catch {
      token = '';
    }
    if (!token) {
      router.replace('/forgot-password');
      return;
    }
    setResetToken(token);
    setReady(true);
  }, [router]);

  const ruleResults = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(newPassword),
  }));
  const allRulesPass = ruleResults.every((r) => r.passed);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = allRulesPass && passwordsMatch && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError('');
    setBanner('');

    if (!allRulesPass) {
      setFieldError('Your password does not meet all the requirements.');
      return;
    }
    if (!passwordsMatch) {
      setFieldError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ resetToken, newPassword, confirmPassword });
      clearResetStorage();
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch (err) {
      const status = err && err.status;
      if (status === 422) {
        const msg =
          err.payload &&
          err.payload.errors &&
          err.payload.errors.newPassword;
        setFieldError(
          msg ||
            (err && err.message) ||
            'That password could not be used. Please choose another.'
        );
        setSubmitting(false);
      } else if (status === 401 || status === 400) {
        // Stale / expired reset session — must restart.
        clearResetStorage();
        setSessionExpired(true);
        setBanner(
          (err && err.message) ||
            'Your reset session has expired. Please restart the password reset.'
        );
        setSubmitting(false);
      } else {
        setBanner(
          (err && err.message) ||
            'Unable to reset your password. Please try again.'
        );
        setSubmitting(false);
      }
    }
  }

  // Avoid a flash of content before the storage guard resolves.
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-teal-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 via-white to-teal-50">
      {/* Slim branded top bar */}
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo variant="light" />
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          {success ? (
            <div className="glass rounded-2xl border border-slate-200/80 p-7 text-center shadow-card sm:p-8">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-600">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Password changed
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Your password has been updated. Please sign in with your new
                password.
              </p>
              <div className="mt-5">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition hover:shadow-glow"
                >
                  Go to sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Set a new password
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Choose a strong password you haven&apos;t used before.
                </p>
              </div>

              <div className="glass rounded-2xl border border-slate-200/80 p-6 shadow-card sm:p-7">
                {banner && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{banner}</span>
                    </div>
                    {sessionExpired && (
                      <Link
                        href="/forgot-password"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-800 underline"
                      >
                        Restart password reset
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  noValidate
                >
                  {/* New password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setFieldError('');
                        }}
                        placeholder="Enter a new password"
                        autoComplete="new-password"
                        disabled={submitting || sessionExpired}
                        className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 disabled:bg-slate-50 ${
                          fieldError
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        aria-label={
                          showNew ? 'Hide password' : 'Show password'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      >
                        {showNew ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Confirm new password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setFieldError('');
                        }}
                        placeholder="Re-enter the new password"
                        autoComplete="new-password"
                        disabled={submitting || sessionExpired}
                        className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 disabled:bg-slate-50 ${
                          fieldError
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label={
                          showConfirm ? 'Hide password' : 'Show password'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      >
                        {showConfirm ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {fieldError && (
                    <p className="text-xs text-red-600">{fieldError}</p>
                  )}

                  {/* Live requirements checklist */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Password must contain
                    </p>
                    <ul className="space-y-1.5">
                      {ruleResults.map((rule) => (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-2 text-xs ${
                            rule.passed
                              ? 'text-teal-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {rule.passed ? (
                            <Check
                              size={14}
                              className="shrink-0 text-teal-600"
                            />
                          ) : (
                            <X
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                          )}
                          <span>{rule.label}</span>
                        </li>
                      ))}
                      <li
                        className={`flex items-center gap-2 text-xs ${
                          passwordsMatch
                            ? 'text-teal-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {passwordsMatch ? (
                          <Check
                            size={14}
                            className="shrink-0 text-teal-600"
                          />
                        ) : (
                          <X size={14} className="shrink-0 text-slate-400" />
                        )}
                        <span>Both passwords match</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit || sessionExpired}
                    className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating password…
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <p className="mt-6 text-center text-sm text-slate-600">
                Remembered it?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-amber-700 hover:text-amber-800"
                >
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
