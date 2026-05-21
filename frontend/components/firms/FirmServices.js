'use client';

import { Briefcase, CheckCircle2 } from 'lucide-react';
import Card from '@/components/common/Card';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * FirmServices — grid of services offered by a firm.
 *
 * Props: { firm }
 */
export default function FirmServices({ firm }) {
  const { t } = useLanguage();
  const services =
    (firm && Array.isArray(firm.services) ? firm.services : []) || [];

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Briefcase size={18} className="text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">
          {t('firmCmp.practiceAreas')}
        </h2>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-slate-500">{t('firmCmp.noServices')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <li
              key={service}
              className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">
                {service}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
