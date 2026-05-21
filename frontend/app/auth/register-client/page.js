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
import { validateForm, clientRegisterRules } from '@/utils/validators';
import { CITIES, USER_TYPES, SITE } from '@/utils/constants';

const cityOptions = CITIES.map((c) => ({ value: c, label: c }));

const USER_TYPE_LABEL_KEYS = {
  individual: 'regClient.userTypeIndividual',
  business: 'regClient.userTypeBusiness',
};

export default function RegisterClientPage() {
  const router = useRouter();
  const { registerClient } = useAuth();
  const { t } = useLanguage();
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    userType: 'individual',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userTypeOptions = USER_TYPES.map((type) => ({
    value: type,
    label: USER_TYPE_LABEL_KEYS[type]
      ? t(USER_TYPE_LABEL_KEYS[type])
      : type.charAt(0).toUpperCase() + type.slice(1),
  }));

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner('');
    const { valid, errors: errs } = validateForm(values, clientRegisterRules);
    setErrors(errs);
    if (!valid) return;

    setSubmitting(true);
    try {
      await registerClient(values);
      router.push('/dashboard/client');
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
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {t('regClient.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t('regClient.subtitle')}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {banner && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{banner}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label={t('auth.fullName')}
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder={t('auth.fullNamePlaceholder')}
                error={errors.name}
                required
              />
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t('auth.phone')}
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  placeholder={t('auth.phonePlaceholder')}
                  error={errors.phone}
                  required
                />
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
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Select
                  label={t('regClient.accountType')}
                  name="userType"
                  value={values.userType}
                  onChange={handleChange}
                  options={userTypeOptions}
                  error={errors.userType}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('auth.creating') : t('regClient.submit')}
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
