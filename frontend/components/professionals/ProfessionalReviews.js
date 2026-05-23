'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Star, CheckCircle2, PenLine } from 'lucide-react';
import Card from '@/components/common/Card';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import RatingStars from '@/components/common/RatingStars';
import EmptyState from '@/components/common/EmptyState';
import ReviewForm from '@/components/reviews/ReviewForm';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/components/AuthProvider';
import { formatDate } from '@/utils/formatters';
import professionalService from '@/services/professionalService';

/**
 * ProfessionalReviews — review list for a professional, fetched from the API.
 * Logged-in users can write one review per professional.
 *
 * Props:
 *  - professionalId
 *  - onReviewChange: () => void — optional; called after a review is posted
 *    so the parent can refresh the professional's header rating.
 */
export default function ProfessionalReviews({
  professionalId,
  onReviewChange,
}) {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!professionalId) {
      setLoading(false);
      return;
    }
    try {
      const res = await professionalService.getReviews(professionalId);
      const data = (res && res.data) || res || [];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    setLoading(true);
    loadReviews();
  }, [loadReviews]);

  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count
      : 0;

  const isOwnProfile = Boolean(
    user && user.linkedId && user.linkedId === professionalId
  );
  const alreadyReviewed = Boolean(
    user && reviews.some((r) => r.userId && r.userId === user.id)
  );
  const canWrite = isAuthenticated && !isOwnProfile && !alreadyReviewed;

  async function handleSubmitted() {
    setFormOpen(false);
    setJustPosted(true);
    await loadReviews();
    if (typeof onReviewChange === 'function') onReviewChange();
  }

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            {t('profCmp.clientReviews')}
          </h2>
        </div>
        {!loading && count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg font-bold text-slate-900">
              {average.toFixed(1)}
            </span>
            <RatingStars rating={average} size="sm" showValue={false} />
            <span className="text-slate-500">
              {count === 1
                ? t('profCmp.reviewCountOne', { count })
                : t('profCmp.reviewCountOther', { count })}
            </span>
          </div>
        )}
      </div>

      {/* Write-a-review area */}
      {!loading && (
        <div className="mb-5">
          {justPosted && (
            <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="shrink-0" />
              {t('profCmp.reviewThanks')}
            </p>
          )}

          {canWrite ? (
            formOpen ? (
              <ReviewForm
                professionalId={professionalId}
                onSubmitted={handleSubmitted}
                onCancel={() => setFormOpen(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setJustPosted(false);
                  setFormOpen(true);
                }}
              >
                <PenLine size={15} />
                {t('profCmp.writeReview')}
              </Button>
            )
          ) : !isAuthenticated ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              <PenLine size={15} />
              {t('profCmp.loginToReview')}
            </Link>
          ) : alreadyReviewed && !justPosted ? (
            <p className="text-xs text-slate-500">
              {t('profCmp.alreadyReviewed')}
            </p>
          ) : null}
        </div>
      )}

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
          description={t('profCmp.noReviewsDesc')}
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const clientName =
              review.clientName || review.authorName || review.name || 'Client';
            return (
              <li
                key={review.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
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
