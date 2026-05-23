'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClientTable from '@/components/dashboard/ClientTable';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { clients } from '@/data/mockData';

export default function ProfessionalClientsPage() {
  const { user } = useAuth();
  const linkedId = user ? user.linkedId || user.firmId : undefined;
  const dashboard = useDashboard(ROLES.PROFESSIONAL, linkedId);

  const cases = dashboard.cases || [];

  const clientIds = Array.from(new Set(cases.map((c) => c.clientId)));
  const myClients = clients.filter((c) => clientIds.includes(c.id));

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="Clients"
      subtitle="People you are advising"
    >
      <ClientTable clients={myClients} />
    </DashboardLayout>
  );
}
