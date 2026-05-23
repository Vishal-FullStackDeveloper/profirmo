'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReviewManager from '@/components/dashboard/ReviewManager';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import RatingStars from '@/components/common/RatingStars';
import { useLanguage } from '@/components/LanguageProvider';
import reviewService from '@/services/reviewService';
import { ROLES } from '@/utils/constants';

export default function ProfessionalReviewsPage() {
  const { t } = useLanguage();

  // Real reviews for this professional, fetched from the API.
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [appealTarget, setAppealTarget] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealError, setAppealError] = useState('');

  const loadMyReviews = useCallback(async () => {
    try {
      const data = await reviewService.getMine();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch {
      setMyReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyReviews();
  }, [loadMyReviews]);

  function openAppeal(review) {
    setAppealError('');
    setAppealReason('');
    setAppealTarget(review);
  }

  async function submitAppeal() {
    if (!appealTarget || !appealReason.trim()) return;
    setAppealSubmitting(true);
    setAppealError('');
    try {
      await reviewService.appeal(appealTarget.id, appealReason.trim());
      setAppealTarget(null);
      setAppealReason('');
      await loadMyReviews();
    } catch (err) {
      setAppealError(err.message || 'Could not submit your appeal.');
    } finally {
      setAppealSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="Reviews & Appeals"
      subtitle="Reviews clients left for you — appeal any that are wrong"
    >
      <section>
        {reviewsLoading ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
            <div className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          </div>
        ) : (
          <ReviewManager reviews={myReviews} onAppeal={openAppeal} />
        )}
      </section>

      {/* Appeal-a-review modal */}
      <Modal
        open={!!appealTarget}
        onClose={() => !appealSubmitting && setAppealTarget(null)}
        title={t('dash.reviews.appealTitle')}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppealTarget(null)}
              disabled={appealSubmitting}
            >
              {t('dash.reviews.appealCancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitAppeal}
              disabled={appealSubmitting || !appealReason.trim()}
            >
              {appealSubmitting
                ? t('dash.reviews.appealSubmitting')
                : t('dash.reviews.appealSubmit')}
            </Button>
          </>
        }
      >
        {appealTarget && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">
                  {appealTarget.clientName || t('dash.reviews.anonymous')}
                </p>
                <RatingStars rating={appealTarget.rating} size="sm" />
              </div>
              {appealTarget.comment && (
                <p className="mt-1 text-sm text-slate-600">
                  {appealTarget.comment}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="appeal-reason"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {t('dash.reviews.appealReasonLabel')}
              </label>
              <textarea
                id="appeal-reason"
                rows={4}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder={t('dash.reviews.appealReasonPlaceholder')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            {appealError && (
              <p className="text-xs text-red-600">{appealError}</p>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
