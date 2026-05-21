'use client';

import { useState } from 'react';
import { NotebookPen, Check } from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * ConsultationNotes — labelled textarea for private consultation notes.
 *
 * Props: { value, onChange, onSave }
 *   onChange(event) — standard textarea change handler
 *   onSave() — called when "Save notes" is clicked
 */
export default function ConsultationNotes({ value, onChange, onSave }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (typeof onSave === 'function') onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <NotebookPen size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">
          {t('consultCmp.consultationNotes')}
        </h3>
      </div>

      <label htmlFor="consultation-notes" className="sr-only">
        {t('consultCmp.consultationNotes')}
      </label>
      <textarea
        id="consultation-notes"
        name="consultation-notes"
        value={value}
        onChange={onChange}
        rows={6}
        placeholder={t('consultCmp.notesPlaceholder')}
        className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {saved
            ? t('consultCmp.notesSaved')
            : t('consultCmp.notesPrivate')}
        </span>
        <Button variant="secondary" size="sm" onClick={handleSave}>
          {saved ? <Check size={15} /> : <NotebookPen size={15} />}
          {saved ? t('consultCmp.saved') : t('consultCmp.saveNotes')}
        </Button>
      </div>
    </Card>
  );
}
