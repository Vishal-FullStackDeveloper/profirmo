'use client';

// Received firm invitations — Phase 8.
// Auth-guarded. Renders Header + content + Footer. Fetches
// GET /api/invitations/mine and lets the user accept or reject each pending
// invitation.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import {
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} from '@/services/firmService';
import { resolveFileUrl } from '@/services/fileService';
import { formatDate } from '@/utils/formatters';

const ROLE_LABELS = {
  owner: 'Owner',
  'co-owner': 'Co-owner',
  member: 'Member',
};

function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'Member';
}

const ROLE_VARIANTS = {
  owner: 'amber',
  'co-owner': 'blue',
  member: 'gray',
};

function InvitationsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-56 animate-pulse rounded bg-slate-100" />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-28 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

// Firm logo (resolved) or a placeholder tile.
function FirmLogo({ firm }) {
  const logo = firm && firm.logo;
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveFileUrl(logo)}
        alt={firm.firmName || 'Firm logo'}
        className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
      />
    );
  }
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-teal-600 text-white">
      <Building2 className="h-6 w-6" />
    </div>
  );
}

export default function InvitationsPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);

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
      const list = await getMyInvitations();
      setInvitations(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Could not load your invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, load]);

  async function handleAccept(inv) {
    setFeedback(null);
    setBusyId(inv.id);
    try {
      await acceptInvitation(inv.id);
      const firmName = (inv.firm && inv.firm.firmName) || 'the firm';
      setFeedback({
        type: 'success',
        message: `You have joined ${firmName}. Visit "My Firm" to see your team.`,
      });
      setInvitations((list) => list.filter((i) => i.id !== inv.id));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not accept the invitation.',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(inv) {
    setFeedback(null);
    setBusyId(inv.id);
    try {
      await rejectInvitation(inv.id);
      setFeedback({ type: 'success', message: 'Invitation declined.' });
      setInvitations((list) => list.filter((i) => i.id !== inv.id));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not decline the invitation.',
      });
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">
          <InvitationsSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {loading ? (
          <InvitationsSkeleton />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Firm invitations
                </h1>
                <p className="text-sm text-slate-500">
                  Invitations from firms that want you on their team.
                </p>
              </div>
              <Button href="/firm" variant="outline" size="sm">
                <Building2 className="h-4 w-4" />
                My firm
              </Button>
            </div>

            {feedback && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {feedback.message}
              </div>
            )}

            {error ? (
              <EmptyState
                icon={<AlertCircle size={24} />}
                title="Could not load your invitations"
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
            ) : invitations.length === 0 ? (
              <EmptyState
                icon={<Mail size={24} />}
                title="No pending invitations"
                description="You have no firm invitations right now."
              />
            ) : (
              <div className="space-y-4">
                {invitations.map((inv) => {
                  const firm = inv.firm || {};
                  const busy = busyId === inv.id;
                  return (
                    <Card key={inv.id}>
                      <div className="flex flex-wrap items-start gap-4">
                        <FirmLogo firm={firm} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold text-slate-900">
                              {firm.firmName || 'A firm'}
                            </h2>
                            <Badge
                              variant={ROLE_VARIANTS[inv.role] || 'gray'}
                            >
                              {roleLabel(inv.role)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            You have been invited to join as a{' '}
                            {roleLabel(inv.role).toLowerCase()}.
                          </p>
                          {inv.createdAt && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              Invited on {formatDate(inv.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => handleReject(inv)}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Reject
                        </Button>
                        <Button
                          disabled={busy}
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => handleAccept(inv)}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Accept
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
