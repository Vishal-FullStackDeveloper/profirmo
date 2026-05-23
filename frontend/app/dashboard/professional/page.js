'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Wallet, Star } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import AvailabilityManager from '@/components/dashboard/AvailabilityManager';
import Card from '@/components/common/Card';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import reviewService from '@/services/reviewService';
import { ROLES } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';
import { professionals } from '@/data/mockData';

export default function ProfessionalDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const linkedId = user ? user.linkedId || user.firmId : undefined;
  const dashboard = useDashboard(ROLES.PROFESSIONAL, linkedId);

  const stats = dashboard.stats || {};

  // Real reviews for this professional, fetched from the API — used purely
  // to derive the public "Average rating" stat.
  const [myReviews, setMyReviews] = useState([]);

  const loadMyReviews = useCallback(async () => {
    try {
      const data = await reviewService.getMine();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch {
      setMyReviews([]);
    }
  }, []);

  useEffect(() => {
    loadMyReviews();
  }, [loadMyReviews]);

  // Public rating / count derived from real, published reviews.
  const publishedReviews = myReviews.filter(
    (r) => r.status !== 'UNDER_APPEAL'
  );
  const realReviewCount = publishedReviews.length;
  const realAvgRating =
    realReviewCount > 0
      ? publishedReviews.reduce(
          (sum, r) => sum + (Number(r.rating) || 0),
          0
        ) / realReviewCount
      : 0;

  const professional =
    professionals.find((p) => p.id === linkedId) || professionals[0];

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

        {/* Earnings & performance */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {t('dashPro.earnings.title')}
            </h2>
            <p className="text-sm text-slate-500">
              {t('dashPro.earnings.desc')}
            </p>
          </div>
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
              value={realAvgRating.toFixed(1)}
              icon={<Star size={20} />}
              variant="amber"
              hint={t('dashPro.stat.reviewsCount', {
                count: realReviewCount,
              })}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
