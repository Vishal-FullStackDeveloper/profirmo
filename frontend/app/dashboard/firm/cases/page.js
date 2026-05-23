'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CaseTable from '@/components/dashboard/CaseTable';
import ConsultationTable from '@/components/dashboard/ConsultationTable';
import FileManager from '@/components/dashboard/FileManager';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { consultations as allConsultations } from '@/data/mockData';

function SectionTitle({ title, description }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default function FirmCasesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.firmId || user.linkedId : undefined;
  const dashboard = useDashboard(ROLES.FIRM_ADMIN, linkedId);

  const firmProfessionals = dashboard.professionals || [];
  const cases = dashboard.cases || [];

  const proIds = firmProfessionals.map((p) => p.id);
  const firmConsultations = allConsultations.filter((c) =>
    proIds.includes(c.professionalId)
  );
  const caseFiles = cases.flatMap((c) => c.files || []);

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Cases"
      subtitle={t('dashFirm.cases.desc')}
    >
      <div className="space-y-8">
        {/* Cases */}
        <section>
          <SectionTitle
            title={t('dashFirm.cases.title')}
            description={t('dashFirm.cases.desc')}
          />
          <CaseTable cases={cases} />
        </section>

        {/* Consultations */}
        <section>
          <SectionTitle
            title={t('dashFirm.consultations.title')}
            description={t('dashFirm.consultations.desc')}
          />
          <ConsultationTable consultations={firmConsultations} />
        </section>

        {/* Files */}
        <section>
          <SectionTitle
            title={t('dashFirm.files.title')}
            description={t('dashFirm.files.desc')}
          />
          <FileManager files={caseFiles} />
        </section>
      </div>
    </DashboardLayout>
  );
}
