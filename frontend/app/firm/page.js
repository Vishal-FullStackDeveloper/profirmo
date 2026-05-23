'use client';

// Firm management hub — Phase 8.
// Auth-guarded. Lets an approved professional create a firm, and lets a firm
// owner / co-owner / member view and manage the firm, its members and its
// sent invitations. Fetches GET /api/law-firm/mine on mount.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Users,
  Mail,
  UserPlus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import LawFirmForm from '@/components/profile/LawFirmForm';
import { useAuth } from '@/components/AuthProvider';
import {
  getMyFirm,
  updateMemberRole,
  removeMember,
  searchProfessionals,
  sendInvitation,
  listSentInvitations,
  cancelInvitation,
} from '@/services/firmService';
import { resolveFileUrl } from '@/services/fileService';
import { formatDate } from '@/utils/formatters';

// --- firm status presentation ----------------------------------------------
const FIRM_STATUS = {
  PENDING_APPROVAL: { label: 'Under review', variant: 'amber' },
  ACTIVE: { label: 'Active', variant: 'green' },
  REJECTED: { label: 'Rejected', variant: 'red' },
  MODIFICATIONS_REQUESTED: { label: 'Changes requested', variant: 'amber' },
};

function firmStatusInfo(status) {
  return FIRM_STATUS[status] || { label: status || 'Unknown', variant: 'gray' };
}

// --- member / invitation role + status presentation ------------------------
const ROLE_LABELS = {
  owner: 'Owner',
  'co-owner': 'Co-owner',
  member: 'Member',
};

function roleLabel(role) {
  return ROLE_LABELS[role] || role || '—';
}

const ROLE_VARIANTS = {
  owner: 'amber',
  'co-owner': 'blue',
  member: 'gray',
};

const STATUS_VARIANTS = {
  ACTIVE: 'green',
  active: 'green',
  PENDING: 'amber',
  pending: 'amber',
  ACCEPTED: 'green',
  accepted: 'green',
  REJECTED: 'red',
  rejected: 'red',
  CANCELLED: 'gray',
  cancelled: 'gray',
};

function statusVariant(status) {
  return STATUS_VARIANTS[status] || 'gray';
}

function memberName(m) {
  return (
    m.fullName ||
    m.name ||
    [m.firstName, m.lastName].filter(Boolean).join(' ') ||
    m.email ||
    'Member'
  );
}

// ---------------------------------------------------------------------------

function FirmSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-56 animate-pulse rounded bg-slate-100" />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-56 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function Feedback({ feedback }) {
  if (!feedback) return null;
  const ok = feedback.type === 'success';
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {feedback.message}
    </div>
  );
}

// --- Invite professional modal ---------------------------------------------
function InviteModal({ open, onClose, onInvited }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Reset everything whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSearching(false);
      setEmail('');
      setRole('member');
      setSending(false);
      setFeedback(null);
    }
  }, [open]);

  // Debounced professional search.
  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    let active = true;
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const list = await searchProfessionals(q);
        if (active) setResults(Array.isArray(list) ? list : []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, open]);

  async function handleSend(e) {
    e.preventDefault();
    setFeedback(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Enter or pick an email address.' });
      return;
    }
    setSending(true);
    try {
      await sendInvitation({ email: trimmed, role });
      setFeedback({ type: 'success', message: 'Invitation sent.' });
      if (typeof onInvited === 'function') await onInvited();
      setTimeout(() => onClose(), 700);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not send the invitation.',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite a professional" size="md">
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label
            htmlFor="invite-search"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Search approved professionals
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="invite-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name or email…"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {query.trim().length >= 2 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              {searching ? (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              ) : results.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-500">
                  No matching professionals. You can still invite by email
                  below.
                </p>
              ) : (
                results.map((p) => {
                  const id = p.userId || p.id || p.email;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEmail(p.email || '')}
                      className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-teal-50 ${
                        email && email === p.email ? 'bg-teal-50' : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {p.fullName || p.name || p.email}
                      </span>
                      <span className="text-xs text-slate-500">
                        {p.email}
                        {p.professionalType ? ` · ${p.professionalType}` : ''}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <Input
          label="Email address"
          name="inviteEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="professional@example.com"
          hint="Pick a result above, or type any email to invite a professional who has not registered yet."
        />

        <Select
          label="Role"
          name="inviteRole"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { value: 'member', label: 'Member' },
            { value: 'co-owner', label: 'Co-owner' },
          ]}
        />

        <Feedback feedback={feedback} />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={sending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {sending ? 'Sending…' : 'Send invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// --- Members section --------------------------------------------------------
function MembersSection({ members, myRole, onReload }) {
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { memberId, name }
  const [feedback, setFeedback] = useState(null);

  const isOwner = myRole === 'owner';
  const isCoOwner = myRole === 'co-owner';
  const canRemove = isOwner || isCoOwner;

  async function changeRole(memberId, role) {
    setFeedback(null);
    setBusyId(memberId);
    try {
      await updateMemberRole(memberId, role);
      setFeedback({ type: 'success', message: 'Member role updated.' });
      if (typeof onReload === 'function') await onReload();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update the role.',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function doRemove() {
    if (!confirm) return;
    const { memberId } = confirm;
    setConfirm(null);
    setFeedback(null);
    setBusyId(memberId);
    try {
      await removeMember(memberId);
      setFeedback({ type: 'success', message: 'Member removed.' });
      if (typeof onReload === 'function') await onReload();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not remove the member.',
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-amber-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Members ({members.length})
        </h2>
      </div>

      {feedback && (
        <div className="mb-4">
          <Feedback feedback={feedback} />
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No members yet"
          description="Invite professionals to build your firm's team."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Name</th>
                <th className="py-2.5 pr-3 font-medium">Email</th>
                <th className="py-2.5 pr-3 font-medium">Role</th>
                <th className="py-2.5 pr-3 font-medium">Status</th>
                <th className="py-2.5 pr-3 font-medium">Joined</th>
                {canRemove && (
                  <th className="py-2.5 pr-3 text-right font-medium">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const id = m.id || m.memberId;
                const isMemberOwner = m.role === 'owner';
                const busy = busyId === id;
                return (
                  <tr
                    key={id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 pr-3 font-medium text-slate-800">
                      {memberName(m)}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {m.email || '—'}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={ROLE_VARIANTS[m.role] || 'gray'}>
                        {roleLabel(m.role)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3">
                      {m.status ? (
                        <Badge variant={statusVariant(m.status)}>
                          {m.status}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {m.joiningDate ? formatDate(m.joiningDate) : '—'}
                    </td>
                    {canRemove && (
                      <td className="py-3 pr-3">
                        <div className="flex items-center justify-end gap-2">
                          {isMemberOwner ? (
                            <span className="text-xs text-slate-400">
                              Owner
                            </span>
                          ) : (
                            <>
                              {isOwner && m.role === 'member' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => changeRole(id, 'co-owner')}
                                >
                                  <ArrowUpCircle className="h-3.5 w-3.5" />
                                  Promote
                                </Button>
                              )}
                              {isOwner && m.role === 'co-owner' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => changeRole(id, 'member')}
                                >
                                  <ArrowDownCircle className="h-3.5 w-3.5" />
                                  Demote
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  setConfirm({
                                    memberId: id,
                                    name: memberName(m),
                                  })
                                }
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Remove member"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doRemove}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Remove <span className="font-semibold">{confirm && confirm.name}</span>{' '}
          from the firm? This cannot be undone.
        </p>
      </Modal>
    </Card>
  );
}

// --- Invitations section ----------------------------------------------------
function InvitationsSection() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, email }
  const [feedback, setFeedback] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listSentInvitations();
      setInvitations(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Could not load invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doCancel() {
    if (!confirm) return;
    const { id } = confirm;
    setConfirm(null);
    setFeedback(null);
    setBusyId(id);
    try {
      await cancelInvitation(id);
      setFeedback({ type: 'success', message: 'Invitation cancelled.' });
      await load();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not cancel the invitation.',
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Invitations
          </h2>
        </div>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Invite professional
        </Button>
      </div>

      {feedback && (
        <div className="mb-4">
          <Feedback feedback={feedback} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-14 w-full animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle size={24} />}
          title="Could not load invitations"
          description={error}
          action={
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={load}
            >
              Retry
            </Button>
          }
        />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={<Mail size={24} />}
          title="No invitations sent"
          description="Invite a professional to join your firm."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {invitations.map((inv) => {
            const pending =
              String(inv.status || '').toUpperCase() === 'PENDING';
            const busy = busyId === inv.id;
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {inv.email}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Invited as {roleLabel(inv.role)}
                    {inv.createdAt ? ` · ${formatDate(inv.createdAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(inv.status)}>
                    {inv.status || 'Pending'}
                  </Badge>
                  {pending && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        setConfirm({ id: inv.id, email: inv.email })
                      }
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={load}
      />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Cancel invitation"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Keep
            </Button>
            <Button variant="danger" onClick={doCancel}>
              Cancel invitation
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel the invitation to{' '}
          <span className="font-semibold">{confirm && confirm.email}</span>?
        </p>
      </Modal>
    </Card>
  );
}

// ---------------------------------------------------------------------------

export default function FirmPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [firm, setFirm] = useState(null); // { lawFirm, members, myRole, approval }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [justCreated, setJustCreated] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Route guard.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyFirm();
      setFirm(data);
    } catch (err) {
      setError(err.message || 'Could not load your firm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, load]);

  const handleCreated = useCallback(async () => {
    setJustCreated(true);
    await load();
  }, [load]);

  const handleUpdated = useCallback(async () => {
    setShowEdit(false);
    await load();
  }, [load]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">
          <FirmSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  const role = user && user.role;
  const isApprovedProfessional =
    (role === 'professional' || role === 'firm_professional') &&
    user &&
    user.approvalStatus === 'APPROVED';

  const lawFirm = firm && firm.lawFirm;
  const myRole = firm && firm.myRole;
  const approval = firm && firm.approval;
  const members = (firm && firm.members) || [];
  const canManage = myRole === 'owner' || myRole === 'co-owner';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {loading ? (
          <FirmSkeleton />
        ) : error ? (
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <EmptyState
              icon={<AlertCircle size={24} />}
              title="Could not load your firm"
              description={error}
              action={
                <Button
                  onClick={load}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Retry
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-xl font-bold text-slate-900">My firm</h1>
              <p className="text-sm text-slate-500">
                Create and manage your firm, members and invitations.
              </p>
            </div>

            {/* ---- No firm yet ------------------------------------------ */}
            {!lawFirm && (
              <>
                {justCreated ? (
                  <Card>
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                      <h2 className="text-base font-semibold text-slate-900">
                        Submitted for approval
                      </h2>
                      <p className="max-w-md text-sm text-slate-500">
                        Your firm has been created and is now under review by
                        our team. You will be able to manage members once it
                        is approved.
                      </p>
                      <Button
                        onClick={load}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Refresh
                      </Button>
                    </div>
                  </Card>
                ) : isApprovedProfessional ? (
                  <>
                    <Card>
                      <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">
                            Create your firm
                          </h2>
                          <p className="text-sm text-slate-500">
                            Set up your firm profile to invite professionals
                            and manage a team. Your firm will be reviewed
                            before it goes live.
                          </p>
                        </div>
                      </div>
                    </Card>
                    <LawFirmForm lawFirm={null} onSaved={handleCreated} />
                  </>
                ) : (
                  <EmptyState
                    icon={<ShieldAlert size={24} />}
                    title="Only approved professionals can create a firm"
                    description="Once your professional profile is approved, you can create and manage a firm here."
                  />
                )}
              </>
            )}

            {/* ---- Has a firm ------------------------------------------- */}
            {lawFirm && (
              <>
                {/* Firm header card */}
                <Card>
                  <div className="flex flex-wrap items-start gap-4">
                    <FirmLogo lawFirm={lawFirm} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                          {lawFirm.firmName || lawFirm.name || 'Your firm'}
                        </h2>
                        <Badge
                          variant={firmStatusInfo(lawFirm.status).variant}
                        >
                          {firmStatusInfo(lawFirm.status).label}
                        </Badge>
                        {myRole && (
                          <Badge variant={ROLE_VARIANTS[myRole] || 'gray'}>
                            You: {roleLabel(myRole)}
                          </Badge>
                        )}
                      </div>
                      {lawFirm.headquarters && (
                        <p className="mt-1 text-sm text-slate-500">
                          {lawFirm.headquarters}
                        </p>
                      )}

                      {lawFirm.status === 'REJECTED' &&
                        approval &&
                        approval.rejectionReason && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                              <span className="font-semibold">
                                Rejected:
                              </span>{' '}
                              {approval.rejectionReason}
                            </span>
                          </div>
                        )}

                      {lawFirm.status === 'MODIFICATIONS_REQUESTED' &&
                        approval &&
                        approval.requestedModifications && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                              <span className="font-semibold">
                                Changes requested:
                              </span>{' '}
                              {approval.requestedModifications}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </Card>

                {/* Edit firm — owner / co-owner */}
                {canManage && (
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          Firm details
                        </h2>
                        <p className="text-sm text-slate-500">
                          Update your firm profile. Saving a rejected or
                          changes-requested firm resubmits it for approval.
                        </p>
                      </div>
                      <Button
                        variant={showEdit ? 'outline' : 'primary'}
                        size="sm"
                        className={
                          showEdit ? '' : 'bg-amber-600 hover:bg-amber-700'
                        }
                        onClick={() => setShowEdit((v) => !v)}
                      >
                        {showEdit ? 'Close editor' : 'Edit firm'}
                      </Button>
                    </div>
                    {showEdit && (
                      <div className="mt-4">
                        <LawFirmForm
                          lawFirm={lawFirm}
                          onSaved={handleUpdated}
                        />
                      </div>
                    )}
                  </Card>
                )}

                {/* Members */}
                <MembersSection
                  members={members}
                  myRole={myRole}
                  onReload={load}
                />

                {/* Invitations — owner / co-owner */}
                {canManage && <InvitationsSection />}
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Firm logo (resolved to an absolute URL) or a placeholder tile.
function FirmLogo({ lawFirm }) {
  const logo = lawFirm && lawFirm.logo;
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveFileUrl(logo)}
        alt={lawFirm.firmName || 'Firm logo'}
        className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover"
      />
    );
  }
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-teal-600 text-white">
      <Building2 className="h-7 w-7" />
    </div>
  );
}
