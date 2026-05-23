'use client';

// ProfileDropdown — reusable authenticated-user avatar + dropdown panel.
// Driven entirely by useAuth().user. Used by the site Header and the
// dashboard top bar.

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  User,
  Pencil,
  LayoutDashboard,
  LogOut,
  Mail,
  CalendarDays,
  Building2,
  Inbox,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { formatDate } from '@/utils/formatters';
import Avatar from '@/components/common/Avatar';

// Map a backend role to a human-readable label.
const ROLE_LABELS = {
  client: 'Client',
  professional: 'Professional',
  firm_admin: 'Law Firm',
  firm_professional: 'Firm Professional',
  platform_admin: 'Admin',
};

function roleLabel(role) {
  return ROLE_LABELS[role] || 'Member';
}

// Build a display name from the user record.
function userDisplayName(user) {
  return (
    (user && (user.fullName || user.name)) ||
    [user && user.firstName, user && user.lastName]
      .filter(Boolean)
      .join(' ') ||
    ''
  );
}

// Core account actions — dashboard + the role-aware profile pages.
const MENU_ACTIONS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'View Profile', href: '/profile', icon: User },
  { label: 'Edit Profile', href: '/profile/edit', icon: Pencil },
];

// Firm management actions — shown for professional-type roles. Harmless
// elsewhere (the pages themselves guard access).
const FIRM_ACTIONS = [
  { label: 'My Firm', href: '/firm', icon: Building2 },
  { label: 'Firm Invitations', href: '/invitations', icon: Inbox },
];

// Roles that can own, join or be invited to a firm.
const FIRM_ROLES = ['professional', 'firm_professional', 'firm_admin'];

export default function ProfileDropdown({ className = '' }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return undefined;
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!user) return null;

  const fullName =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    'Account';
  const firstName = user.firstName || fullName.split(/\s+/)[0];
  const showFirmActions = FIRM_ROLES.includes(user.role);

  async function handleLogout() {
    close();
    await logout();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-teal-300 hover:bg-slate-50"
      >
        <span className="relative">
          <Avatar
            src={user.profilePhoto}
            name={userDisplayName(user)}
            size="sm"
            className="ring-2 ring-white"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-teal-500 ring-2 ring-white"
            aria-hidden="true"
          />
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-slate-700 sm:block">
          {firstName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="glass absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200/80 shadow-card-lg"
        >
          {/* Profile card */}
          <div className="bg-gradient-to-br from-amber-50 to-teal-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.profilePhoto}
                name={fullName}
                size="lg"
                className="ring-2 ring-white"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {fullName}
                </p>
                <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              {user.memberSince && (
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  Member since {formatDate(user.memberSince)}
                </p>
              )}
              {user.email && (
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <span className="font-medium text-teal-700">Online</span>
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-200/80" />

          {/* Menu actions */}
          <div className="py-1.5">
            {MENU_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  role="menuitem"
                  onClick={close}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {action.label}
                </Link>
              );
            })}

            {showFirmActions && (
              <>
                <div className="my-1.5 h-px bg-slate-200/80" />
                {FIRM_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      role="menuitem"
                      onClick={close}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      {action.label}
                    </Link>
                  );
                })}
              </>
            )}

            <div className="my-1.5 h-px bg-slate-200/80" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
