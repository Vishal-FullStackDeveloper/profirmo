'use client';

import { useState } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import { useLanguage } from '@/components/LanguageProvider';
import reviewService from '@/services/reviewService';

/**
 * ReviewForm — a 1–5 star picker + comment box for writing a review.
 *
 * Props:
 *  - professionalId: the professional being reviewed
 *  - onSubmitted: () => void — called after a successful submission
 *  - onCancel: () => void — optional, shows a Cancel button when provided
 */
export default function ReviewForm({ professionalId, onSubmitted, onCancel }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (rating < 1) {
      setError(t('profCmp.ratingRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.create({
        professionalId,
        rating,
        comment: comment.trim(),
      });
      setRating(0);
      setComment('');
      if (typeof onSubmitted === 'function') await onSubmitted();
    } catch (err) {
      setError(err.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  }

  const shown = hover || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
    >
      <p className="text-sm font-medium text-slate-700">
        {t('profCmp.yourRating')}
      </p>
      <div className="mt-1.5 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={26}
              className={shown >= n ? 'text-amber-400' : 'text-slate-300'}
              fill="currentColor"
            />
          </button>
        ))}
      </div>

      <label
        htmlFor="review-comment"
        className="mt-4 block text-sm font-medium text-slate-700"
      >
        {t('profCmp.yourReview')}
      </label>
      <textarea
        id="review-comment"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('profCmp.reviewPlaceholder')}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        {typeof onCancel === 'function' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            {t('profCmp.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {submitting ? t('profCmp.submitting') : t('profCmp.submitReview')}
        </Button>
      </div>
    </form>
  );
}
