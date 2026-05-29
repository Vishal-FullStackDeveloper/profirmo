'use client';

// Admin — review management.
// Auth-guarded and admin-only (platform_admin). Lists every review on the
// platform with filters and pagination, and lets an admin edit or delete
// any review.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Star,
  Pencil,
  Trash2,
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
import { listReviews, updateReview, deleteReview } from '@/services/adminService';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNDER_APPEAL', label: 'Under appeal' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '4', label: '4★ & up' },
  { value: '3', label: '3★ & up' },
  { value: '2', label: '2★ & up' },
  { value: '1', label: '1★ & up' },
];

// Review kinds are normalised on the backend. Surfacing them lets the admin
// split out professional-profile reviews (the only ones that drive public
// ratings) from booking-anchored reviews (consultation / client).
const KIND_OPTIONS = [
  { value: '', label: 'All kinds' },
  { value: 'professional', label: 'Reviews of professional' },
  { value: 'consultation', label: 'Reviews on consultation' },
  { value: 'client', label: 'Reviews on client (legacy)' },
];

const KIND_VARIANT = {
  professional: 'blue',
  consultation: 'amber',
  client: 'gray',
};

const KIND_LABEL = {
  professional: 'Of professional',
  consultation: 'On consultation',
  client: 'On client',
};

const RATING_SELECT_OPTIONS = [
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

/** Status → { label, variant } for the review status badge. */
function statusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PUBLISHED') return { label: 'Published', variant: 'green' };
  if (s === 'UNDER_APPEAL') return { label: 'Under appeal', variant: 'amber' };
  return { label: status || 'Unknown', variant: 'gray' };
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-16 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state.
  const [status, setStatus] = useState('');
  const [minRating, setMinRating] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);

  // Edit modal.
  const [editTarget, setEditTarget] = useState(null); // review row
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Delete modal.
  const [deleteTarget, setDeleteTarget] = useState(null); // review row

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
      const { data, meta: m } = await listReviews({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        minRating: minRating || undefined,
        kind: kind || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
      setMeta(m || null);
    } catch (err) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [page, status, minRating, kind]);

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

  function changeMinRating(e) {
    setPage(1);
    setMinRating(e.target.value);
  }

  function changeKind(e) {
    setPage(1);
    setKind(e.target.value);
  }

  // ----- Edit action -------------------------------------------------------

  function openEdit(row) {
    setActionError('');
    setEditRating(Number(row.rating) || 5);
    setEditComment(row.comment || '');
    setEditTarget(row);
  }

  async function confirmEdit() {
    if (!editTarget || submitting) return;
    setSubmitting(true);
    setActionError('');
    try {
      await updateReview(editTarget.id, {
        rating: Number(editRating),
        comment: editComment.trim(),
      });
      setEditTarget(null);
      await load();
    } catch (err) {
      setActionError(err.message || 'Failed to update the review.');
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Delete action -----------------------------------------------------

  function openDelete(row) {
    setActionError('');
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget || submitting) return;
    setSubmitting(true);
    setActionError('');
    try {
      await deleteReview(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setActionError(err.message || 'Failed to delete the review.');
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Guards ------------------------------------------------------------

  if (authLoading || !isAuthenticated) {
    return <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Reviews" />;
  }

  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Reviews">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to manage reviews."
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
      title="Reviews"
      subtitle="View, edit or remove any review on the platform"
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Kind"
              name="review-kind"
              value={kind}
              onChange={changeKind}
              options={KIND_OPTIONS}
            />
            <Select
              label="Status"
              name="review-status"
              value={status}
              onChange={changeStatus}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Minimum rating"
              name="review-min-rating"
              value={minRating}
              onChange={changeMinRating}
              options={RATING_OPTIONS}
            />
          </div>
        </Card>

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <MessageSquare size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading reviews…'
                : `${total} review${total === 1 ? '' : 's'}`}
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
            icon={<MessageSquare size={24} />}
            title="No reviews found"
            description="No reviews match your current filters. Try adjusting the filters."
          />
        ) : (
          <>
            {/* Desktop table — wrapped in overflow-x-auto so it stays
                readable on mid-width screens between mobile-cards and
                full-width desktop. */}
            <div className="hidden rounded-xl border border-slate-200 bg-white md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Professional</th>
                      <th className="px-4 py-3 font-semibold">Reviewer</th>
                      <th className="px-4 py-3 font-semibold">Rating</th>
                      <th className="px-4 py-3 font-semibold">Comment</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const badge = statusBadge(row.status);
                      const reviewKind = String(
                        row.kind || 'professional'
                      ).toLowerCase();
                      return (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <Badge
                                variant={KIND_VARIANT[reviewKind] || 'gray'}
                              >
                                {KIND_LABEL[reviewKind] || reviewKind}
                              </Badge>
                              {row.bookingId && (
                                <span
                                  title={`Booking ${row.bookingId}`}
                                  className="font-mono text-[10px] text-slate-500"
                                >
                                  bk · {String(row.bookingId).slice(-8)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="truncate font-medium text-slate-800">
                              {row.professionalName ||
                                row.professionalId ||
                                '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.clientName || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <RatingStars rating={row.rating} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <p className="max-w-xs truncate">
                              {row.comment || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(row.date || row.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(row)}
                                title="Edit"
                                aria-label="Edit"
                              >
                                <Pencil size={15} />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => openDelete(row)}
                                title="Delete"
                                aria-label="Delete"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((row) => {
                const badge = statusBadge(row.status);
                const reviewKind = String(
                  row.kind || 'professional'
                ).toLowerCase();
                return (
                  <Card key={row.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant={KIND_VARIANT[reviewKind] || 'gray'}>
                            {KIND_LABEL[reviewKind] || reviewKind}
                          </Badge>
                          {row.bookingId && (
                            <span
                              title={`Booking ${row.bookingId}`}
                              className="font-mono text-[10px] text-slate-500"
                            >
                              bk · {String(row.bookingId).slice(-8)}
                            </span>
                          )}
                        </div>
                        <p className="truncate font-medium text-slate-800">
                          {row.professionalName || row.professionalId || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          by {row.clientName || '—'}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="mt-2">
                      <RatingStars rating={row.rating} size="sm" />
                    </div>
                    {row.comment && (
                      <p className="mt-2 text-sm text-slate-600">
                        {row.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(row.date || row.createdAt)}
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(row)}
                        title="Edit"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openDelete(row)}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
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

      {/* Edit review modal */}
      <Modal
        open={!!editTarget}
        onClose={() => !submitting && setEditTarget(null)}
        title="Edit review"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmEdit}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        {editTarget && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEditRating(n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    className="rounded-md p-1 transition-colors hover:bg-slate-100"
                  >
                    <Star
                      size={24}
                      fill="currentColor"
                      className={
                        n <= editRating
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium text-slate-700">
                  {editRating} / 5
                </span>
              </div>
              <div className="mt-2">
                <Select
                  name="edit-rating-select"
                  value={String(editRating)}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  options={RATING_SELECT_OPTIONS}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="edit-review-comment"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Comment
              </label>
              <textarea
                id="edit-review-comment"
                name="edit-review-comment"
                rows={4}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Review comment…"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}
        {actionError && (
          <p className="mt-3 text-xs text-red-600">{actionError}</p>
        )}
      </Modal>

      {/* Delete review confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !submitting && setDeleteTarget(null)}
        title="Delete review"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete this review? This cannot be undone.
        </p>
        {actionError && (
          <p className="mt-3 text-xs text-red-600">{actionError}</p>
        )}
      </Modal>
    </DashboardLayout>
  );
}
