'use client';

// Client profile editor (inside the client dashboard shell). Wraps the shared
// PersonalInfoForm component which already handles PUT /api/profile.

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import { useAuth } from '@/components/AuthProvider';
import { getProfile } from '@/services/profileService';
import { ROLES } from '@/utils/constants';

export default function ClientProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = useCallback(
    async (refreshed) => {
      if (refreshed) setProfile(refreshed);
      await refreshUser();
    },
    [refreshUser]
  );

  return (
    <DashboardLayout
      role={ROLES.CLIENT}
      title="My profile"
      subtitle="Update your personal information and address"
    >
      {loading ? (
        <div className="h-72 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      ) : error ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700">{error}</p>
            <Button size="sm" onClick={load}>
              <RefreshCw size={14} />
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <PersonalInfoForm
          user={profile && profile.user}
          address={profile && profile.address}
          onSaved={onSaved}
        />
      )}
    </DashboardLayout>
  );
}
