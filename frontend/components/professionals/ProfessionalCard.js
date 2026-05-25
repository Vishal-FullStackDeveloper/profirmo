'use client';

import { MapPin, BadgeCheck, Briefcase } from 'lucide-react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import RatingStars from '@/components/common/RatingStars';
import { useLanguage } from '@/components/LanguageProvider';
import { formatCurrency, slugify } from '@/utils/formatters';

/**
 * ProfessionalCard — summary card for a single professional.
 * Renders the API shape: name, professionalType, specialization, city,
 * profilePhoto, yearsOfExperience, consultationFee, rating, reviewsCount,
 * availableNow, verified.
 *
 * Props: { professional }
 */
export default function ProfessionalCard({ professional }) {
  const { t } = useLanguage();
  if (!professional) return null;

  const {
    id,
    name,
    professionalType,
    specialization,
    city,
    profilePhoto,
    yearsOfExperience,
    rating,
    reviewsCount,
    consultationFee,
    availableNow,
    verified,
  } = professional;

  return (
    <Card hover className="flex h-full flex-col">
      <div className="flex items-start gap-4">
        <Avatar src={profilePhoto} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {name}
            </h3>
            {verified && (
              <BadgeCheck
                size={16}
                className="shrink-0 text-blue-600"
                aria-label={t('profCmp.verified')}
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-blue-700">
            {professionalType}
          </p>
          {specialization && (
            <p className="truncate text-xs text-slate-500">{specialization}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {city && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-slate-400" />
            {city}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Briefcase size={14} className="text-slate-400" />
          {t('profCmp.yrsExp', { count: yearsOfExperience || 0 })}
        </span>
      </div>

      <div className="mt-3">
        <RatingStars rating={rating || 0} count={reviewsCount || 0} size="sm" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-base font-semibold text-slate-900">
            {formatCurrency(consultationFee)}
          </p>
          <p className="text-xs text-slate-400">
            {t('profCmp.consultationRate')}
          </p>
        </div>
        {availableNow ? (
          <Badge variant="green">{t('profCmp.availableNow')}</Badge>
        ) : (
          <Badge variant="gray">{t('profCmp.offline')}</Badge>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          href={`/professionals/${id}${
            slugify(name) ? `/${slugify(name)}` : ''
          }`}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {t('profCmp.viewProfile')}
        </Button>
        <Button
          href={`/booking/${id}`}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          {t('profCmp.bookNow')}
        </Button>
      </div>
    </Card>
  );
}
