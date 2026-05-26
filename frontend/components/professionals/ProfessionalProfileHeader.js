'use client';

import { MapPin, BadgeCheck, Briefcase, ShieldCheck, Building2 } from 'lucide-react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import RatingStars from '@/components/common/RatingStars';
import { useLanguage } from '@/components/LanguageProvider';
import { formatCurrency } from '@/utils/formatters';

/**
 * ProfessionalProfileHeader — large header panel on a professional profile.
 * Uses the API detail shape (professionalType, yearsOfExperience,
 * consultationFee, profilePhoto, languages, designation, organization).
 *
 * Props: { professional }
 */
export default function ProfessionalProfileHeader({ professional }) {
  const { t } = useLanguage();
  if (!professional) return null;

  const {
    id,
    name,
    professionalType,
    designation,
    organization,
    city,
    practiceCities,
    subCategories,
    profilePhoto,
    yearsOfExperience,
    languages = [],
    rating,
    reviewsCount,
    consultationFee,
    availableNow,
    verified,
    lawyer,
    tax,
  } = professional;

  const subs = Array.isArray(subCategories) ? subCategories : [];
  const practice = Array.isArray(practiceCities)
    ? practiceCities.filter(Boolean)
    : [];
  const otherPractice = practice.filter(
    (c) => String(c).toLowerCase() !== String(city || '').toLowerCase()
  );

  const isLegal = /lawyer|advocate/i.test(professionalType || '');
  const regLabel = isLegal ? t('profCmp.regBar') : t('profCmp.regTax');
  // Registration number lives in the lawyer/tax sub-objects on the detail shape.
  const registrationNumber =
    (lawyer && (lawyer.barRegistrationNumber || lawyer.registrationNumber)) ||
    (tax && (tax.registrationNumber || tax.membershipNumber)) ||
    null;

  return (
    <Card>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar
            src={profilePhoto}
            name={name}
            size="xl"
            className="rounded-2xl"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              {verified && (
                <Badge variant="blue">
                  <BadgeCheck size={13} className="mr-1" />
                  {t('profCmp.verified')}
                </Badge>
              )}
              {availableNow ? (
                <Badge variant="green">{t('profCmp.availableNow')}</Badge>
              ) : (
                <Badge variant="gray">{t('profCmp.offline')}</Badge>
              )}
            </div>
            <p className="mt-1 text-base font-semibold text-blue-700">
              {professionalType}
            </p>
            {designation && (
              <p className="text-sm text-slate-500">{designation}</p>
            )}

            {subs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subs.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              {city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-slate-400" />
                  {city}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={15} className="text-slate-400" />
                {t('profCmp.yearsExperience', {
                  count: yearsOfExperience || 0,
                })}
              </span>
              {organization && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={15} className="text-slate-400" />
                  {organization}
                </span>
              )}
              <RatingStars
                rating={rating || 0}
                count={reviewsCount || 0}
                size="sm"
              />
            </div>

            {otherPractice.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                  <MapPin size={12} className="text-slate-400" />
                  Also practises in
                </span>
                {otherPractice.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-teal-50 px-2.5 py-0.5 font-medium text-teal-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {languages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}

            {registrationNumber && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-500" />
                {regLabel}{' '}
                <span className="font-medium text-slate-700">
                  {registrationNumber}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 rounded-xl bg-slate-50 p-5 text-center lg:w-56">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t('profCmp.consultationRate')}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(consultationFee)}
          </p>
          <Button
            href={`/booking/${id}`}
            variant="primary"
            size="md"
            className="mt-4 w-full"
          >
            {t('profCmp.bookConsultation')}
          </Button>
          <p className="mt-2 text-xs text-slate-400">
            {t('profCmp.payOnlyMinutes')}
          </p>
        </div>
      </div>
    </Card>
  );
}
