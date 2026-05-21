'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Building2,
  CalendarClock,
  Wallet,
  ShieldCheck,
  Check,
  X,
  Flag,
  FileText,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { useLanguage } from '@/components/LanguageProvider';
import { useDashboard } from '@/hooks/useDashboard';
import { ROLES } from '@/utils/constants';
import { formatCurrency, formatDate, getInitials } from '@/utils/formatters';

const CMS_LINKS = [
  { labelKey: 'dashAdmin.cms.about', href: '/about' },
  { labelKey: 'dashAdmin.cms.howItWorks', href: '/how-it-works' },
  { labelKey: 'dashAdmin.cms.pricing', href: '/pricing' },
  { labelKey: 'dashAdmin.cms.contact', href: '/contact' },
  { labelKey: 'dashAdmin.cms.terms', href: '/terms' },
  { labelKey: 'dashAdmin.cms.privacy', href: '/privacy' },
];

function SectionTitle({ title, description }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const dashboard = useDashboard(ROLES.PLATFORM_ADMIN);
  const stats = dashboard.stats || {};

  const [pending, setPending] = useState(
    () => dashboard.pendingProfessionals || []
  );

  function resolve(id) {
    setPending((list) => list.filter((p) => p.id !== id));
  }

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title={t('dashAdmin.title')}
      subtitle={t('dashAdmin.subtitle')}
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatsCard
            label={t('dashAdmin.stat.totalClients')}
            value={stats.totalClients || 0}
            icon={<Users size={20} />}
            variant="blue"
          />
          <StatsCard
            label={t('dashAdmin.stat.professionals')}
            value={stats.totalProfessionals || 0}
            icon={<UserCheck size={20} />}
            variant="green"
            hint={t('dashAdmin.stat.pendingApprovals', {
              count: stats.pendingApprovals || 0,
            })}
          />
          <StatsCard
            label={t('dashAdmin.stat.firms')}
            value={stats.totalFirms || 0}
            icon={<Building2 size={20} />}
            variant="amber"
          />
          <StatsCard
            label={t('dashAdmin.stat.totalBookings')}
            value={stats.totalBookings || 0}
            icon={<CalendarClock size={20} />}
            variant="slate"
          />
          <StatsCard
            label={t('dashAdmin.stat.platformRevenue')}
            value={formatCurrency(stats.platformRevenue || 0)}
            icon={<Wallet size={20} />}
            variant="green"
            hint={t('dash.common.completedBookingsShort')}
          />
        </div>

        {/* Pending approvals */}
        <section>
          <SectionTitle
            title={t('dashAdmin.pending.title')}
            description={t('dashAdmin.pending.desc')}
          />
          {pending.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={24} />}
              title={t('dashAdmin.pending.emptyTitle')}
              description={t('dashAdmin.pending.emptyDesc')}
            />
          ) : (
            <div className="space-y-3">
              {pending.map((pro) => (
                <Card key={pro.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                        {getInitials(pro.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-800">
                            {pro.name}
                          </p>
                          <Badge variant="amber">
                            {t('dashAdmin.pending.badge')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {pro.professionType} · {pro.city} ·{' '}
                          {pro.experience} yrs
                        </p>
                        <p className="text-xs text-slate-400">
                          {t('dashAdmin.pending.meta', {
                            reg: pro.registrationNumber,
                            date: formatDate(pro.createdAt),
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => resolve(pro.id)}
                      >
                        <Check size={15} />
                        {t('dashAdmin.pending.approve')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => resolve(pro.id)}
                      >
                        <X size={15} />
                        {t('dashAdmin.pending.reject')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Reported reviews + revenue */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SectionTitle title={t('dashAdmin.reported.title')} />
            <Card>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Flag size={22} />
                </span>
                <p className="text-sm font-medium text-slate-700">
                  {t('dashAdmin.reported.heading')}
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  {t('dashAdmin.reported.desc')}
                </p>
              </div>
            </Card>
          </div>
          <div>
            <SectionTitle title={t('dashAdmin.revenue.title')} />
            <Card>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Wallet size={22} />
                </span>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.platformRevenue || 0)}
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  {t('dashAdmin.revenue.desc')}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* CMS management */}
        <section>
          <SectionTitle
            title={t('dashAdmin.cms.title')}
            description={t('dashAdmin.cms.desc')}
          />
          <Card>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CMS_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <FileText size={15} className="text-slate-400" />
                    {t(link.labelKey)}
                  </span>
                  <ArrowRight size={15} className="text-slate-400" />
                </Link>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
