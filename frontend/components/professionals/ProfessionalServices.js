'use client';

import { CheckCircle2, Layers } from 'lucide-react';
import Card from '@/components/common/Card';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * ProfessionalServices — skills & areas of expertise offered.
 * Uses the API detail shape: `expertise[]` and `skills[]`.
 *
 * Props: { professional }
 */
export default function ProfessionalServices({ professional }) {
  const { t } = useLanguage();
  const expertise =
    professional && Array.isArray(professional.expertise)
      ? professional.expertise
      : [];
  const skills =
    professional && Array.isArray(professional.skills)
      ? professional.skills
      : [];
  // Merge expertise + skills into one de-duplicated checklist.
  const services = Array.from(new Set([...expertise, ...skills])).filter(
    Boolean
  );

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Layers size={18} className="text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">
          {t('profCmp.servicesOffered')}
        </h2>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-slate-500">{t('profCmp.noServices')}</p>
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
