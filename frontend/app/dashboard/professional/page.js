'use client';

import {
  CalendarClock,
  Briefcase,
  CheckCircle2,
  Wallet,
  Star,
  Video,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import AvailabilityManager from '@/components/dashboard/AvailabilityManager';
import ConsultationTable from '@/components/dashboard/ConsultationTable';
import ClientTable from '@/components/dashboard/ClientTable';
import CaseTable from '@/components/dashboard/CaseTable';
import FileManager from '@/components/dashboard/FileManager';
import ReviewManager from '@/components/dashboard/ReviewManager';
import Card from '@/components/common/Card';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';
import { professionals, clients } from '@/data/mockData';

function SectionTitle({ title, description }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

function PlaceholderCard({ icon, title, description }) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </span>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
      </div>
    </Card>
  );
}

export default function ProfessionalDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.linkedId || user.firmId : undefined;
  const dashboard = useDashboard(ROLES.PROFESSIONAL, linkedId);

  const stats = dashboard.stats || {};
  const consultations = dashboard.consultations || [];
  const cases = dashboard.cases || [];
  const reviews = dashboard.reviews || [];

  const professional =
    professionals.find((p) => p.id === linkedId) || professionals[0];

  const upcoming = consultations.filter(
    (c) => c.callStatus === 'scheduled' || c.callStatus === 'ongoing'
  );
  const ended = consultations.filter((c) => c.callStatus === 'ended');

  const clientIds = Array.from(new Set(cases.map((c) => c.clientId)));
  const myClients = clients.filter((c) => clientIds.includes(c.id));

  const caseFiles = cases.flatMap((c) => c.files || []);

  // Profile completion estimate.
  const fields = [
    professional.bio,
    professional.specialization,
    professional.registrationNumber,
    professional.languages && professional.languages.length,
    professional.perMinuteRate,
    professional.availabilitySlots && professional.availabilitySlots.length,
  ];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title={t('dashPro.title')}
      subtitle={
        user && user.name
          ? t('dash.common.welcomeBackName', { name: user.name })
          : t('dash.common.welcomeBack')
      }
    >
      <div className="space-y-8">
        {/* Profile completion */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {t('dashPro.completion.title')}
              </h2>
              <p className="text-sm text-slate-500">
                {t('dashPro.completion.desc')}
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {completion}%
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </Card>

        {/* Availability */}
        <AvailabilityManager professional={professional} />

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

        {/* Earnings */}
        <section>
          <SectionTitle
            title={t('dashPro.earnings.title')}
            description={t('dashPro.earnings.desc')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label={t('dashPro.stat.totalEarnings')}
              value={formatCurrency(stats.totalEarnings || 0)}
              icon={<Wallet size={20} />}
              variant="green"
              hint={t('dash.common.fromCompletedBookings')}
            />
            <StatsCard
              label={t('dashPro.stat.completedConsultations')}
              value={stats.completedConsultations || 0}
              icon={<CheckCircle2 size={20} />}
              variant="blue"
            />
            <StatsCard
              label={t('dashPro.stat.pendingBookings')}
              value={stats.pendingBookings || 0}
              icon={<CalendarClock size={20} />}
              variant="amber"
            />
            <StatsCard
              label={t('dashPro.stat.averageRating')}
              value={(stats.averageRating || 0).toFixed(1)}
              icon={<Star size={20} />}
              variant="amber"
              hint={t('dashPro.stat.reviewsCount', {
                count: stats.reviewsCount || 0,
              })}
            />
          </div>
        </section>

        {/* Clients */}
        <section>
          <SectionTitle
            title={t('dashPro.clients.title')}
            description={t('dashPro.clients.desc')}
          />
          <ClientTable clients={myClients} />
        </section>

        {/* Cases */}
        <section>
          <SectionTitle
            title={t('dashPro.cases.title')}
            description={t('dashPro.cases.desc')}
          />
          <CaseTable cases={cases} />
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

        {/* Documents */}
        <section>
          <SectionTitle
            title={t('dashPro.documents.title')}
            description={t('dashPro.documents.desc')}
          />
          <FileManager files={caseFiles} />
        </section>

        {/* Recordings & transcripts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SectionTitle title={t('dashPro.recordings.title')} />
            <PlaceholderCard
              icon={<Video size={22} />}
              title={t('dashPro.recordings.heading')}
              description={t('dashPro.recordings.desc')}
            />
          </div>
          <div>
            <SectionTitle title={t('dashPro.transcripts.title')} />
            <PlaceholderCard
              icon={<FileText size={22} />}
              title={t('dashPro.transcripts.heading')}
              description={t('dashPro.transcripts.desc')}
            />
          </div>
        </div>

        {/* Reviews */}
        <section>
          <SectionTitle
            title={t('dashPro.reviews.title')}
            description={t('dashPro.reviews.desc')}
          />
          <ReviewManager reviews={reviews} />
        </section>
      </div>
    </DashboardLayout>
  );
}
