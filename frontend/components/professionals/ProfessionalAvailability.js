'use client';

import { CalendarClock } from 'lucide-react';
import Card from '@/components/common/Card';
import { useLanguage } from '@/components/LanguageProvider';
import { formatTime } from '@/utils/formatters';

/**
 * Normalise an availability entry into `{ day, slots: string[] }`.
 * The API may return entries as `{ day, slots[] }`, `{ day, startTime,
 * endTime }`, or a plain string — this handles all of them gracefully.
 */
function normalizeEntry(entry, index) {
  if (typeof entry === 'string') {
    return { day: entry, slots: [], key: `${entry}-${index}` };
  }
  if (entry && typeof entry === 'object') {
    const day = entry.day || entry.dayOfWeek || entry.weekday || `Day ${index + 1}`;
    if (Array.isArray(entry.slots)) {
      return { day, slots: entry.slots, key: `${day}-${index}` };
    }
    if (entry.startTime || entry.endTime) {
      const range = [entry.startTime, entry.endTime].filter(Boolean).join(' - ');
      return { day, slots: range ? [range] : [], key: `${day}-${index}` };
    }
    return { day, slots: [], key: `${day}-${index}` };
  }
  return { day: `Day ${index + 1}`, slots: [], key: `entry-${index}` };
}

/**
 * ProfessionalAvailability — weekly availability slots.
 * Uses the API detail shape: `availability[]`.
 *
 * Props: { professional }
 */
export default function ProfessionalAvailability({ professional }) {
  const { t } = useLanguage();
  const raw =
    professional && Array.isArray(professional.availability)
      ? professional.availability
      : [];
  const slots = raw.map(normalizeEntry);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock size={18} className="text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">
          {t('profCmp.availability')}
        </h2>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-slate-500">{t('profCmp.noAvailability')}</p>
      ) : (
        <div className="space-y-4">
          {slots.map((entry) => (
            <div
              key={entry.key}
              className="flex flex-col gap-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <p className="w-28 shrink-0 text-sm font-semibold text-slate-700">
                {entry.day}
              </p>
              {Array.isArray(entry.slots) && entry.slots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {entry.slots.map((time) => (
                    <span
                      key={time}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {/^\d{1,2}:\d{2}$/.test(String(time))
                        ? formatTime(time)
                        : time}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {t('profCmp.noSlotsThisDay')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
