'use client';

// Full notifications page — paginated list of every notification (read +
// unread) for the signed-in user. The NotificationBell dropdown deep-links
// here via "See all".

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import {
  listNotificationsPaginated,
  markRead,
  markAllRead,
} from '@/services/notificationService';
import { formatRelative } from '@/utils/formatters';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  // Bounce unauthenticated visitors to the login page.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/notifications');
    }
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError('');
      try {
        const data = await listNotificationsPaginated({
          page: targetPage,
          limit: 20,
        });
        setItems(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        setError(
          (err && err.message) ||
            'Unable to load notifications. Please retry.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) load(1);
  }, [authLoading, isAuthenticated, load]);

  async function handleItemClick(item) {
    if (!item.isRead) {
      setItems((list) =>
        list.map((n) =>
          n.id === item.id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      try {
        await markRead(item.id);
      } catch {
        // Optimistic — the next page load will reconcile.
      }
    }
    if (item.link) router.push(item.link);
  }

  async function handleMarkAll() {
    if (markingAll) return;
    setMarkingAll(true);
    const now = new Date().toISOString();
    setItems((list) =>
      list.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }))
    );
    try {
      await markAllRead();
    } catch {
      // Ignore — optimistic update stays.
    } finally {
      setMarkingAll(false);
    }
  }

  const filtered = items.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });
  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Bell size={18} />
                </span>
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? 'Loading…'
                  : total === 0
                    ? 'You have no notifications yet.'
                    : `${total} total · ${unreadCount} unread on this page`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(page)}
                disabled={loading}
              >
                <RefreshCw size={14} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleMarkAll}
                disabled={markingAll || unreadCount === 0}
              >
                <CheckCheck size={14} />
                {markingAll ? 'Marking…' : 'Mark all read'}
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <Filter size={12} className="ml-2 text-slate-400" />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <Card>
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={22} />
                </span>
                <p className="text-sm font-medium text-slate-700">{error}</p>
                <Button size="sm" onClick={() => load(page)}>
                  <RefreshCw size={14} />
                  Try again
                </Button>
              </div>
            </Card>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BellOff size={24} />}
              title={
                filter === 'unread'
                  ? 'No unread notifications'
                  : filter === 'read'
                    ? 'No read notifications on this page'
                    : 'No notifications yet'
              }
              description="When something happens — a new booking, case update, or review — it will show up here."
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      item.isRead
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-amber-200 bg-amber-50/60 hover:border-amber-300'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.isRead ? 'bg-transparent' : 'bg-amber-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          item.isRead
                            ? 'font-medium text-slate-700'
                            : 'font-semibold text-slate-900'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.message && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {item.message}
                        </span>
                      )}
                      <span className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatRelative(item.createdAt)}</span>
                        {item.type && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 capitalize text-slate-500">
                            {item.type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </span>
                    </span>
                    {item.isRead && (
                      <Check
                        size={14}
                        className="mt-1 shrink-0 text-slate-300"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
              <Button
                size="sm"
                variant="outline"
                onClick={() => load(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => load(page + 1)}
                disabled={page >= totalPages || loading}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          )}

          {loading && (
            <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              Loading…
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
