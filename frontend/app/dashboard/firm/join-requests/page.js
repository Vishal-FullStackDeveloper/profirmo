'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inbox, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import { ROLES } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import firmJoinService from '@/services/firmJoinService';

const STATUS_VARIANTS = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

export default function FirmJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [firm, setFirm] = useState(null);
  const [requests, setRequests] = useState([]);
  const [decidingId, setDecidingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await firmJoinService.listFirmRequests();
      setFirm((res && res.firm) || null);
      setRequests((res && res.requests) || []);
    } catch (err) {
      setError(err.message || 'Could not load join requests.');
      setFirm(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDecide(id, decision) {
    setDecidingId(id);
    setError('');
    try {
      await firmJoinService.decideRequest(id, decision);
      await load();
    } catch (err) {
      setError(err.message || 'Could not update the request.');
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Join Requests"
      subtitle="Professionals asking to join your firm"
    >
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 w-full animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : error ? (
        <Card>
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </Card>
      ) : !firm ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title="No firm to manage"
          description="You do not own a firm yet, so there are no join requests to review."
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title="No join requests"
          description="When professionals ask to join your firm, their requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar
                    src={req.applicantPhoto}
                    name={req.applicantName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">
                        {req.applicantName}
                      </p>
                      <Badge variant={STATUS_VARIANTS[req.status] || 'gray'}>
                        {req.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {req.applicantEmail}
                    </p>
                    {req.message && (
                      <p className="mt-2 text-sm text-slate-600">
                        {req.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Requested {formatDate(req.createdAt)}
                      {req.decidedAt
                        ? ` · Decided ${formatDate(req.decidedAt)}`
                        : ''}
                    </p>
                  </div>
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDecide(req.id, 'approve')}
                      disabled={decidingId === req.id}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDecide(req.id, 'reject')}
                      disabled={decidingId === req.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
