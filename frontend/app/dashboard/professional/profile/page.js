'use client';

// Professional profile editor (inside the professional dashboard shell).
// Two tabs: Personal (PUT /api/profile) and Professional (PUT
// /api/profile/professional). Both forms already exist as shared components.

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Briefcase, RefreshCw, User as UserIcon } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import ProfessionalForm from '@/components/profile/ProfessionalForm';
import { useAuth } from '@/components/AuthProvider';
import { getProfile } from '@/services/profileService';
import { ROLES } from '@/utils/constants';

const TABS = [
  { key: 'personal', label: 'Personal', icon: UserIcon },
  { key: 'professional', label: 'Professional', icon: Briefcase },
];

export default function ProfessionalProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('personal');

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

  const onPersonalSaved = useCallback(
    async (refreshed) => {
      if (refreshed) setProfile(refreshed);
      await refreshUser();
    },
    [refreshUser]
  );

  const onProfessionalSaved = useCallback((refreshed) => {
    if (refreshed) setProfile(refreshed);
  }, []);

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="My profile"
      subtitle="Update your personal info and professional details"
    >
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

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
        ) : tab === 'personal' ? (
          <PersonalInfoForm
            user={profile && profile.user}
            address={profile && profile.address}
            onSaved={onPersonalSaved}
          />
        ) : (
          <ProfessionalForm
            professionalDetail={profile && profile.professionalDetail}
            lawyerDetail={profile && profile.lawyerDetail}
            techDetail={profile && profile.techDetail}
            onSaved={onProfessionalSaved}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
