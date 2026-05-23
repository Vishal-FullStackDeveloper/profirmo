'use client';

// Email verification landing page.
// Reads ?token= from the URL and verifies it on mount. The search-params-using
// content lives in an inner component wrapped in <Suspense> so `next build`
// passes (useSearchParams requires a Suspense boundary).

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  MailCheck,
  ArrowRight,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/components/AuthProvider';
import { resendVerification } from '@/services/authService';
import { isEmail } from '@/utils/validators';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  const token = searchParams.get('token');

  // 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Resend form state.
  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendNotice, setResendNotice] = useState('');
  const [resending, setResending] = useState(false);

  // Guard so verification only ever runs once.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!token) {
      setStatus('error');
      setErrorMessage(
        'This verification link is missing its token. Please use the link from your email.'
      );
      return;
    }

    let active = true;
    (async () => {
      try {
        await verifyEmail(token);
        if (!active) return;
        setStatus('success');
        // The user is now logged in — send them to the dashboard.
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);
      } catch (err) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(
          (err && err.message) ||
            'This verification link is invalid or has expired.'
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [token, verifyEmail, router]);

  async function handleResend(e) {
    e.preventDefault();
    setResendError('');
    setResendNotice('');
    if (!resendEmail.trim()) {
      setResendError('Please enter your email address.');
      return;
    }
    if (!isEmail(resendEmail)) {
      setResendError('Enter a valid email address.');
      return;
    }
    setResending(true);
    try {
      const res = await resendVerification(resendEmail.trim());
      setResendNotice(
        (res && res.message) ||
          'If that email needs verification, a new link is on its way.'
      );
    } catch (err) {
      setResendError(
        (err && err.message) || 'Unable to send the email. Please try again.'
      );
    } finally {
      setResending(false);
    }
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
          <div className="glass rounded-2xl border border-slate-200/80 p-7 text-center shadow-card sm:p-8">
            {status === 'loading' && (
              <>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
                  <Loader2 size={26} className="animate-spin" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Verifying your email…
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Hang tight while we confirm your account.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-600">
                  <CheckCircle2 size={28} />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Email verified!
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Your account is ready. Taking you to your dashboard…
                </p>
                <div className="mt-5">
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition hover:shadow-glow"
                  >
                    Go to dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle size={28} />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  We couldn&apos;t verify your email
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  {errorMessage}
                </p>

                {/* Resend verification form */}
                <form
                  onSubmit={handleResend}
                  className="mt-6 space-y-3 text-left"
                  noValidate
                >
                  <p className="text-sm font-medium text-slate-700">
                    Need a new link? Enter your email below.
                  </p>
                  <div>
                    <input
                      type="email"
                      name="resendEmail"
                      value={resendEmail}
                      onChange={(e) => {
                        setResendEmail(e.target.value);
                        setResendError('');
                        setResendNotice('');
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
                        resendError
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'
                      }`}
                    />
                    {resendError && (
                      <p className="mt-1 text-xs text-red-600">
                        {resendError}
                      </p>
                    )}
                  </div>

                  {resendNotice && (
                    <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm text-teal-700">
                      <MailCheck size={16} className="mt-0.5 shrink-0" />
                      <span>{resendNotice}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resending}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Resend verification email'
                    )}
                  </button>
                </form>

                <p className="mt-5 text-sm text-slate-600">
                  Already verified?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-teal-50">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        Loading…
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
