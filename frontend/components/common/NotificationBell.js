'use client';

// NotificationBell — a bell icon button with an unread-count badge and a
// dropdown panel listing recent notifications. Reusable across the public
// Header and the dashboard top bar. The parent decides when to render it
// (only when authenticated).

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '@/services/notificationService';
import { formatRelative } from '@/utils/formatters';

const POLL_INTERVAL_MS = 60000;

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const rootRef = useRef(null);

  // Poll the unread count on mount and every ~60s.
  const refreshCount = useCallback(async () => {
    try {
      const next = await getUnreadCount();
      setCount(next);
    } catch {
      /* ignore — keep the last known count */
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Load the list of notifications (when the panel opens).
  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listNotifications({ page: 1, limit: 20 });
      setItems(data);
    } catch (err) {
      setError(
        (err && err.message) || 'Unable to load notifications. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Open / close handling.
  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next) loadList();
      return next;
    });
  }

  // Close on outside click + Escape key.
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Mark a single notification read, then navigate if it has a link.
  async function handleItemClick(item) {
    if (!item.isRead) {
      setItems((list) =>
        list.map((n) =>
          n.id === item.id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setCount((c) => Math.max(0, c - 1));
      try {
        await markRead(item.id);
      } catch {
        /* optimistic — ignore failure */
      }
    }
    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  }

  async function handleMarkAll() {
    if (markingAll) return;
    setMarkingAll(true);
    const now = new Date().toISOString();
    setItems((list) =>
      list.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }))
    );
    setCount(0);
    try {
      await markAllRead();
    } catch {
      /* optimistic — ignore failure */
    } finally {
      setMarkingAll(false);
    }
  }

  const badge = count > 99 ? '99+' : String(count);
  const hasUnread = count > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell size={19} />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-amber-600 px-1 text-[10px] font-bold leading-4 text-white shadow-sm">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[20rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:w-[22rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Notifications
              </h3>
              {hasUnread && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  {badge} new
                </span>
              )}
            </div>
            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markingAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 transition hover:text-teal-800 disabled:opacity-60"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[24rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading…
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={loadList}
                  className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <Bell size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  You&apos;re all caught up
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  New notifications will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        item.isRead ? 'bg-white' : 'bg-amber-50/60'
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
                          className={`block truncate text-sm ${
                            item.isRead
                              ? 'font-medium text-slate-700'
                              : 'font-semibold text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.message && (
                          <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                            {item.message}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {formatRelative(item.createdAt)}
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
          </div>
        </div>
      )}
    </div>
  );
}
