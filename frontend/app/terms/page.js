'use client';

import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useLanguage } from '@/components/LanguageProvider';

const SECTIONS = [
  { titleKey: 'terms.s1.title', bodyKeys: ['terms.s1.p1', 'terms.s1.p2'] },
  { titleKey: 'terms.s2.title', bodyKeys: ['terms.s2.p1', 'terms.s2.p2'] },
  { titleKey: 'terms.s3.title', bodyKeys: ['terms.s3.p1', 'terms.s3.p2'] },
  { titleKey: 'terms.s4.title', bodyKeys: ['terms.s4.p1', 'terms.s4.p2'] },
  { titleKey: 'terms.s5.title', bodyKeys: ['terms.s5.p1', 'terms.s5.p2'] },
  { titleKey: 'terms.s6.title', bodyKeys: ['terms.s6.p1', 'terms.s6.p2'] },
  { titleKey: 'terms.s7.title', bodyKeys: ['terms.s7.p1', 'terms.s7.p2'] },
  { titleKey: 'terms.s8.title', bodyKeys: ['terms.s8.p1', 'terms.s8.p2'] },
  { titleKey: 'terms.s9.title', bodyKeys: ['terms.s9.p1'] },
  { titleKey: 'terms.s10.title', bodyKeys: ['terms.s10.p1'] },
  { titleKey: 'terms.s11.title', bodyKeys: ['terms.s11.p1'] },
];

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {t('terms.hero.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              {t('terms.hero.subtitle')}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {t('terms.lastUpdated')}
            </p>
          </div>
        </section>

        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-base text-slate-600">{t('terms.intro')}</p>
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
