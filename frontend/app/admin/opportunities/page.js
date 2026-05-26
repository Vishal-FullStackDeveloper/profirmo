'use client';

// Admin — Opportunities list.
// Every opportunity originates from a converted Lead. From the detail page
// admin can change status, add notes and finally convert the opportunity
// into a Client (creates a User row + sends a password-reset email).

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Search,
  ArrowRight,
  Filter,
  ShieldAlert,
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
import { formatDate } from '@/utils/formatters';
import {
  adminListOpportunities,
  OPPORTUNITY_STATUSES,
} from '@/services/leadService';
import { listUsers } from '@/services/adminService';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...OPPORTUNITY_STATUSES.map((s) => ({ value: s, label: s })),
];

function statusVariant(s) {
  switch (s) {
    case 'Open':
      return 'blue';
    case 'In Discussion':
      return 'amber';
    case 'Won':
      return 'green';
    case 'Lost':
      return 'red';
    case 'Converted':
      return 'emerald';
    default:
      return 'gray';
  }
}

export default function AdminOpportunitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assignees, setAssignees] = useState([]);

  const isAdmin = user && user.role === ROLES.PLATFORM_ADMIN;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, meta: m } = await adminListOpportunities({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        assignedTo: assignedTo || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
      setMeta(m || null);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, assignedTo, dateFrom, dateTo]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) load();
  }, [authLoading, isAuthenticated, isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return;
    listUsers({ role: 'platform_admin', limit: 100 })
      .then(({ data }) => setAssignees(Array.isArray(data) ? data : []))
      .catch(() => setAssignees([]));
  }, [isAdmin]);

  function applySearch(e) {
    if (e) e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  if (authLoading || !isAuthenticated) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Opportunities" />
    );
  }
  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Opportunities">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account."
          action={
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const total = (meta && meta.total) != null ? meta.total : rows.length;
  const totalPages = (meta && meta.totalPages) || 1;
  const currentPage = (meta && meta.page) || page;

  const ASSIGNEE_OPTIONS = [
    { value: '', label: 'Anyone' },
    ...assignees.map((a) => ({
      value: a.id,
      label: a.fullName || a.email,
    })),
  ];

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Opportunities"
      subtitle="Qualified leads promoted to opportunities. Convert to a client when ready."
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Filters</p>
          </div>
          <form
            onSubmit={applySearch}
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
          >
            <Input
              label="Search"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email or phone…"
            />
            <Select
              label="Status"
              name="status"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Assigned to"
              name="assignedTo"
              value={assignedTo}
              onChange={(e) => {
                setPage(1);
                setAssignedTo(e.target.value);
              }}
              options={ASSIGNEE_OPTIONS}
            />
            <div className="flex items-end">
              <Button type="submit" variant="outline" className="w-full">
                <Search size={15} />
                Apply
              </Button>
            </div>
            <Input
              label="From"
              name="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
            />
            <Input
              label="To"
              name="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
            />
          </form>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <TrendingUp size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading…'
                : `${total} opportunit${total === 1 ? 'y' : 'ies'}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 w-full animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
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
            icon={<TrendingUp size={24} />}
            title="No opportunities"
            description="Convert a qualified lead into an opportunity to see it here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/opportunities/${row.id}`}
                        className="font-medium text-slate-800 hover:text-amber-700"
                      >
                        {row.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-slate-600">{row.phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        href={`/admin/opportunities/${row.id}`}
                      >
                        <ArrowRight size={14} />
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
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
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
