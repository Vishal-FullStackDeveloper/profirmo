'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Building2, AlertCircle } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import EmptyState from '@/components/common/EmptyState';
import ProfessionalCard from '@/components/professionals/ProfessionalCard';
import FirmCard from '@/components/firms/FirmCard';
import { useLanguage } from '@/components/LanguageProvider';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useFirms } from '@/hooks/useFirms';
import {
  PROFESSION_TYPES,
  CITIES,
  EXPERIENCE_RANGES,
  RATE_RANGES,
} from '@/utils/constants';

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

const INITIAL_FILTERS = {
  keyword: '',
  category: '',
  location: '',
  experience: 'any',
  rating: '',
  availableNow: false,
  rateRange: 'any',
};

export default function SearchPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState('individual');
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const RATING_OPTIONS = [
    { value: '', label: t('searchPage.anyRating') },
    { value: '3', label: t('searchPage.rating3') },
    { value: '4', label: t('searchPage.rating4') },
    { value: '4.5', label: t('searchPage.rating45') },
  ];

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch }));
  const resetFilters = () => setFilters(INITIAL_FILTERS);

  // Translate the UI filter state into API query params for each hook.
  const proParams = useMemo(() => {
    const expRange = EXPERIENCE_RANGES.find(
      (r) => r.value === filters.experience
    );
    const rateRange = RATE_RANGES.find((r) => r.value === filters.rateRange);
    return {
      search: filters.keyword || undefined,
      professionType: filters.category || undefined,
      city: filters.location || undefined,
      minRating: filters.rating || undefined,
      availableNow: filters.availableNow || undefined,
      experience:
        expRange && expRange.value !== 'any' ? expRange.value : undefined,
      minExperience:
        expRange && expRange.value !== 'any' ? expRange.min : undefined,
      maxExperience:
        expRange && expRange.value !== 'any' && Number.isFinite(expRange.max)
          ? expRange.max
          : undefined,
      minFee: rateRange && rateRange.value !== 'any' ? rateRange.min : undefined,
      maxFee:
        rateRange && rateRange.value !== 'any' && Number.isFinite(rateRange.max)
          ? rateRange.max
          : undefined,
    };
  }, [filters]);

  const firmParams = useMemo(
    () => ({
      search: filters.keyword || undefined,
      city: filters.location || undefined,
      minRating: filters.rating || undefined,
    }),
    [filters]
  );

  const {
    items: professionals,
    loading: proLoading,
    error: proError,
    setParams: setProParams,
  } = useProfessionals(proParams);
  const {
    items: firms,
    loading: firmLoading,
    error: firmError,
    setParams: setFirmParams,
  } = useFirms(firmParams);

  // Push the latest filter-derived params into whichever hook is active.
  // (The hooks re-fetch whenever their params change.)
  useEffect(() => {
    if (mode === 'individual') setProParams(proParams);
  }, [mode, proParams, setProParams]);
  useEffect(() => {
    if (mode === 'firm') setFirmParams(firmParams);
  }, [mode, firmParams, setFirmParams]);

  const isIndividual = mode === 'individual';
  const loading = isIndividual ? proLoading : firmLoading;
  const error = isIndividual ? proError : firmError;
  const results = isIndividual ? professionals : firms;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t('searchPage.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {t('searchPage.subtitle')}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="mb-6">
            {/* Mode toggle */}
            <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMode('individual')}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'individual'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users size={16} />
                {t('searchPage.individuals')}
              </button>
              <button
                type="button"
                onClick={() => setMode('firm')}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'firm'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 size={16} />
                {t('searchPage.firms')}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label={t('searchPage.keyword')}
                name="keyword"
                value={filters.keyword}
                onChange={(e) => update({ keyword: e.target.value })}
                placeholder={t('searchPage.keywordPlaceholder')}
              />
              <Select
                label={t('searchPage.category')}
                name="category"
                value={filters.category}
                onChange={(e) => update({ category: e.target.value })}
                options={[
                  { value: '', label: t('searchPage.allCategories') },
                  ...toOptions(PROFESSION_TYPES),
                ]}
              />
              <Select
                label={t('searchPage.location')}
                name="location"
                value={filters.location}
                onChange={(e) => update({ location: e.target.value })}
                options={[
                  { value: '', label: t('searchPage.allCities') },
                  ...toOptions(CITIES),
                ]}
              />
              <Select
                label={t('searchPage.experience')}
                name="experience"
                value={filters.experience}
                onChange={(e) => update({ experience: e.target.value })}
                options={EXPERIENCE_RANGES.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
              />
              <Select
                label={t('searchPage.minRating')}
                name="rating"
                value={filters.rating}
                onChange={(e) => update({ rating: e.target.value })}
                options={RATING_OPTIONS}
              />
              <Select
                label={t('searchPage.priceRange')}
                name="rateRange"
                value={filters.rateRange}
                onChange={(e) => update({ rateRange: e.target.value })}
                options={RATE_RANGES.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 ${
                  mode === 'firm' ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.availableNow}
                  disabled={mode === 'firm'}
                  onChange={(e) => update({ availableNow: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  {t('searchPage.availableNowOnly')}
                </span>
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {t('searchPage.resetFilters')}
              </button>
            </div>
          </Card>

          <p className="mb-4 text-sm text-slate-600">
            {loading ? (
              t('profList.loadingShort')
            ) : (
              <>
                <span className="font-semibold text-slate-900">
                  {results.length}
                </span>{' '}
                {isIndividual
                  ? results.length === 1
                    ? t('searchPage.profCountOne')
                    : t('searchPage.profCountOther')
                  : results.length === 1
                    ? t('searchPage.firmCountOne')
                    : t('searchPage.firmCountOther')}
              </>
            )}
          </p>

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Search size={24} />}
              title={t('searchPage.emptyTitle')}
              description={t('searchPage.emptyDesc')}
            />
          ) : isIndividual ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {professionals.map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {firms.map((firm) => (
                <FirmCard key={firm.id} firm={firm} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
