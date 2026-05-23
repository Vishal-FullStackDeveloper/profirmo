'use client';

// Admin — pending firm approvals list.
// Auth-guarded and admin-only (platform_admin). Lists every law firm
// awaiting approval and links to the per-firm review page.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/formatters';
import { listPendingFirms } from '@/services/adminService';

/** Resolve a firm name from a defensively-shaped approval row. */
function firmName(row) {
  if (!row) return 'Unknown firm';
  return (
    row.firmName ||
    row.name ||
    (row.lawFirm && (row.lawFirm.name || row.lawFirm.firmName)) ||
    (row.firm && (row.firm.name || row.firm.firmName)) ||
    'Unknown firm'
  );
}

/** Resolve an owner display name from a defensively-shaped approval row. */
function ownerName(row) {
  if (!row) return '';
  const owner = row.owner || row.user || {};
  if (row.ownerName) return row.ownerName;
  if (owner.fullName) return owner.fullName;
  const parts = [owner.firstName, owner.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return row.ownerFullName || '';
}

/** Resolve an owner email from a defensively-shaped approval row. */
function ownerEmail(row) {
  if (!row) return '';
  const owner = row.owner || row.user || {};
  return row.ownerEmail || owner.email || '';
}

/** Status → { label, variant } for the approval status badge. */
function statusBadge(status) {
  if (status === 'MODIFICATIONS_REQUESTED') {
    return { label: 'Resubmitted', variant: 'blue' };
  }
  return { label: 'Pending approval', variant: 'amber' };
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-24 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function AdminFirmsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const { data } = await listPendingFirms({ page: 1, limit: 100 });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load pending firms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      load();
    }
  }, [authLoading, isAuthenticated, isAdmin, load]);

  // While auth resolves, DashboardLayout renders its own skeleton shell.
  if (authLoading || !isAuthenticated) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Firm approvals" />
    );
  }

  // Authenticated, but not an admin — show an access-denied state.
  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Firm approvals">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to view firm approvals."
          action={
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Firm approvals"
      subtitle="Review and decide on law firms awaiting verification"
    >
      <div className="space-y-6">
        {/* Header row with count + refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Building2 size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading firms…'
                : `${rows.length} firm${
                    rows.length === 1 ? '' : 's'
                  } awaiting review`}
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
            icon={<Building2 size={24} />}
            title="No pending approvals"
            description="There are no firms awaiting review right now. New firm registrations will appear here."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Firm</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const badge = statusBadge(row.status);
                    const name = firmName(row);
                    const owner = ownerName(row);
                    const email = ownerEmail(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-semibold text-white">
                              {getInitials(name)}
                            </span>
                            <p className="truncate font-medium text-slate-800">
                              {name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">
                            {owner || '—'}
                          </p>
                          {email && (
                            <p className="truncate text-xs text-slate-500">
                              {email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(row.submittedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {row.resubmissionCount > 0 && (
                            <span className="ml-2 text-xs text-slate-400">
                              ×{row.resubmissionCount}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" href={`/admin/firms/${row.id}`}>
                            <Eye size={15} />
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((row) => {
                const badge = statusBadge(row.status);
                const name = firmName(row);
                const owner = ownerName(row);
                const email = ownerEmail(row);
                return (
                  <Card key={row.id}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-semibold text-white">
                        {getInitials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {owner ? `${owner}${email ? ' · ' : ''}` : ''}
                          {email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Submitted {formatDate(row.submittedAt)}
                          {row.resubmissionCount > 0 &&
                            ` · resubmitted ×${row.resubmissionCount}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        href={`/admin/firms/${row.id}`}
                        className="w-full"
                      >
                        <Eye size={15} />
                        Review firm
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
