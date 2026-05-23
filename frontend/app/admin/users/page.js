'use client';

// Admin — user management.
// Auth-guarded and admin-only (platform_admin). Lists every platform user
// with filters and pagination, and lets an admin suspend / activate accounts.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/formatters';
import { listUsers, updateUserStatus } from '@/services/adminService';

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'client', label: 'Client' },
  { value: 'professional', label: 'Professional' },
  { value: 'firm_admin', label: 'Firm admin' },
  { value: 'firm_professional', label: 'Firm professional' },
  { value: 'platform_admin', label: 'Platform admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending_verification', label: 'Pending verification' },
];

const ROLE_LABELS = {
  client: 'Client',
  professional: 'Professional',
  firm_admin: 'Firm admin',
  firm_professional: 'Firm professional',
  platform_admin: 'Platform admin',
};

/** Build a display name from a user row. */
function userName(u) {
  if (!u) return 'Unknown user';
  if (u.fullName) return u.fullName;
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : u.email || 'Unknown user';
}

/** Status → { label, variant } for the user status badge. */
function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active') return { label: 'Active', variant: 'green' };
  if (s === 'suspended') return { label: 'Suspended', variant: 'red' };
  if (s === 'pending_verification') {
    return { label: 'Pending verification', variant: 'amber' };
  }
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

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state. `searchInput` is the live field; `search` is the applied one.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Confirm modal for suspend / activate.
  const [target, setTarget] = useState(null); // { user, nextStatus }
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
      const { data, meta: m } = await listUsers({
        page,
        limit: PAGE_SIZE,
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
      setMeta(m || null);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, role, status, search]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      load();
    }
  }, [authLoading, isAuthenticated, isAdmin, load]);

  // ----- Filter handlers ---------------------------------------------------

  function applySearch(e) {
    if (e) e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changeRole(e) {
    setPage(1);
    setRole(e.target.value);
  }

  function changeStatus(e) {
    setPage(1);
    setStatus(e.target.value);
  }

  // ----- Status action -----------------------------------------------------

  function openConfirm(row) {
    const nextStatus = row.status === 'active' ? 'suspended' : 'active';
    setActionError('');
    setTarget({ user: row, nextStatus });
  }

  async function confirmAction() {
    if (!target || submitting) return;
    setSubmitting(true);
    setActionError('');
    try {
      await updateUserStatus(target.user.id, target.nextStatus);
      setTarget(null);
      await load();
    } catch (err) {
      setActionError(err.message || 'Failed to update the user.');
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Guards ------------------------------------------------------------

  if (authLoading || !isAuthenticated) {
    return <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Users" />;
  }

  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Users">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to manage users."
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
      title="Users"
      subtitle="Browse, filter and manage every account on the platform"
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <form
              onSubmit={applySearch}
              className="flex flex-1 items-end gap-2"
            >
              <Input
                label="Search"
                name="user-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email or mobile…"
              />
              <Button type="submit" variant="outline">
                <Search size={15} />
                Search
              </Button>
            </form>
            <Select
              label="Role"
              name="user-role"
              value={role}
              onChange={changeRole}
              options={ROLE_OPTIONS}
              className="lg:w-52"
            />
            <Select
              label="Status"
              name="user-status"
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
              <Users size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading users…'
                : `${total} user${total === 1 ? '' : 's'}`}
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
            icon={<Users size={24} />}
            title="No users found"
            description="No accounts match your current filters. Try adjusting the search or filters."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const name = userName(row);
                    const badge = statusBadge(row.status);
                    const isSelf = user && row.id === user.id;
                    const canToggle =
                      !isSelf &&
                      (row.status === 'active' ||
                        row.status === 'suspended');
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
                              {getInitials(name)}
                            </span>
                            <p className="truncate font-medium text-slate-800">
                              {name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.email || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="gray">
                            {ROLE_LABELS[row.role] || row.role || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span className="text-xs text-slate-400">
                              You
                            </span>
                          ) : canToggle ? (
                            <Button
                              size="sm"
                              variant={
                                row.status === 'active'
                                  ? 'danger'
                                  : 'outline'
                              }
                              onClick={() => openConfirm(row)}
                            >
                              {row.status === 'active' ? (
                                <>
                                  <Ban size={15} />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={15} />
                                  Activate
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
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
                const name = userName(row);
                const badge = statusBadge(row.status);
                const isSelf = user && row.id === user.id;
                const canToggle =
                  !isSelf &&
                  (row.status === 'active' || row.status === 'suspended');
                return (
                  <Card key={row.id}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                        {getInitials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {row.email || '—'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="gray">
                            {ROLE_LABELS[row.role] || row.role || '—'}
                          </Badge>
                          <Badge variant={badge.variant}>
                            {badge.label}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Joined {formatDate(row.createdAt)}
                        </p>
                      </div>
                    </div>
                    {isSelf ? (
                      <p className="mt-3 text-xs text-slate-400">
                        This is your account.
                      </p>
                    ) : canToggle ? (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant={
                            row.status === 'active' ? 'danger' : 'outline'
                          }
                          onClick={() => openConfirm(row)}
                          className="w-full"
                        >
                          {row.status === 'active' ? (
                            <>
                              <Ban size={15} />
                              Suspend user
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={15} />
                              Activate user
                            </>
                          )}
                        </Button>
                      </div>
                    ) : null}
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

      {/* Suspend / activate confirm modal */}
      <Modal
        open={!!target}
        onClose={() => !submitting && setTarget(null)}
        title={
          target && target.nextStatus === 'suspended'
            ? 'Suspend user'
            : 'Activate user'
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
                target && target.nextStatus === 'suspended'
                  ? 'danger'
                  : 'primary'
              }
              size="sm"
              onClick={confirmAction}
              disabled={submitting}
            >
              {submitting
                ? 'Working…'
                : target && target.nextStatus === 'suspended'
                ? 'Confirm suspend'
                : 'Confirm activate'}
            </Button>
          </>
        }
      >
        {target && (
          <p className="text-sm text-slate-600">
            {target.nextStatus === 'suspended' ? (
              <>
                Suspend <strong>{userName(target.user)}</strong>? They will
                lose access until reactivated.
              </>
            ) : (
              <>
                Activate <strong>{userName(target.user)}</strong>? They will
                regain access to the platform.
              </>
            )}
          </p>
        )}
        {actionError && (
          <p className="mt-3 text-xs text-red-600">{actionError}</p>
        )}
      </Modal>
    </DashboardLayout>
  );
}
