'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, LogOut, Plus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import firmJoinService from '@/services/firmJoinService';
import { createLawFirm } from '@/services/profileService';
import { ROLES } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';

const STATUS_VARIANT = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

function SectionTitle({ title, description }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default function ProfessionalFirmPage() {
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [requests, setRequests] = useState([]);
  const [joinableFirms, setJoinableFirms] = useState([]);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const [joinTarget, setJoinTarget] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [cancellingId, setCancellingId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    firmName: '',
    headquarters: '',
    contactEmail: '',
    contactNumber: '',
    registrationNumber: '',
    about: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membershipData, requestsData] = await Promise.all([
        firmJoinService.getMyMembership(),
        firmJoinService.listMyRequests(),
      ]);
      setMembership(membershipData || null);
      setRequests(Array.isArray(requestsData) ? requestsData : []);

      if (!membershipData) {
        const firmsData = await firmJoinService.listJoinableFirms();
        setJoinableFirms(Array.isArray(firmsData) ? firmsData : []);
      } else {
        setJoinableFirms([]);
      }
    } catch {
      setMembership(null);
      setRequests([]);
      setJoinableFirms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmLeave() {
    setLeaving(true);
    setLeaveError('');
    try {
      await firmJoinService.leaveFirm();
      setLeaveOpen(false);
      await load();
    } catch (err) {
      setLeaveError(err.message || 'Could not leave the firm.');
    } finally {
      setLeaving(false);
    }
  }

  function openJoin(firm) {
    setJoinError('');
    setJoinMessage('');
    setJoinTarget(firm);
  }

  async function confirmJoin() {
    if (!joinTarget) return;
    setJoining(true);
    setJoinError('');
    try {
      await firmJoinService.requestJoin(joinTarget.id, joinMessage.trim());
      setJoinTarget(null);
      setJoinMessage('');
      await load();
    } catch (err) {
      setJoinError(err.message || 'Could not send your join request.');
    } finally {
      setJoining(false);
    }
  }

  function openCreate() {
    setCreateError('');
    setCreateForm({
      firmName: '',
      headquarters: '',
      contactEmail: '',
      contactNumber: '',
      registrationNumber: '',
      about: '',
    });
    setCreateOpen(true);
  }

  async function submitCreate(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!createForm.firmName.trim()) {
      setCreateError('Firm name is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await createLawFirm({
        firmName: createForm.firmName.trim(),
        headquarters: createForm.headquarters.trim(),
        contactEmail: createForm.contactEmail.trim(),
        contactNumber: createForm.contactNumber.trim(),
        registrationNumber: createForm.registrationNumber.trim(),
        about: createForm.about.trim(),
      });
      setCreateOpen(false);
      await load();
    } catch (err) {
      setCreateError(err.message || 'Could not create the firm.');
    } finally {
      setCreating(false);
    }
  }

  async function cancelRequest(id) {
    setCancellingId(id);
    try {
      await firmJoinService.cancelRequest(id);
      await load();
    } catch {
      // Silent — the list reload will reflect the true state.
    } finally {
      setCancellingId(null);
    }
  }

  const firm = membership && membership.firm;
  const member = membership && membership.member;
  const isOwner = member && member.role === 'owner';

  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="My Firm"
      subtitle="Join a law firm or manage your membership"
    >
      <div className="space-y-8">
        {loading ? (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          </div>
        ) : (
          <>
            {/* Current membership */}
            {membership ? (
              <section>
                <SectionTitle title="Your firm" />
                <Card>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={firm && firm.logo}
                        name={firm && firm.firmName}
                        size="lg"
                      />
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {firm && firm.firmName}
                        </h3>
                        <p className="mt-0.5 text-sm capitalize text-slate-500">
                          {member && member.role
                            ? `Role: ${member.role}`
                            : 'Member'}
                        </p>
                        {member && member.joinedAt && (
                          <p className="text-sm text-slate-500">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setLeaveOpen(true)}
                        disabled={isOwner}
                      >
                        <LogOut size={16} />
                        Leave firm
                      </Button>
                      {isOwner && (
                        <p className="text-xs text-slate-500">
                          Firm owners cannot leave.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </section>
            ) : (
              <>
                {/* Create your own firm */}
                <section>
                  <SectionTitle
                    title="Create your own firm"
                    description="Start your own law firm. You will be its owner."
                  />
                  <Card>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-600">
                        Set up your firm to invite other professionals to join.
                        Your professional profile must be approved first.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={openCreate}
                      >
                        <Plus size={16} />
                        Create firm
                      </Button>
                    </div>
                  </Card>
                </section>

              {/* Browse firms to join */}
              <section>
                <SectionTitle
                  title="Browse firms to join"
                  description="Send a request to join a law firm."
                />
                {joinableFirms.length === 0 ? (
                  <EmptyState
                    icon={<Building2 size={24} />}
                    title="No firms available"
                    description="There are no law firms accepting members right now."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {joinableFirms.map((f) => (
                      <Card key={f.id}>
                        <div className="flex items-center gap-3">
                          <Avatar src={f.logo} name={f.firmName} size="md" />
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {f.firmName}
                            </h3>
                            {f.headquarters && (
                              <p className="truncate text-xs text-slate-500">
                                {f.headquarters}
                              </p>
                            )}
                          </div>
                        </div>
                        {f.about && (
                          <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                            {f.about}
                          </p>
                        )}
                        <div className="mt-4">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openJoin(f)}
                          >
                            Request to join
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
              </>
            )}

            {/* My join requests */}
            <section>
              <SectionTitle
                title="My join requests"
                description="Track the firms you have asked to join."
              />
              {requests.length === 0 ? (
                <EmptyState
                  icon={<Building2 size={24} />}
                  title="No join requests yet"
                  description="When you request to join a firm it will show up here."
                />
              ) : (
                <Card padding={false}>
                  <ul className="divide-y divide-slate-200">
                    {requests.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {r.firmName}
                          </p>
                          {r.message && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {r.message}
                            </p>
                          )}
                          {r.createdAt && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(r.createdAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={STATUS_VARIANT[r.status] || 'gray'}
                          >
                            {r.status}
                          </Badge>
                          {r.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelRequest(r.id)}
                              disabled={cancellingId === r.id}
                            >
                              {cancellingId === r.id
                                ? 'Cancelling…'
                                : 'Cancel'}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </section>
          </>
        )}
      </div>

      {/* Leave-firm confirmation modal */}
      <Modal
        open={leaveOpen}
        onClose={() => !leaving && setLeaveOpen(false)}
        title="Leave firm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeaveOpen(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmLeave}
              disabled={leaving}
            >
              {leaving ? 'Leaving…' : 'Leave firm'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to leave
            {firm && firm.firmName ? ` ${firm.firmName}` : ' this firm'}? You
            will need to send a new request to rejoin.
          </p>
          {leaveError && <p className="text-xs text-red-600">{leaveError}</p>}
        </div>
      </Modal>

      {/* Request-to-join modal */}
      <Modal
        open={!!joinTarget}
        onClose={() => !joining && setJoinTarget(null)}
        title={
          joinTarget ? `Request to join ${joinTarget.firmName}` : 'Request to join'
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJoinTarget(null)}
              disabled={joining}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmJoin}
              disabled={joining}
            >
              {joining ? 'Sending…' : 'Send request'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label
              htmlFor="join-message"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Message (optional)
            </label>
            <textarea
              id="join-message"
              rows={4}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Introduce yourself to the firm…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {joinError && <p className="text-xs text-red-600">{joinError}</p>}
        </div>
      </Modal>

      {/* Create-firm modal */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Create your firm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitCreate}
              disabled={creating || !createForm.firmName.trim()}
            >
              {creating ? 'Creating…' : 'Create firm'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitCreate} className="space-y-3">
          <Input
            label="Firm name"
            name="firmName"
            required
            value={createForm.firmName}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, firmName: e.target.value }))
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Headquarters"
              name="headquarters"
              value={createForm.headquarters}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  headquarters: e.target.value,
                }))
              }
            />
            <Input
              label="Registration number"
              name="registrationNumber"
              value={createForm.registrationNumber}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  registrationNumber: e.target.value,
                }))
              }
            />
            <Input
              label="Contact email"
              name="contactEmail"
              type="email"
              value={createForm.contactEmail}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  contactEmail: e.target.value,
                }))
              }
            />
            <Input
              label="Contact number"
              name="contactNumber"
              value={createForm.contactNumber}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  contactNumber: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label
              htmlFor="firm-about"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              About (optional)
            </label>
            <textarea
              id="firm-about"
              rows={3}
              value={createForm.about}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, about: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          {createError && (
            <p className="text-xs text-red-600">{createError}</p>
          )}
        </form>
      </Modal>
    </DashboardLayout>
  );
}
