'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, RefreshCw, UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClientTable from '@/components/dashboard/ClientTable';
import AddClientModal from '@/components/dashboard/AddClientModal';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { getLawFirmClients } from '@/services/profileService';
import { ROLES } from '@/utils/constants';

export default function FirmClientsPage() {
  const [clients, setClients] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getLawFirmClients();
      setClients(Array.isArray(data && data.items) ? data.items : []);
      setMemberCount(Number(data && data.memberCount) || 0);
    } catch (err) {
      setLoadError(err.message || 'Failed to load firm clients.');
      setClients([]);
      setMemberCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdded(result) {
    if (result && result.inviteSent) {
      setInviteNotice(
        `Invitation email sent to ${result.email}. They can claim their account from that link.`
      );
    } else {
      setInviteNotice('');
    }
    await load();
  }

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Clients"
      subtitle="Clients of every professional in your firm"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Users size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading clients…'
                : `${clients.length} client${
                    clients.length === 1 ? '' : 's'
                  } across ${memberCount} professional${
                    memberCount === 1 ? '' : 's'
                  }`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <UserPlus size={15} />
              Add client
            </Button>
          </div>
        </div>

        {loadError && (
          <Card>
            <p className="text-sm text-red-600">{loadError}</p>
          </Card>
        )}

        {inviteNotice && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>{inviteNotice}</span>
            <button
              type="button"
              onClick={() => setInviteNotice('')}
              className="text-emerald-700/70 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No clients yet"
            description="Add a client, or wait for professionals in your firm to add theirs — every member's clients show up here."
            action={
              <Button onClick={() => setModalOpen(true)} variant="primary">
                <UserPlus size={15} />
                Add client
              </Button>
            }
          />
        ) : (
          <ClientTable clients={clients} />
        )}
      </div>

      <AddClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleAdded}
      />
    </DashboardLayout>
  );
}
