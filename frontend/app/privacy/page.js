'use client';

import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useLanguage } from '@/components/LanguageProvider';

const SECTIONS = [
  { titleKey: 'privacy.s1.title', bodyKeys: ['privacy.s1.p1', 'privacy.s1.p2'] },
  {
    titleKey: 'privacy.s2.title',
    bodyKeys: [
      'privacy.s2.p1',
      'privacy.s2.p2',
      'privacy.s2.p3',
      'privacy.s2.p4',
    ],
  },
  {
    titleKey: 'privacy.s3.title',
    bodyKeys: [
      'privacy.s3.p1',
      'privacy.s3.p2',
      'privacy.s3.p3',
      'privacy.s3.p4',
    ],
  },
  {
    titleKey: 'privacy.s4.title',
    bodyKeys: ['privacy.s4.p1', 'privacy.s4.p2', 'privacy.s4.p3'],
  },
  { titleKey: 'privacy.s5.title', bodyKeys: ['privacy.s5.p1', 'privacy.s5.p2'] },
  { titleKey: 'privacy.s6.title', bodyKeys: ['privacy.s6.p1'] },
  {
    titleKey: 'privacy.s7.title',
    bodyKeys: ['privacy.s7.p1', 'privacy.s7.p2', 'privacy.s7.p3'],
  },
  { titleKey: 'privacy.s8.title', bodyKeys: ['privacy.s8.p1'] },
  { titleKey: 'privacy.s9.title', bodyKeys: ['privacy.s9.p1'] },
  { titleKey: 'privacy.s10.title', bodyKeys: ['privacy.s10.p1'] },
];

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {t('privacy.hero.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              {t('privacy.hero.subtitle')}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {t('privacy.lastUpdated')}
            </p>
          </div>
        </section>

        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-base text-slate-600">{t('privacy.intro')}</p>
            <div className="mt-10 space-y-10">
              {SECTIONS.map((section, index) => (
                <div key={section.titleKey}>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {index + 1}. {t(section.titleKey)}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.bodyKeys.map((bodyKey) => (
                      <p
                        key={bodyKey}
                        className="text-sm leading-relaxed text-slate-600"
                      >
                        {t(bodyKey)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
