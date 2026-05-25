'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClientTable from '@/components/dashboard/ClientTable';
import AddClientModal from '@/components/dashboard/AddClientModal';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import clientService from '@/services/clientService';
import { ROLES } from '@/utils/constants';

function unwrapList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

export default function ProfessionalClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await clientService.getAll();
      setClients(unwrapList(res));
    } catch (err) {
      setLoadError(err.message || 'Failed to load clients.');
      setClients([]);
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
      role={ROLES.PROFESSIONAL}
      title="Clients"
      subtitle="People you are advising"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {loading
              ? 'Loading clients…'
              : `${clients.length} client${clients.length === 1 ? '' : 's'}`}
          </p>
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
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
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
