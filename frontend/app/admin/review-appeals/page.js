'use client';

// Admin — review appeal management.
// Auth-guarded and admin-only (platform_admin). Lists appeals professionals
// have raised against reviews, and lets an admin accept (remove the review)
// or reject (keep the review public) each appeal.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flag,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Select';
import EmptyState from '@/components/common/EmptyState';
import RatingStars from '@/components/common/RatingStars';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { listReviewAppeals, resolveReviewAppeal } from '@/services/adminService';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All appeals' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
];

/** Status → { label, variant } for the appeal status badge. */
function statusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PENDING') return { label: 'Pending', variant: 'amber' };
  if (s === 'ACCEPTED') return { label: 'Accepted', variant: 'green' };
  if (s === 'REJECTED') return { label: 'Rejected', variant: 'red' };
  return { label: status || 'Unknown', variant: 'gray' };
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-40 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function AdminReviewAppealsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state. Default to PENDING — that is what admins act on.
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);

  // Resolve modal: { appeal, decision } where decision is 'accept' | 'reject'.
  const [target, setTarget] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const isAdmin = user && user.role === ROLES.PLATFORM_ADMIN;

  // Redirect unauthenticated visitors once auth has resolved.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, meta: m } = await listReviewAppeals({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
      setMeta(m || null);
    } catch (err) {
      setError(err.message || 'Failed to load review appeals.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      load();
    }
  }, [authLoading, isAuthenticated, isAdmin, load]);

  // ----- Filter handlers ---------------------------------------------------

  function changeStatus(e) {
    setPage(1);
    setStatus(e.target.value);
  }

  // ----- Resolve action ----------------------------------------------------

  function openResolve(appeal, decision) {
    setActionError('');
    setAdminNote('');
    setTarget({ appeal, decision });
  }

  async function confirmResolve() {
    if (!target || submitting) return;
    setSubmitting(true);
    setActionError('');
    try {
      await resolveReviewAppeal(target.appeal.id, {
        decision: target.decision,
        adminNote: adminNote.trim(),
      });
      setTarget(null);
      await load();
    } catch (err) {
      setActionError(err.message || 'Failed to resolve the appeal.');
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Guards ------------------------------------------------------------

  if (authLoading || !isAuthenticated) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Review Appeals" />
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Review Appeals">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to manage review appeals."
          action={
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const totalPages = (meta && meta.totalPages) || 1;
  const total = (meta && meta.total) != null ? meta.total : rows.length;
  const currentPage = (meta && meta.page) || page;

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Review Appeals"
      subtitle="Professionals' appeals against reviews they believe are wrong"
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Select
              label="Status"
              name="appeal-status"
              value={status}
              onChange={changeStatus}
              options={STATUS_OPTIONS}
              className="lg:w-56"
            />
          </div>
        </Card>

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Flag size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading appeals…'
                : `${total} appeal${total === 1 ? '' : 's'}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </span>
              <p className="text-sm font-medium text-slate-700">{error}</p>
              <Button size="sm" onClick={load}>
                <RefreshCw size={15} />
                Try again
              </Button>
            </div>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Flag size={24} />}
            title="No appeals found"
            description="No review appeals match your current filter."
          />
        ) : (
          <>
            {/* Appeal list */}
            <div className="space-y-4">
              {rows.map((appeal) => {
                const badge = statusBadge(appeal.status);
                const isPending =
                  String(appeal.status || '').toUpperCase() === 'PENDING';
                const review = appeal.review;
                return (
                  <Card key={appeal.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Appeal for
                        </p>
                        <p className="font-medium text-slate-800">
                          {appeal.professionalName ||
                            appeal.professionalId ||
                            'Unknown professional'}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    {/* Appeal reason */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500">
                        Reason for appeal
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {appeal.reason || '—'}
                      </p>
                    </div>

                    {/* Appealed review */}
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Appealed review
                      </p>
                      {review ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">
                              {review.clientName || 'Unknown reviewer'}
                            </span>
                            <RatingStars
                              rating={review.rating}
                              size="sm"
                            />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600">
                              {review.comment}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            {formatDate(review.date)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          The review is no longer available.
                        </p>
                      )}
                    </div>

                    {/* Resolution details for resolved appeals */}
                    {!isPending && (
                      <div className="mt-3 space-y-1">
                        {appeal.adminNote && (
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">
                              Admin note:{' '}
                            </span>
                            {appeal.adminNote}
                          </p>
                        )}
                        {appeal.resolvedAt && (
                          <p className="text-xs text-slate-400">
                            Resolved {formatDate(appeal.resolvedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pending actions */}
                    {isPending && (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => openResolve(appeal, 'accept')}
                        >
                          <CheckCircle2 size={15} />
                          Accept appeal (remove review)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openResolve(appeal, 'reject')}
                        >
                          <XCircle size={15} />
                          Reject appeal (keep review)
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={loading || currentPage <= 1}
                >
                  <ChevronLeft size={15} />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={loading || currentPage >= totalPages}
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Resolve appeal modal */}
      <Modal
        open={!!target}
        onClose={() => !submitting && setTarget(null)}
        title={
          target && target.decision === 'accept'
            ? 'Accept appeal'
            : 'Reject appeal'
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant={
                target && target.decision === 'accept'
                  ? 'danger'
                  : 'primary'
              }
              size="sm"
              onClick={confirmResolve}
              disabled={submitting}
            >
              {submitting
                ? 'Working…'
                : target && target.decision === 'accept'
                ? 'Confirm accept'
                : 'Confirm reject'}
            </Button>
          </>
        }
      >
        {target && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {target.decision === 'accept' ? (
                <>
                  Accepting this appeal will{' '}
                  <strong>permanently delete the review</strong>. The review
                  will no longer be visible to anyone on the platform.
                </>
              ) : (
                <>
                  Rejecting this appeal will{' '}
                  <strong>restore the review to public</strong>. It will
                  remain visible on the professional&apos;s profile.
                </>
              )}
            </p>
            <div>
              <label
                htmlFor="appeal-admin-note"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Admin note (optional)
              </label>
              <textarea
                id="appeal-admin-note"
                name="appeal-admin-note"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note explaining this decision…"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}
        {actionError && (
          <p className="mt-3 text-xs text-red-600">{actionError}</p>
        )}
      </Modal>
    </DashboardLayout>
  );
}
