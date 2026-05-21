'use client';

import { SlidersHorizontal } from 'lucide-react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useLanguage } from '@/components/LanguageProvider';
import {
  CITIES,
  PROFESSION_TYPES,
  SPECIALIZATIONS,
  LANGUAGES,
  EXPERIENCE_RANGES,
  RATE_RANGES,
} from '@/utils/constants';

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

/**
 * ProfessionalFilters — sticky sidebar filter panel.
 *
 * Props: { params, setParams }
 */
export default function ProfessionalFilters({ params = {}, setParams }) {
  const { t } = useLanguage();
  const update = (patch) => setParams((prev) => ({ ...prev, ...patch }));

  const RATING_OPTIONS = [
    { value: '', label: t('profCmp.anyRating') },
    { value: '3', label: t('profCmp.rating3') },
    { value: '4', label: t('profCmp.rating4') },
    { value: '4.5', label: t('profCmp.rating45') },
  ];

  const handleExperience = (value) => {
    const range = EXPERIENCE_RANGES.find((r) => r.value === value);
    update({
      experience: value,
      minExperience: range && range.value !== 'any' ? range.min : undefined,
      maxExperience:
        range && range.value !== 'any' && Number.isFinite(range.max)
          ? range.max
          : undefined,
    });
  };

  const handleRate = (value) => {
    const range = RATE_RANGES.find((r) => r.value === value);
    update({
      rateRange: value,
      minRate: range && range.value !== 'any' ? range.min : undefined,
      maxRate:
        range && range.value !== 'any' && Number.isFinite(range.max)
          ? range.max
          : undefined,
    });
  };

  const clearAll = () => {
    setParams({ sort: params.sort });
  };

  return (
    <Card className="lg:sticky lg:top-20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            {t('profCmp.filters')}
          </h2>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {t('profCmp.clearAll')}
        </button>
      </div>

      <div className="space-y-4">
        <Input
          label={t('profCmp.search')}
          name="search"
          value={params.search || ''}
          onChange={(e) => update({ search: e.target.value })}
          placeholder={t('profCmp.searchPlaceholder')}
        />

        <Select
          label={t('profCmp.city')}
          name="city"
          value={params.city || ''}
          onChange={(e) => update({ city: e.target.value || undefined })}
          options={[
            { value: '', label: t('profCmp.allCities') },
            ...toOptions(CITIES),
          ]}
        />

        <Select
          label={t('profCmp.profession')}
          name="professionType"
          value={params.professionType || ''}
          onChange={(e) =>
            update({ professionType: e.target.value || undefined })
          }
          options={[
            { value: '', label: t('profCmp.allProfessions') },
            ...toOptions(PROFESSION_TYPES),
          ]}
        />

        <Select
          label={t('profCmp.specialization')}
          name="specialization"
          value={params.specialization || ''}
          onChange={(e) =>
            update({ specialization: e.target.value || undefined })
          }
          options={[
            { value: '', label: t('profCmp.allSpecializations') },
            ...toOptions(SPECIALIZATIONS),
          ]}
        />

        <Select
          label={t('profCmp.experience')}
          name="experience"
          value={params.experience || 'any'}
          onChange={(e) => handleExperience(e.target.value)}
          options={EXPERIENCE_RANGES.map((r) => ({
            value: r.value,
            label: r.label,
          }))}
        />

        <Select
          label={t('profCmp.ratePerMinute')}
          name="rateRange"
          value={params.rateRange || 'any'}
          onChange={(e) => handleRate(e.target.value)}
          options={RATE_RANGES.map((r) => ({ value: r.value, label: r.label }))}
        />

        <Select
          label={t('profCmp.minRating')}
          name="minRating"
          value={params.minRating || ''}
          onChange={(e) => update({ minRating: e.target.value || undefined })}
          options={RATING_OPTIONS}
        />

        <Select
          label={t('profCmp.language')}
          name="language"
          value={params.language || ''}
          onChange={(e) => update({ language: e.target.value || undefined })}
          options={[
            { value: '', label: t('profCmp.anyLanguage') },
            ...toOptions(LANGUAGES),
          ]}
        />

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
          <input
            type="checkbox"
            checked={params.availableNow === true}
            onChange={(e) =>
              update({ availableNow: e.target.checked ? true : undefined })
            }
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">
            {t('profCmp.availableNowOnly')}
          </span>
        </label>
      </div>
    </Card>
  );
}
