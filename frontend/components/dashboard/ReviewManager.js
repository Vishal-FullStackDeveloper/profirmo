'use client';

import { Star, ShieldAlert, Clock, Flag } from 'lucide-react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import RatingStars from '@/components/common/RatingStars';
import EmptyState from '@/components/common/EmptyState';
import Avatar from '@/components/common/Avatar';
import { useLanguage } from '@/components/LanguageProvider';
import { formatDate } from '@/utils/formatters';

/**
 * ReviewManager — average rating summary plus a list of review cards. Each
 * card lets the professional appeal a review they believe is wrong.
 *
 * Props:
 *  - reviews: Array — each may carry `status` and `appeal` ({ status, ... }).
 *  - onAppeal: (review) => void — opens the appeal flow for a review.
 */
export default function ReviewManager({ reviews, onAppeal }) {
  const { t } = useLanguage();
  const list = reviews || [];

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Star size={24} />}
        title={t('dash.reviews.emptyTitle')}
        description={t('dash.reviews.emptyDesc')}
      />
    );
  }

  // The public average uses only published reviews (appealed ones are hidden).
  const published = list.filter((r) => r.status !== 'UNDER_APPEAL');
  const total = published.reduce(
    (sum, r) => sum + (Number(r.rating) || 0),
    0
  );
  const average =
    published.length > 0
      ? Math.round((total / published.length) * 10) / 10
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: published.filter(
      (r) => Math.round(Number(r.rating) || 0) === star
    ).length,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="text-center sm:w-40 sm:border-r sm:border-slate-200">
            <p className="text-4xl font-bold text-slate-900">
              {average.toFixed(1)}
            </p>
            <div className="mt-1 flex justify-center">
              <RatingStars rating={average} size="md" showValue={false} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {published.length === 1
                ? t('dash.reviews.reviewOne', { count: published.length })
                : t('dash.reviews.reviewMany', { count: published.length })}
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count }) => {
              const pct = published.length
                ? (count / published.length) * 100
                : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-slate-500">
                    {t('dash.reviews.starLabel', { star })}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-slate-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {list.map((review) => {
          const appeal = review.appeal || null;
          const isPending =
            review.status === 'UNDER_APPEAL' ||
            (appeal && appeal.status === 'PENDING');
          const isRejected = appeal && appeal.status === 'REJECTED';

          return (
            <Card key={review.id}>
              <div className="flex items-start gap-3">
                <Avatar
                  src={review.clientPhoto}
                  name={review.clientName}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">
                      {review.clientName || t('dash.reviews.anonymous')}
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatDate(review.date || review.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <RatingStars rating={review.rating} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-slate-600">
                      {review.comment}
                    </p>
                  )}

                  {/* Appeal state / action */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isPending ? (
                      <>
                        <Badge variant="amber">
                          <Clock size={12} className="mr-1" />
                          {t('dash.reviews.appealPending')}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {t('dash.reviews.hiddenNote')}
                        </span>
                      </>
                    ) : isRejected ? (
                      <>
                        <Badge variant="gray">
                          {t('dash.reviews.appealRejected')}
                        </Badge>
                        {appeal && appeal.adminNote && (
                          <span className="text-xs text-slate-500">
                            {t('dash.reviews.appealNote')}:{' '}
                            {appeal.adminNote}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAppeal && onAppeal(review)}
                        >
                          <Flag size={14} />
                          {t('dash.reviews.appealAgain')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAppeal && onAppeal(review)}
                      >
                        <ShieldAlert size={14} />
                        {t('dash.reviews.appeal')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
