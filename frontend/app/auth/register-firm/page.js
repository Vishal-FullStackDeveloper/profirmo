'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { validateForm, firmRegisterRules } from '@/utils/validators';
import { CITIES, FIRM_TYPES, SITE } from '@/utils/constants';

const cityOptions = CITIES.map((c) => ({ value: c, label: c }));
const firmTypeOptions = FIRM_TYPES.map((t) => ({ value: t, label: t }));

function SectionHeading({ children }) {
  return (
    <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h2>
  );
}

export default function RegisterFirmPage() {
  const router = useRouter();
  const { registerFirm } = useAuth();
  const { t } = useLanguage();
  const [values, setValues] = useState({
    name: '',
    firmType: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    address: '',
    services: '',
    professionalCount: '',
    description: '',
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
    const { valid, errors: errs } = validateForm(values, firmRegisterRules);
    setErrors(errs);
    if (!valid) return;

    setSubmitting(true);
    try {
      await registerFirm({
        ...values,
        professionalCount: Number(values.professionalCount) || 0,
        services: values.services
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      router.push('/dashboard/firm');
    } catch (err) {
      setBanner((err && err.message) || t('regFirm.error'));
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
              {t('regFirm.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t('regFirm.subtitle', { site: SITE.name })}
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
                <SectionHeading>{t('regFirm.firmDetails')}</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label={t('regFirm.firmName')}
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    placeholder={t('regFirm.firmNamePlaceholder')}
                    error={errors.name}
                    required
                  />
                  <Select
                    label={t('regFirm.firmType')}
                    name="firmType"
                    value={values.firmType}
                    onChange={handleChange}
                    options={firmTypeOptions}
                    placeholder={t('regFirm.firmTypePlaceholder')}
                    error={errors.firmType}
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
                    placeholder={t('regFirm.cityPlaceholder')}
                    error={errors.city}
                    required
                  />
                  <Input
                    label={t('regFirm.professionalCount')}
                    name="professionalCount"
                    type="number"
                    value={values.professionalCount}
                    onChange={handleChange}
                    placeholder={t('regFirm.professionalCountPlaceholder')}
                    error={errors.professionalCount}
                    min="0"
                  />
                </div>
                <Input
                  label={t('regFirm.address')}
                  name="address"
                  value={values.address}
                  onChange={handleChange}
                  placeholder={t('regFirm.addressPlaceholder')}
                  error={errors.address}
                  required
                />
                <div className="w-full">
                  <label
                    htmlFor="services"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {t('regFirm.services')}
                  </label>
                  <textarea
                    id="services"
                    name="services"
                    rows={3}
                    value={values.services}
                    onChange={handleChange}
                    placeholder={t('regFirm.servicesPlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {t('regFirm.servicesHint')}
                  </p>
                </div>
                <div className="w-full">
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {t('regFirm.description')}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={values.description}
                    onChange={handleChange}
                    placeholder={t('regFirm.descriptionPlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <SectionHeading>{t('regFirm.adminAccount')}</SectionHeading>
                <Input
                  label={t('regFirm.adminName')}
                  name="adminName"
                  value={values.adminName}
                  onChange={handleChange}
                  placeholder={t('regFirm.adminNamePlaceholder')}
                  error={errors.adminName}
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label={t('auth.email')}
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder={t('regFirm.adminEmailPlaceholder')}
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

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('auth.creating') : t('regFirm.submit')}
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
