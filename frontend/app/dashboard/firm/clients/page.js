'use client';

import { Users } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClientTable from '@/components/dashboard/ClientTable';
import EmptyState from '@/components/common/EmptyState';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { clients as allClients } from '@/data/mockData';

export default function FirmClientsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.firmId || user.linkedId : undefined;
  const dashboard = useDashboard(ROLES.FIRM_ADMIN, linkedId);

  const cases = dashboard.cases || [];

  // Derive the firm's client list from the unique clientIds on its cases.
  const clientIds = [...new Set(cases.map((c) => c.clientId).filter(Boolean))];
  const firmClients = clientIds.map(
    (id) => allClients.find((c) => c.id === id) || { id, name: id }
  );

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Clients"
      subtitle="Clients with cases at your firm"
    >
      <section>
        {firmClients.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No clients yet"
            description="Clients appear here once your firm has cases assigned to them."
          />
        ) : (
          <ClientTable clients={firmClients} />
        )}
      </section>
    </DashboardLayout>
  );
}
