'use client';

// FirmMembersTable — reusable team-member management table for firm admins.
// Renders a responsive table of members with per-row Edit (role/status) and
// Remove actions, plus an "Add member" modal. Calls profileService directly
// and refetches via the `onChanged` callback after each successful action.

import { useState } from 'react';
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import Avatar from '@/components/common/Avatar';
import { formatDate } from '@/utils/formatters';
import {
  addFirmMember,
  updateFirmMember,
  removeFirmMember,
} from '@/services/profileService';

const ROLE_OPTIONS = [
  { value: 'firm_professional', label: 'Firm Professional' },
  { value: 'firm_admin', label: 'Firm Admin' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

const ROLE_LABELS = {
  firm_professional: 'Firm Professional',
  firm_admin: 'Firm Admin',
  professional: 'Professional',
};

const STATUS_VARIANTS = {
  active: 'green',
  pending: 'amber',
  inactive: 'gray',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function memberName(m) {
  return (
    m.fullName ||
    m.name ||
    [m.firstName, m.lastName].filter(Boolean).join(' ') ||
    m.email ||
    'Member'
  );
}

/**
 * FirmMembersTable
 * Props:
 *  - members: array of member objects
 *  - onChanged: () => Promise<void> | void — called after a successful mutation
 */
export default function FirmMembersTable({ members = [], onChanged }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  // Add-member form state.
  const [addForm, setAddForm] = useState({
    email: '',
    role: 'firm_professional',
  });
  const [addErr, setAddErr] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  // Edit-member form state.
  const [editForm, setEditForm] = useState({ role: '', status: '' });
  const [editErr, setEditErr] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  // Remove state.
  const [removeErr, setRemoveErr] = useState('');
  const [removeBusy, setRemoveBusy] = useState(false);

  async function refresh() {
    if (typeof onChanged === 'function') {
      await onChanged();
    }
  }

  function openAdd() {
    setAddForm({ email: '', role: 'firm_professional' });
    setAddErr('');
    setAddOpen(true);
  }

  async function submitAdd() {
    const email = addForm.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      setAddErr('Enter a valid email address.');
      return;
    }
    setAddBusy(true);
    setAddErr('');
    try {
      await addFirmMember({ email, role: addForm.role });
      setAddOpen(false);
      await refresh();
    } catch (err) {
      setAddErr(err.message || 'Could not add member.');
    } finally {
      setAddBusy(false);
    }
  }

  function openEdit(member) {
    setEditing(member);
    setEditForm({
      role: member.role || 'firm_professional',
      status: member.status || 'active',
    });
    setEditErr('');
  }

  async function submitEdit() {
    if (!editing) return;
    setEditBusy(true);
    setEditErr('');
    try {
      await updateFirmMember(editing.id || editing._id, {
        role: editForm.role,
        status: editForm.status,
      });
      setEditing(null);
      await refresh();
    } catch (err) {
      setEditErr(err.message || 'Could not update member.');
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    setRemoveErr('');
    try {
      await removeFirmMember(removing.id || removing._id);
      setRemoving(null);
      await refresh();
    } catch (err) {
      setRemoveErr(err.message || 'Could not remove member.');
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </p>
        <Button size="sm" onClick={openAdd} className="bg-amber-600 hover:bg-amber-700">
          <UserPlus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No team members yet"
          description="Invite professionals to join your firm to get started."
          action={
            <Button size="sm" onClick={openAdd} className="bg-amber-600 hover:bg-amber-700">
              <UserPlus className="h-4 w-4" />
              Add member
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const id = m.id || m._id;
                const name = memberName(m);
                return (
                  <tr key={id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={m.profilePhoto}
                          name={name}
                          size="sm"
                        />
                        <span className="font-medium text-slate-800">
                          {name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.professionalType || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ROLE_LABELS[m.role] || m.role || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[m.status] || 'gray'}>
                        {m.status || 'unknown'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.joinedAt || m.createdAt
                        ? formatDate(m.joinedAt || m.createdAt)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          aria-label={`Edit ${name}`}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRemoving(m);
                            setRemoveErr('');
                          }}
                          aria-label={`Remove ${name}`}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add member modal */}
      <Modal
        open={addOpen}
        onClose={() => (addBusy ? null : setAddOpen(false))}
        title="Add team member"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={addBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAdd}
              disabled={addBusy}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {addBusy ? 'Adding…' : 'Add member'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Enter the email of an existing professional account to invite them
            to your firm.
          </p>
          <Input
            label="Email address"
            name="add-email"
            type="email"
            required
            value={addForm.email}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="member@example.com"
            error={addErr || undefined}
          />
          <Select
            label="Role"
            name="add-role"
            value={addForm.role}
            onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
            options={ROLE_OPTIONS}
          />
        </div>
      </Modal>

      {/* Edit member modal */}
      <Modal
        open={!!editing}
        onClose={() => (editBusy ? null : setEditing(null))}
        title={editing ? `Edit ${memberName(editing)}` : 'Edit member'}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={editBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={editBusy}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {editBusy ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Role"
            name="edit-role"
            value={editForm.role}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, role: e.target.value }))
            }
            options={ROLE_OPTIONS}
          />
          <Select
            label="Status"
            name="edit-status"
            value={editForm.status}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, status: e.target.value }))
            }
            options={STATUS_OPTIONS}
          />
          {editErr && <p className="text-sm text-red-600">{editErr}</p>}
        </div>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        open={!!removing}
        onClose={() => (removeBusy ? null : setRemoving(null))}
        title="Remove team member"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setRemoving(null)}
              disabled={removeBusy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmRemove}
              disabled={removeBusy}
            >
              {removeBusy ? 'Removing…' : 'Remove'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove{' '}
          <span className="font-semibold text-slate-800">
            {removing ? memberName(removing) : 'this member'}
          </span>{' '}
          from your firm? This action cannot be undone.
        </p>
        {removeErr && <p className="mt-3 text-sm text-red-600">{removeErr}</p>}
      </Modal>
    </div>
  );
}
