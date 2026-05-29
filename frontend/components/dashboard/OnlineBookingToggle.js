'use client';

// OnlineBookingToggle — self-contained widget that reads the pro's current
// `acceptsOnlineBooking` flag and lets them flip it. Used on both the pro
// overview (/dashboard/professional) and the dedicated availability page.

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
  getProfile,
  updateProfessionalDetails,
} from '@/services/profileService';

export default function OnlineBookingToggle({ compact = false }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const detail = (profile && profile.professionalDetail) || {};
  // NULL counts as "accepting" — matches the backend default.
  const accepting = detail.acceptsOnlineBooking !== false;

  async function toggle() {
    if (saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const refreshed = await updateProfessionalDetails({
        acceptsOnlineBooking: !accepting,
      });
      if (refreshed) setProfile(refreshed);
      setNotice(
        !accepting
          ? 'Online bookings enabled. Your Book button is visible to clients.'
          : 'Online bookings paused. Clients can still view your profile but cannot book.'
      );
    } catch (err) {
      setError(err.message || 'Could not save the setting.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              accepting
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            <CalendarClock size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Online bookings
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {accepting
                ? 'On — clients can book you from your card and profile.'
                : 'Paused — the Book button is hidden across the site.'}
            </p>
            {!compact && (
              <p className="mt-1.5 max-w-prose text-xs text-slate-500">
                Toggle pauses NEW bookings only. Existing bookings, notes and
                payouts are untouched.
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Button
            size="sm"
            variant={accepting ? 'outline' : 'primary'}
            onClick={toggle}
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Saving…
              </>
            ) : accepting ? (
              'Pause bookings'
            ) : (
              'Resume bookings'
            )}
          </Button>
        </div>
      </div>

      {notice && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  );
}
