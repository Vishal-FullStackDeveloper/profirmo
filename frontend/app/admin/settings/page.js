'use client';

// Admin platform settings. Each row is a small inline-editable field; the
// only setting today is the booking markup (bps), but the registry pattern
// means more knobs land here without UI churn.

import { useCallback, useEffect, useState } from 'react';
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Save,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import {
  listSettings,
  updateSetting,
} from '@/services/adminSettingsService';
import { ROLES } from '@/utils/constants';

export default function AdminSettingsPage() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState('');
  const [savedKey, setSavedKey] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listSettings();
      setItems(rows);
      setDrafts(Object.fromEntries(rows.map((r) => [r.key, String(r.value)])));
    } catch (err) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(key) {
    if (savingKey) return;
    setSavingKey(key);
    setSavedKey('');
    try {
      await updateSetting(key, drafts[key]);
      setSavedKey(key);
      await load();
    } catch (err) {
      setError(err.message || `Failed to save ${key}.`);
    } finally {
      setSavingKey('');
    }
  }

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Platform settings"
      subtitle="Knobs admins can change without a redeploy"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Settings size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {items.length} setting{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-28 w-full animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <Card key={s.key}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {s.label || s.key}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-slate-400">
                      {s.key}
                    </p>
                    {s.description && (
                      <p className="mt-2 max-w-prose text-xs text-slate-600">
                        {s.description}
                      </p>
                    )}
                    {s.key === 'bookingMarkupBps' && (
                      <p className="mt-2 text-xs text-slate-500">
                        Equivalent percentage:{' '}
                        <span className="font-semibold text-slate-700">
                          {(
                            (Number(drafts[s.key]) || 0) / 100
                          ).toFixed(2)}
                          %
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-end gap-2">
                    <div className="w-40">
                      <Input
                        label="Value"
                        name={s.key}
                        type="number"
                        value={drafts[s.key] || ''}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [s.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => save(s.key)}
                      disabled={
                        savingKey === s.key ||
                        String(drafts[s.key]) === String(s.value)
                      }
                    >
                      {savingKey === s.key ? (
                        'Saving…'
                      ) : savedKey === s.key ? (
                        <>
                          <CheckCircle2 size={14} />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
