'use client';

import Link from 'next/link';
import {
  CalendarClock,
  Briefcase,
  CheckCircle2,
  Wallet,
  CreditCard,
  Settings,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ConsultationTable from '@/components/dashboard/ConsultationTable';
import CaseTable from '@/components/dashboard/CaseTable';
import FileManager from '@/components/dashboard/FileManager';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import RatingStars from '@/components/common/RatingStars';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { formatCurrency, formatRate } from '@/utils/formatters';
import Avatar from '@/components/common/Avatar';
import { professionals } from '@/data/mockData';

function SectionTitle({ title, description, action }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export default function ClientDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.linkedId || user.firmId : undefined;
  const dashboard = useDashboard(ROLES.CLIENT, linkedId);

  const stats = dashboard.stats || {};
  const consultations = dashboard.consultations || [];
  const cases = dashboard.cases || [];

  const upcoming = consultations.filter(
    (c) => c.callStatus === 'scheduled' || c.callStatus === 'ongoing'
  );
  const past = consultations.filter((c) => c.callStatus === 'ended');
  const favorites = professionals.slice(0, 3);
  const caseFiles = cases.flatMap((c) => c.files || []);

  return (
    <DashboardLayout
      role={ROLES.CLIENT}
      title={t('dashClient.title')}
      subtitle={
        user && user.name
          ? t('dash.common.welcomeBackName', { name: user.name })
          : t('dash.common.welcomeBack')
      }
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t('dashClient.stat.upcomingBookings')}
            value={stats.upcomingBookings || 0}
            icon={<CalendarClock size={20} />}
            variant="blue"
            hint={t('dash.common.confirmedPending')}
          />
          <StatsCard
            label={t('dashClient.stat.activeCases')}
            value={stats.activeCases || 0}
            icon={<Briefcase size={20} />}
            variant="amber"
            hint={t('dash.common.inProgress')}
          />
          <StatsCard
            label={t('dashClient.stat.completedConsultations')}
            value={stats.completedConsultations || 0}
            icon={<CheckCircle2 size={20} />}
            variant="green"
          />
          <StatsCard
            label={t('dashClient.stat.totalSpent')}
            value={formatCurrency(stats.totalSpent || 0)}
            icon={<Wallet size={20} />}
            variant="slate"
            hint={t('dash.common.completedBookings')}
          />
        </div>

        {/* Upcoming consultations */}
        <section>
          <SectionTitle
            title={t('dashClient.upcoming.title')}
            description={t('dashClient.upcoming.desc')}
            action={
              <Button variant="outline" size="sm" href="/professionals">
                {t('dashClient.upcoming.bookNew')}
              </Button>
            }
          />
          <ConsultationTable
            consultations={upcoming}
            emptyTitle={t('dashClient.upcoming.emptyTitle')}
            emptyDescription={t('dashClient.upcoming.emptyDesc')}
          />
        </section>

        {/* Past consultations */}
        <section>
          <SectionTitle
            title={t('dashClient.past.title')}
            description={t('dashClient.past.desc')}
          />
          <ConsultationTable
            consultations={past}
            emptyTitle={t('dashClient.past.emptyTitle')}
            emptyDescription={t('dashClient.past.emptyDesc')}
          />
        </section>

        {/* Favorites + payments */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionTitle
              title={t('dashClient.favorites.title')}
              description={t('dashClient.favorites.desc')}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {favorites.map((pro) => (
                <Card key={pro.id} hover>
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={pro.profilePhoto || pro.avatar || pro.photo}
                      name={pro.name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {pro.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {pro.professionType} · {pro.city}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <RatingStars
                          rating={pro.rating}
                          count={pro.reviewsCount}
                          size="sm"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {formatRate(pro.perMinuteRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    href={`/professionals/${pro.id}`}
                  >
                    {t('dashClient.favorites.viewProfile')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title={t('dashClient.payments.title')} />
            <Card>
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CreditCard size={22} />
                </span>
                <p className="text-sm font-medium text-slate-700">
                  {t('dashClient.payments.heading')}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('dashClient.payments.desc')}
                </p>
                <Button variant="ghost" size="sm" className="mt-3" disabled>
                  {t('dashClient.payments.download')}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Documents */}
        <section>
          <SectionTitle
            title={t('dashClient.documents.title')}
            description={t('dashClient.documents.desc')}
          />
          <FileManager files={caseFiles} />
        </section>

        {/* Cases */}
        <section>
          <SectionTitle
            title={t('dashClient.cases.title')}
            description={t('dashClient.cases.desc')}
          />
          <CaseTable cases={cases} />
        </section>

        {/* Profile settings */}
        <section>
          <SectionTitle title={t('dashClient.profile.title')} />
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user && user.profilePhoto}
                  name={user && user.name ? user.name : 'Guest'}
                  size="md"
                />
                <div>
                  <p className="font-medium text-slate-800">
                    {user && user.name
                      ? user.name
                      : t('dash.layout.guestUser')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {user && user.email
                      ? user.email
                      : t('dashClient.profile.notSignedIn')}
                  </p>
                  <Badge variant="blue" className="mt-1">
                    {t('dashClient.profile.accountBadge')}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Settings size={15} />
                {t('dashClient.profile.manage')}
              </Button>
            </div>
          </Card>
        </section>

        <div className="flex justify-center">
          <Link
            href="/professionals"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {t('dashClient.explore')}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
