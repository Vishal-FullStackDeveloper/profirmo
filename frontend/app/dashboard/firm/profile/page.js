'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import LawFirmForm from '@/components/profile/LawFirmForm';
import { ROLES } from '@/utils/constants';
import { getLawFirm } from '@/services/profileService';

export default function FirmProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lawFirm, setLawFirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getLawFirm();
      setLawFirm((res && res.lawFirm) || null);
    } catch (err) {
      setError(err.message || 'Could not load your firm profile.');
      setLawFirm(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Firm Profile"
      subtitle="Manage your law firm's profile and contact details"
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : error ? (
        <Card>
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </Card>
      ) : (
        <LawFirmForm lawFirm={lawFirm} onSaved={() => load()} />
      )}
    </DashboardLayout>
  );
}
