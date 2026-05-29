'use client';

// Professional wallet page — shows the escrow / available / withdrawn
// balances at a glance and a paginated ledger of every wallet movement.

import { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  RefreshCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Hourglass,
  ArrowDownToLine,
  ArrowUpRight,
  Percent,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import {
  getWalletSummary,
  listWalletTransactions,
  formatINR,
} from '@/services/paymentService';
import { formatDate } from '@/utils/formatters';
import { ROLES } from '@/utils/constants';

const STATUS_VARIANT = {
  escrowed: 'amber',
  awaiting_review: 'amber',
  ready_to_release: 'blue',
  payout_requested: 'gray',
  released: 'blue',
  withdrawn: 'green',
  refunded: 'red',
};

const STATUS_LABEL = {
  escrowed: 'Escrowed',
  awaiting_review: 'Awaiting review',
  ready_to_release: 'Ready to release',
  payout_requested: 'Payout requested',
  released: 'Released',
  withdrawn: 'Withdrawn',
  refunded: 'Refunded',
};

function StatCard({ icon, label, value, hint }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function ProfessionalWalletPage() {
  const [summary, setSummary] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, t] = await Promise.all([
        getWalletSummary(),
        listWalletTransactions({ page: 1, limit: 30 }),
      ]);
      setSummary(s);
      setTxns(t.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="Wallet"
      subtitle="Your escrowed earnings, withdrawable balance and full ledger"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Wallet size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              Total earnings:{' '}
              <span className="font-bold text-slate-900">
                {summary ? formatINR(summary.totalEarnings) : '—'}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button href="/dashboard/professional/payouts" size="sm">
              <ArrowDownToLine size={15} />
              Manage payouts
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Admin markup line — current rate + cumulative deducted. */}
        {summary && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <Percent size={18} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Platform markup (admin-managed)
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">
                    {((summary.currentMarkupBps || 0) / 100).toFixed(2)}% of every payment
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Markup deducted to date
                </p>
                <p className="mt-0.5 text-base font-semibold text-rose-600">
                  −{formatINR(summary.markupDeducted || 0)}
                </p>
                <p className="text-xs text-slate-500">
                  Gross billed: {formatINR(summary.grossEarnings || 0)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Lock size={18} />}
            label="Escrowed"
            value={summary ? formatINR(summary.escrowedBalance) : '—'}
            hint="Awaiting completion / review"
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Available for payout"
            value={summary ? formatINR(summary.availableForPayout) : '—'}
            hint="Withdraw any time"
          />
          <StatCard
            icon={<Hourglass size={18} />}
            label="Pending payout"
            value={summary ? formatINR(summary.pendingPayout) : '—'}
            hint="Awaiting admin transfer"
          />
          <StatCard
            icon={<ArrowUpRight size={18} />}
            label="Withdrawn"
            value={summary ? formatINR(summary.withdrawn) : '—'}
            hint="Lifetime payouts"
          />
        </div>

        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent transactions
            </h2>
            <span className="text-xs text-slate-500">
              {txns.length} entr{txns.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : txns.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Wallet size={24} />}
                title="No transactions yet"
                description="Your wallet entries will appear here as clients pay for consultations."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txns.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {t.clientName || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.escrowStatus ? (
                          <Badge variant={STATUS_VARIANT[t.escrowStatus] || 'gray'}>
                            {STATUS_LABEL[t.escrowStatus] || t.escrowStatus}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          t.entryType === 'credit'
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {t.entryType === 'debit' ? '−' : '+'}
                        {formatINR(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
