'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Star, ShieldAlert } from 'lucide-react';
import Card from '@/components/common/Card';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import RatingStars from '@/components/common/RatingStars';
import EmptyState from '@/components/common/EmptyState';
import { useLanguage } from '@/components/LanguageProvider';
import { formatDate } from '@/utils/formatters';
import reviewService from '@/services/reviewService';

const APPEAL_VARIANT = {
  PENDING: 'amber',
  UPHELD: 'green',
  REJECTED: 'red',
};

/**
 * FirmReviews — review list for a firm.
 *
 * Two modes:
 *   1. Self-fetch  (public pages): pass `firmId` only and the component
 *      calls `reviewService.getByFirm(firmId)` itself.
 *   2. Pre-fetched (dashboard):     pass `reviews` + `loading` and the
 *      component renders them directly. Used by /dashboard/firm/reviews
 *      where the parent resolves the firm server-side.
 *
 * Props: { firmId?, reviews?, loading?, onAppeal? }
 */
export default function FirmReviews({
  firmId,
  reviews: providedReviews,
  loading: providedLoading,
  onAppeal,
}) {
  const { t } = useLanguage();
  const isControlled = providedReviews !== undefined;
  const [internalReviews, setInternalReviews] = useState([]);
  const [internalLoading, setInternalLoading] = useState(!isControlled);
  const reviews = isControlled ? providedReviews : internalReviews;
  const loading = isControlled ? Boolean(providedLoading) : internalLoading;

  useEffect(() => {
    if (isControlled) return undefined;
    if (!firmId) {
      setInternalLoading(false);
      return undefined;
    }
    let active = true;
    setInternalLoading(true);
    (async () => {
      try {
        const res = await reviewService.getByFirm(firmId);
        const data = (res && res.data) || res || [];
        if (active) setInternalReviews(Array.isArray(data) ? data : []);
      } catch {
        if (active) setInternalReviews([]);
      } finally {
        if (active) setInternalLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [firmId, isControlled]);

  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count
      : 0;

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Reviews of our professionals
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Clients review individual professionals — a firm&apos;s rating is
            the collective rating of every professional working under it.
          </p>
        </div>
        {!loading && count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg font-bold text-slate-900">
              {average.toFixed(1)}
            </span>
            <RatingStars rating={average} size="sm" showValue={false} />
            <span className="text-slate-500">
              {count === 1
                ? t('firmDetail.reviewCountOne', { count })
                : t('firmDetail.reviewCountOther', { count })}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      ) : count === 0 ? (
        <EmptyState
          icon={<Star size={24} />}
          title={t('profCmp.noReviewYet')}
          description={t('firmDetail.noReviewsDesc')}
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const clientName =
              review.clientName || review.authorName || review.name || 'Client';
            const reviewedName = review.reviewedProfessionalName || '';
            const appeal = review.appeal;
            const canAppeal =
              typeof onAppeal === 'function' &&
              (!appeal || appeal.status === 'REJECTED');
            return (
              <li
                key={review.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                {/* Banner: which of our professionals was reviewed. The
                    firm owner needs to see this at a glance — otherwise
                    a collective list reads as anonymous. */}
                {reviewedName && (
                  <div className="-m-4 mb-3 flex items-center gap-2 rounded-t-xl border-b border-slate-100 bg-white px-4 py-2 text-xs text-slate-600">
                    <Avatar
                      src={review.reviewedProfessionalPhoto}
                      name={reviewedName}
                      size="xs"
                    />
                    <span>
                      Review of{' '}
                      <span className="font-semibold text-slate-800">
                        {reviewedName}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Avatar
                    src={review.clientPhoto || review.authorPhoto}
                    name={clientName}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {clientName}
                      </p>
                      <span className="text-xs text-slate-400">
                        {formatDate(review.date || review.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <RatingStars
                        rating={review.rating}
                        size="sm"
                        showValue={false}
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {review.comment || review.text}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                      {appeal && (
                        <Badge
                          variant={APPEAL_VARIANT[appeal.status] || 'gray'}
                        >
                          <ShieldAlert size={11} className="mr-1" />
                          Appeal {String(appeal.status || 'pending').toLowerCase()}
                        </Badge>
                      )}
                      {canAppeal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAppeal(review)}
                        >
                          {appeal && appeal.status === 'REJECTED'
                            ? 'Appeal again'
                            : 'Appeal'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
