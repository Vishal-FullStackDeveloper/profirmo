'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, UploadCloud } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { validateForm, professionalRegisterRules } from '@/utils/validators';
import {
  CITIES,
  PROFESSION_TYPES,
  SPECIALIZATIONS,
} from '@/utils/constants';

const cityOptions = CITIES.map((c) => ({ value: c, label: c }));
const professionOptions = PROFESSION_TYPES.map((p) => ({
  value: p,
  label: p,
}));
const specializationOptions = SPECIALIZATIONS.map((s) => ({
  value: s,
  label: s,
}));

function SectionHeading({ children }) {
  return (
    <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h2>
  );
}

export default function RegisterProfessionalPage() {
  const router = useRouter();
  const { registerProfessional } = useAuth();
  const { t } = useLanguage();
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    professionType: '',
    specialization: '',
    experience: '',
    city: '',
    languages: '',
    perMinuteRate: '',
    bio: '',
    registrationNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner('');
    const { valid, errors: errs } = validateForm(
      values,
      professionalRegisterRules
    );
    setErrors(errs);
    if (!valid) return;

    setSubmitting(true);
    try {
      await registerProfessional({
        ...values,
        experience: Number(values.experience) || 0,
        perMinuteRate: Number(values.perMinuteRate) || 0,
        languages: values.languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      });
      router.push('/dashboard/professional');
    } catch (err) {
      setBanner((err && err.message) || t('auth.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4">
          <BrandLogo variant="light" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {t('regPro.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t('regPro.subtitle')}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {banner && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{banner}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-4">
                <SectionHeading>{t('regPro.personalDetails')}</SectionHeading>
                <Input
                  label={t('auth.fullName')}
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder={t('auth.fullNamePlaceholder')}
                  error={errors.name}
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label={t('auth.email')}
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder={t('auth.emailPlaceholder')}
                    error={errors.email}
                    required
                  />
                  <Input
                    label={t('auth.phone')}
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    placeholder={t('auth.phonePlaceholder')}
                    error={errors.phone}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label={t('auth.city')}
                    name="city"
                    value={values.city}
                    onChange={handleChange}
                    options={cityOptions}
                    placeholder={t('auth.cityPlaceholder')}
                    error={errors.city}
                    required
                  />
                  <Input
                    label={t('auth.password')}
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    placeholder={t('auth.passwordPlaceholder')}
                    error={errors.password}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <SectionHeading>
                  {t('regPro.professionalProfile')}
                </SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label={t('regPro.professionType')}
                    name="professionType"
                    value={values.professionType}
                    onChange={handleChange}
                    options={professionOptions}
                    placeholder={t('regPro.professionTypePlaceholder')}
                    error={errors.professionType}
                    required
                  />
                  <Select
                    label={t('regPro.specialization')}
                    name="specialization"
                    value={values.specialization}
                    onChange={handleChange}
                    options={specializationOptions}
                    placeholder={t('regPro.specializationPlaceholder')}
                    error={errors.specialization}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label={t('regPro.experience')}
                    name="experience"
                    type="number"
                    value={values.experience}
                    onChange={handleChange}
                    placeholder={t('regPro.experiencePlaceholder')}
                    error={errors.experience}
                    min="0"
                  />
                  <Input
                    label={t('regPro.perMinuteRate')}
                    name="perMinuteRate"
                    type="number"
                    value={values.perMinuteRate}
                    onChange={handleChange}
                    placeholder={t('regPro.perMinuteRatePlaceholder')}
                    error={errors.perMinuteRate}
                    min="0"
                  />
                </div>
                <Input
                  label={t('regPro.languages')}
                  name="languages"
                  value={values.languages}
                  onChange={handleChange}
                  placeholder={t('regPro.languagesPlaceholder')}
                  hint={t('regPro.languagesHint')}
                  error={errors.languages}
                />
                <Input
                  label={t('regPro.registrationNumber')}
                  name="registrationNumber"
                  value={values.registrationNumber}
                  onChange={handleChange}
                  placeholder={t('regPro.registrationNumberPlaceholder')}
                  error={errors.registrationNumber}
                  required
                />
                <div className="w-full">
                  <label
                    htmlFor="bio"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {t('regPro.bio')}
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={values.bio}
                    onChange={handleChange}
                    placeholder={t('regPro.bioPlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <SectionHeading>
                  {t('regPro.verificationDocuments')}
                </SectionHeading>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {t('regPro.uploadTitle')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('regPro.uploadHint')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    disabled
                  >
                    {t('regPro.browseFiles')}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('auth.creating') : t('regPro.submit')}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
