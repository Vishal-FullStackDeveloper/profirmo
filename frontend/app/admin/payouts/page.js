'use client';

// Admin payouts queue — approve / reject pending requests, mark approved
// payouts paid once the external transfer (NEFT / UPI) is done.

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Banknote,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import {
  adminListPayouts,
  adminApprovePayout,
  adminRejectPayout,
  adminMarkPayoutPaid,
  formatINR,
} from '@/services/paymentService';
import { formatDate } from '@/utils/formatters';
import { ROLES } from '@/utils/constants';

const STATUS_VARIANT = {
  pending: 'amber',
  approved: 'blue',
  rejected: 'red',
  paid: 'green',
};

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [actionTarget, setActionTarget] = useState(null);
  // 'approve' | 'reject' | 'paid'
  const [actionType, setActionType] = useState('');
  const [actionField, setActionField] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { items, meta: m } = await adminListPayouts({
        status: status || undefined,
        limit: 50,
      });
      setRows(items || []);
      setMeta(m || null);
    } catch (err) {
      setError(err.message || 'Failed to load payouts.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  function openAction(row, type) {
    setActionTarget(row);
    setActionType(type);
    setActionField('');
    setActionError('');
  }

  async function confirmAction() {
    if (!actionTarget || actionSubmitting) return;
    setActionError('');
    setActionSubmitting(true);
    try {
      if (actionType === 'approve') {
        await adminApprovePayout(actionTarget.id, actionField || undefined);
      } else if (actionType === 'reject') {
        if (!actionField.trim()) {
          throw new Error('Rejection reason is required.');
        }
        await adminRejectPayout(actionTarget.id, actionField.trim());
      } else if (actionType === 'paid') {
        if (!actionField.trim()) {
          throw new Error('Transfer reference is required.');
        }
        await adminMarkPayoutPaid(actionTarget.id, actionField.trim());
      }
      setActionTarget(null);
      setActionType('');
      setActionField('');
      await load();
    } catch (err) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setActionSubmitting(false);
    }
  }

  const total = (meta && meta.total) || rows.length;

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Payouts"
      subtitle="Approve withdrawals, record external transfers, audit history"
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Select
              label="Status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'paid', label: 'Paid' },
              ]}
              className="lg:w-48"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
          </div>
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <ArrowDownToLine size={18} />
          </span>
          <p className="text-sm font-medium text-slate-700">
            {loading ? 'Loading…' : `${total} payout${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 w-full animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ArrowDownToLine size={24} />}
            title="Nothing here"
            description="No payout requests match the current filter."
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">
                        {formatINR(r.amount)}
                      </p>
                      <Badge variant={STATUS_VARIANT[r.status] || 'gray'}>
                        {r.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Requested {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      <span className="font-medium">{r.professionalName}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-500">
                        {r.professionalEmail}
                      </span>
                    </p>
                    <div className="mt-2 text-xs text-slate-600">
                      {r.method === 'bank' ? (
                        <>
                          Bank:{' '}
                          <span className="font-medium">
                            {r.bankAccountName}
                          </span>{' '}
                          · A/c{' '}
                          <span className="font-mono">
                            {r.bankAccountNumber}
                          </span>{' '}
                          · IFSC <span className="font-mono">{r.bankIfsc}</span>
                        </>
                      ) : (
                        <>
                          UPI: <span className="font-mono">{r.upiId}</span>
                        </>
                      )}
                    </div>
                    {r.notes && (
                      <p className="mt-2 text-xs text-slate-500 italic">
                        “{r.notes}”
                      </p>
                    )}
                    {r.transferRef && (
                      <p className="mt-2 text-xs text-slate-600">
                        Transfer ref:{' '}
                        <span className="font-mono">{r.transferRef}</span>
                      </p>
                    )}
                    {r.decisionReason && (
                      <p className="mt-1 text-xs text-red-600">
                        {r.decisionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start gap-2">
                    {r.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openAction(r, 'approve')}
                        >
                          <Check size={14} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAction(r, 'reject')}
                        >
                          <X size={14} />
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openAction(r, 'paid')}
                      >
                        <Banknote size={14} />
                        Mark paid
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!actionTarget}
        onClose={() => !actionSubmitting && setActionTarget(null)}
        title={
          actionType === 'approve'
            ? 'Approve payout'
            : actionType === 'reject'
            ? 'Reject payout'
            : 'Record transfer'
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionTarget(null)}
              disabled={actionSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' ? 'danger' : 'primary'}
              size="sm"
              onClick={confirmAction}
              disabled={actionSubmitting}
            >
              {actionSubmitting ? 'Working…' : 'Confirm'}
            </Button>
          </>
        }
      >
        {actionTarget && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              {actionType === 'approve' && (
                <>
                  Approve <strong>{formatINR(actionTarget.amount)}</strong> for{' '}
                  <strong>{actionTarget.professionalName}</strong>?
                </>
              )}
              {actionType === 'reject' && (
                <>
                  Reject <strong>{formatINR(actionTarget.amount)}</strong> for{' '}
                  <strong>{actionTarget.professionalName}</strong>? Funds will
                  return to the available-for-payout bucket.
                </>
              )}
              {actionType === 'paid' && (
                <>
                  Record that the external transfer for{' '}
                  <strong>{formatINR(actionTarget.amount)}</strong> has been
                  completed. Enter the bank / UPI reference below.
                </>
              )}
            </p>
            {actionType !== 'approve' || actionField ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {actionType === 'reject'
                    ? 'Reason'
                    : actionType === 'paid'
                    ? 'Transfer reference'
                    : 'Note (optional)'}
                </label>
                {actionType === 'paid' ? (
                  <input
                    value={actionField}
                    onChange={(e) => setActionField(e.target.value)}
                    placeholder="UTR / UPI txn ref"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                ) : (
                  <textarea
                    rows={3}
                    value={actionField}
                    onChange={(e) => setActionField(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActionField(' ')}
                className="text-xs font-medium text-amber-700 hover:underline"
              >
                Add an optional note
              </button>
            )}
            {actionError && (
              <p className="text-xs text-red-600">{actionError}</p>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
