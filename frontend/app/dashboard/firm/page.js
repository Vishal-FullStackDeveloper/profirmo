'use client';

import { Users, UserCheck, Briefcase, Video, Wallet } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';
import { consultations as allConsultations } from '@/data/mockData';

export default function FirmDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.firmId || user.linkedId : undefined;
  const dashboard = useDashboard(ROLES.FIRM_ADMIN, linkedId);

  const stats = dashboard.stats || {};
  const firm = dashboard.firm || {};
  const firmProfessionals = dashboard.professionals || [];
  const cases = dashboard.cases || [];

  const proIds = firmProfessionals.map((p) => p.id);
  const firmConsultations = allConsultations.filter((c) =>
    proIds.includes(c.professionalId)
  );
  const clientCount = new Set(cases.map((c) => c.clientId)).size;

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title={
        firm.name
          ? t('dashFirm.titleNamed', { name: firm.name })
          : t('dashFirm.title')
      }
      subtitle={t('dashFirm.subtitle')}
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatsCard
            label={t('dashFirm.stat.professionals')}
            value={stats.totalProfessionals || 0}
            icon={<Users size={20} />}
            variant="blue"
          />
          <StatsCard
            label={t('dashFirm.stat.clients')}
            value={clientCount}
            icon={<UserCheck size={20} />}
            variant="green"
          />
          <StatsCard
            label={t('dashFirm.stat.totalCases')}
            value={stats.totalCases || 0}
            icon={<Briefcase size={20} />}
            variant="amber"
            hint={t('dashFirm.stat.activeCases', {
              count: stats.activeCases || 0,
            })}
          />
          <StatsCard
            label={t('dashFirm.stat.consultations')}
            value={firmConsultations.length}
            icon={<Video size={20} />}
            variant="slate"
          />
          <StatsCard
            label={t('dashFirm.stat.revenue')}
            value={formatCurrency(stats.revenue || 0)}
            icon={<Wallet size={20} />}
            variant="green"
            hint={t('dash.common.completedBookingsShort')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
