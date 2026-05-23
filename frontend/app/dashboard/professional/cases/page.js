'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CaseTable from '@/components/dashboard/CaseTable';
import ConsultationTable from '@/components/dashboard/ConsultationTable';
import FileManager from '@/components/dashboard/FileManager';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';

function SectionTitle({ title, description }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default function ProfessionalCasesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.linkedId || user.firmId : undefined;
  const dashboard = useDashboard(ROLES.PROFESSIONAL, linkedId);

  const cases = dashboard.cases || [];
  const consultations = dashboard.consultations || [];

  const upcoming = consultations.filter(
    (c) => c.callStatus === 'scheduled' || c.callStatus === 'ongoing'
  );
  const ended = consultations.filter((c) => c.callStatus === 'ended');

  const caseFiles = cases.flatMap((c) => c.files || []);

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="Cases"
      subtitle="Matters, consultations and case files"
    >
      <div className="space-y-8">
        {/* Cases */}
        <section>
          <SectionTitle
            title={t('dashPro.cases.title')}
            description={t('dashPro.cases.desc')}
          />
          <CaseTable cases={cases} />
        </section>

        {/* Today's & upcoming consultations */}
        <section>
          <SectionTitle
            title={t('dashPro.upcoming.title')}
            description={t('dashPro.upcoming.desc')}
          />
          <ConsultationTable
            consultations={upcoming}
            emptyTitle={t('dashPro.upcoming.emptyTitle')}
            emptyDescription={t('dashPro.upcoming.emptyDesc')}
          />
        </section>

        {/* Past consultations */}
        <section>
          <SectionTitle
            title={t('dashPro.history.title')}
            description={t('dashPro.history.desc')}
          />
          <ConsultationTable
            consultations={ended}
            emptyTitle={t('dashPro.history.emptyTitle')}
            emptyDescription={t('dashPro.history.emptyDesc')}
          />
        </section>

        {/* Case files */}
        <section>
          <SectionTitle
            title={t('dashPro.documents.title')}
            description={t('dashPro.documents.desc')}
          />
          <FileManager files={caseFiles} />
        </section>
      </div>
    </DashboardLayout>
  );
}
