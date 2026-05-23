'use client';

// Role-based profile EDIT page.
// Auth-guarded. Renders Header + tabbed forms + Footer. Loads
// GET /api/profile to prefill, then renders role-appropriate forms in
// separated Card sections / tabs. Firm management lives on the dedicated
// /firm hub (Phase 8), so this page only links there.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Briefcase,
  Building2,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import { getProfile } from '@/services/profileService';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import ProfessionalForm from '@/components/profile/ProfessionalForm';

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-48 animate-pulse rounded bg-slate-100" />
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="h-72 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function ProfileEditPage() {
  const router = useRouter();
  const {
    user: authUser,
    loading: authLoading,
    isAuthenticated,
    refreshUser,
  } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Route guard.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

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
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, load]);

  // After a personal-info save: refresh local profile + the header user.
  const handlePersonalSaved = useCallback(
    async (refreshed) => {
      if (refreshed) setProfile(refreshed);
      await refreshUser();
    },
    [refreshUser]
  );

  const handleProfessionalSaved = useCallback((refreshed) => {
    if (refreshed) setProfile(refreshed);
  }, []);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">
          <EditSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  const user = (profile && profile.user) || authUser || {};
  const role = user.role;
  const isProfessional =
    role === 'professional' || role === 'firm_professional';
  const isFirmAdmin = role === 'firm_admin';
  // Roles that can own / join / be invited to a firm.
  const canUseFirm = isProfessional || isFirmAdmin;

  // Build the list of tabs for this role.
  const tabs = [{ key: 'personal', label: 'Personal', icon: User }];
  if (isProfessional) {
    tabs.push({ key: 'professional', label: 'Professional', icon: Briefcase });
  }
  if (canUseFirm) {
    tabs.push({ key: 'firm', label: 'Firm', icon: Building2 });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {loading ? (
          <EditSkeleton />
        ) : error ? (
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <EmptyState
              icon={<AlertCircle size={24} />}
              title="Could not load your profile"
              description={error}
              action={
                <Button
                  onClick={load}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Retry
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Edit profile
                </h1>
                <p className="text-sm text-slate-500">
                  Update your account information.
                </p>
              </div>
              <Button href="/profile" variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to profile
              </Button>
            </div>

            {/* Tabs */}
            {tabs.length > 1 && (
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Personal information */}
            {activeTab === 'personal' && (
              <PersonalInfoForm
                user={user}
                address={profile && profile.address}
                onSaved={handlePersonalSaved}
              />
            )}

            {/* Professional details */}
            {activeTab === 'professional' && isProfessional && (
              <ProfessionalForm
                professionalDetail={profile && profile.professionalDetail}
                lawyerDetail={profile && profile.lawyerDetail}
                techDetail={profile && profile.techDetail}
                onSaved={handleProfessionalSaved}
              />
            )}

            {/* Firm — now managed on the dedicated /firm hub */}
            {activeTab === 'firm' && canUseFirm && (
              <Card>
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-700">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Firm management has moved
                  </h2>
                  <p className="max-w-md text-sm text-slate-500">
                    Create your firm, edit its profile, manage members and
                    handle invitations on the dedicated firm hub.
                  </p>
                  <Button
                    href="/firm"
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Go to My Firm
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
