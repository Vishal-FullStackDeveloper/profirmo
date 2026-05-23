'use client';

// Admin — audit log viewer.
// Auth-guarded and admin-only (platform_admin). Lists audit-log entries
// (newest first) with action / status filters and pagination.

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScrollText,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import { formatDateTime } from '@/utils/formatters';
import { getAuditLogs } from '@/services/adminService';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
];

/** Status → Badge variant for audit-log rows. */
function statusVariant(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'success') return 'green';
  if (s === 'failure' || s === 'failed' || s === 'error') return 'red';
  return 'gray';
}

/** Render metadata defensively as a compact JSON string. */
function metadataText(metadata) {
  if (!metadata) return '';
  if (typeof metadata === 'string') return metadata;
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return '';
  }
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state. `actionInput` is the live field; `action` is the applied one.
  const [actionInput, setActionInput] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Which row's metadata is expanded.
  const [expanded, setExpanded] = useState(null);

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
      const { data, meta: m } = await getAuditLogs({
        page,
        limit: PAGE_SIZE,
        action: action || undefined,
        status: status || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
      setMeta(m || null);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, action, status]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      load();
    }
  }, [authLoading, isAuthenticated, isAdmin, load]);

  // ----- Filter handlers ---------------------------------------------------

  function applyAction(e) {
    if (e) e.preventDefault();
    setPage(1);
    setExpanded(null);
    setAction(actionInput.trim());
  }

  function changeStatus(e) {
    setPage(1);
    setExpanded(null);
    setStatus(e.target.value);
  }

  // ----- Guards ------------------------------------------------------------

  if (authLoading || !isAuthenticated) {
    return <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Audit logs" />;
  }

  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Audit logs">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to view audit logs."
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
      title="Audit logs"
      subtitle="Every security-relevant event on the platform, newest first"
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <form
              onSubmit={applyAction}
              className="flex flex-1 items-end gap-2"
            >
              <Input
                label="Action"
                name="log-action"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="e.g. login, user.suspend…"
              />
              <Button type="submit" variant="outline">
                <Search size={15} />
                Filter
              </Button>
            </form>
            <Select
              label="Status"
              name="log-status"
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
              <ScrollText size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading audit logs…'
                : `${total} log entr${total === 1 ? 'y' : 'ies'}`}
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
            icon={<ScrollText size={24} />}
            title="No audit logs found"
            description="No log entries match your current filters. Try adjusting the action or status."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">IP address</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => {
                    const meta2 = metadataText(row.metadata);
                    const key = row.id || `${row.action}-${i}`;
                    const isOpen = expanded === key;
                    return (
                      <Fragment key={key}>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {row.action || '—'}
                            {row.entity && (
                              <span className="ml-1 text-xs text-slate-400">
                                · {row.entity}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(row.status)}>
                              {row.status || 'unknown'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.userId || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.ipAddress || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {meta2 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded(isOpen ? null : key)
                                }
                                className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
                              >
                                {isOpen ? 'Hide' : 'View'}
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                        {isOpen && meta2 && (
                          <tr className="bg-slate-50">
                            <td colSpan={6} className="px-4 py-3">
                              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                                {meta2}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((row, i) => {
                const meta2 = metadataText(row.metadata);
                const key = row.id || `${row.action}-${i}`;
                const isOpen = expanded === key;
                return (
                  <Card key={key}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800">
                        {row.action || '—'}
                      </p>
                      <Badge variant={statusVariant(row.status)}>
                        {row.status || 'unknown'}
                      </Badge>
                    </div>
                    <dl className="mt-2 space-y-1 text-xs text-slate-500">
                      <div className="flex justify-between gap-2">
                        <dt>Time</dt>
                        <dd className="text-slate-700">
                          {formatDateTime(row.createdAt)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>User</dt>
                        <dd className="text-slate-700">
                          {row.userId || '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>IP</dt>
                        <dd className="text-slate-700">
                          {row.ipAddress || '—'}
                        </dd>
                      </div>
                    </dl>
                    {meta2 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : key)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
                        >
                          {isOpen ? 'Hide details' : 'View details'}
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                            {meta2}
                          </pre>
                        )}
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
    </DashboardLayout>
  );
}
