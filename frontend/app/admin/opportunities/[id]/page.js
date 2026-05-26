'use client';

// Admin — Opportunity detail.
// Shows the opportunity, the activity timeline shared with its origin
// lead, and the "Convert to client" action that creates a User(role=client)
// and emails a password-reset link to the new client.

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Mail,
  Phone,
  CalendarDays,
  Sparkles,
  MessageSquare,
  UserCheck,
  Building2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import {
  adminGetOpportunity,
  adminUpdateOpportunity,
  adminListOpportunityActivities,
  adminAddOpportunityNote,
  adminConvertOpportunity,
  OPPORTUNITY_STATUSES,
} from '@/services/leadService';
import { listUsers } from '@/services/adminService';

function statusVariant(s) {
  switch (s) {
    case 'Open':
      return 'blue';
    case 'In Discussion':
      return 'amber';
    case 'Won':
      return 'green';
    case 'Lost':
      return 'red';
    case 'Converted':
      return 'emerald';
    default:
      return 'gray';
  }
}

export default function AdminOpportunityDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [opp, setOpp] = useState(null);
  const [activities, setActivities] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState(null);

  const isAdmin = user && user.role === ROLES.PLATFORM_ADMIN;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [o, acts] = await Promise.all([
        adminGetOpportunity(id),
        adminListOpportunityActivities(id),
      ]);
      setOpp(o);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch (err) {
      setError(err.message || 'Failed to load the opportunity.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) load();
  }, [authLoading, isAuthenticated, isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return;
    listUsers({ role: 'platform_admin', limit: 100 })
      .then(({ data }) => setAssignees(Array.isArray(data) ? data : []))
      .catch(() => setAssignees([]));
  }, [isAdmin]);

  async function changeStatus(next) {
    if (!opp || opp.status === next) return;
    try {
      await adminUpdateOpportunity(id, { status: next });
      await load();
    } catch {
      /* no-op */
    }
  }
  async function changeAssignee(next) {
    if (!opp || (opp.assignedToUserId || '') === (next || '')) return;
    try {
      await adminUpdateOpportunity(id, { assignedToUserId: next || null });
      await load();
    } catch {
      /* no-op */
    }
  }

  async function addNote(e) {
    if (e) e.preventDefault();
    const message = noteText.trim();
    if (!message || noteSubmitting) return;
    setNoteSubmitting(true);
    try {
      await adminAddOpportunityNote(id, message);
      setNoteText('');
      await load();
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function confirmConvert() {
    if (converting) return;
    setConverting(true);
    try {
      const result = await adminConvertOpportunity(id);
      setConvertResult(result);
      await load();
    } catch (err) {
      setConvertResult({ error: err.message || 'Conversion failed.' });
    } finally {
      setConverting(false);
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Opportunity" />
    );
  }
  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Opportunity">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account."
          action={
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          }
        />
      </DashboardLayout>
    );
  }
  if (loading) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Opportunity">
        <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100" />
      </DashboardLayout>
    );
  }
  if (error || !opp) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Opportunity">
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {error || 'Opportunity not found.'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" href="/admin/opportunities">
                <ArrowLeft size={15} />
                Back
              </Button>
              <Button size="sm" onClick={load}>
                <RefreshCw size={15} />
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const ASSIGNEE_OPTIONS = [
    { value: '', label: '(Unassigned)' },
    ...assignees.map((a) => ({ value: a.id, label: a.fullName || a.email })),
  ];

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title={opp.fullName}
      subtitle="Opportunity detail and activity timeline"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" href="/admin/opportunities">
            <ArrowLeft size={15} />
            Back to opportunities
          </Button>
          <div className="flex gap-2">
            {opp.leadId && (
              <Button
                size="sm"
                variant="outline"
                href={`/admin/leads/${opp.leadId}`}
              >
                ← Origin lead
              </Button>
            )}
            {opp.clientId ? (
              <Button
                size="sm"
                variant="outline"
                href={`/admin/users?search=${encodeURIComponent(opp.email)}`}
              >
                <Building2 size={14} />
                View client
              </Button>
            ) : (
              <Button size="sm" onClick={() => setConvertOpen(true)}>
                <UserCheck size={14} />
                Convert to client
              </Button>
            )}
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {opp.fullName}
              </h2>
              {opp.source && (
                <p className="text-sm text-slate-500">Origin: {opp.source}</p>
              )}
            </div>
            <Badge variant={statusVariant(opp.status)}>{opp.status}</Badge>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-2">
              <Mail size={14} className="mt-0.5 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium text-slate-800">{opp.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone size={14} className="mt-0.5 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-800">{opp.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays size={14} className="mt-0.5 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500">Created</dt>
                <dd className="font-medium text-slate-800">
                  {formatDate(opp.createdAt)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:col-span-3">
              <Sparkles size={14} className="mt-0.5 text-slate-400" />
              <div className="flex-1">
                <dt className="text-xs text-slate-500">Notes</dt>
                <dd className="whitespace-pre-line text-slate-700">
                  {opp.notes || (
                    <span className="italic text-slate-400">No notes yet.</span>
                  )}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Status"
              name="status"
              value={opp.status}
              onChange={(e) => changeStatus(e.target.value)}
              options={OPPORTUNITY_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Assigned to"
              name="assignedToUserId"
              value={opp.assignedToUserId || ''}
              onChange={(e) => changeAssignee(e.target.value)}
              options={ASSIGNEE_OPTIONS}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Add a note</h3>
          </div>
          <form onSubmit={addNote} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Comment, follow-up, conversation summary…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100"
            />
            <Button type="submit" size="sm" disabled={noteSubmitting || !noteText.trim()}>
              {noteSubmitting ? 'Saving…' : 'Add note'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Activity timeline
          </h3>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700">
                      {a.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                  {(a.fromValue || a.toValue) && (
                    <p className="text-xs text-slate-500">
                      {a.fromValue && <span>{a.fromValue}</span>}
                      {a.fromValue && a.toValue && (
                        <span className="mx-1.5 text-slate-300">→</span>
                      )}
                      {a.toValue && <span>{a.toValue}</span>}
                    </p>
                  )}
                  {a.note && (
                    <p className="whitespace-pre-line text-sm text-slate-700">
                      {a.note}
                    </p>
                  )}
                  {a.actorName && (
                    <p className="text-[11px] text-slate-400">
                      by {a.actorName}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={convertOpen}
        onClose={() => !converting && setConvertOpen(false)}
        title="Convert opportunity to client"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConvertOpen(false)}
              disabled={converting}
            >
              {convertResult && !convertResult.error ? 'Close' : 'Cancel'}
            </Button>
            {!(convertResult && !convertResult.error) && (
              <Button size="sm" onClick={confirmConvert} disabled={converting}>
                {converting ? 'Converting…' : 'Confirm convert'}
              </Button>
            )}
          </>
        }
      >
        {!convertResult ? (
          <p className="text-sm text-slate-600">
            Create a client account for <strong>{opp.fullName}</strong>? A
            password-reset email will be sent to <strong>{opp.email}</strong> so
            they can finish onboarding.
          </p>
        ) : convertResult.error ? (
          <p className="text-sm text-red-600">{convertResult.error}</p>
        ) : (
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-medium text-emerald-700">
              Client account created.
            </p>
            <p>
              A password-reset email has been queued for{' '}
              <strong>{opp.email}</strong>. The user record now appears under
              Users with role <em>client</em>.
            </p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
