'use client';

// AddClientModal — a multi-step modal a professional (or firm owner) uses to
// add a client. Steps:
//   1. lookup    — enter a phone number; query /api/clients/search-by-phone
//   2. foundUser — an existing client-user matched; offer to link them
//   3. newForm   — no match; collect name/email/city/type and create one
//
// The created/linked client is always stored as a `users` row with
// role='client'. The caller (always a professional) is linked to the client
// via `professional_clients`. When the caller is a firm owner, that link is
// what surfaces the client in the firm-wide client list.

import { useState } from 'react';
import { Search } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import clientService from '@/services/clientService';

const USER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
];

const EMPTY_NEW_FORM = {
  name: '',
  email: '',
  city: '',
  userType: 'individual',
};

/**
 * Props:
 *  - open: boolean
 *  - onClose(): closes the modal (also called after a successful add)
 *  - onAdded(result): optional — invoked with the API result, callers
 *      typically use this to refresh their list and surface an invite notice
 *      (result.inviteSent === true means an invitation email was sent).
 */
export default function AddClientModal({ open, onClose, onAdded }) {
  const [step, setStep] = useState('lookup'); // lookup | foundUser | newForm
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [newForm, setNewForm] = useState(EMPTY_NEW_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function reset() {
    setStep('lookup');
    setPhone('');
    setSearching(false);
    setSearchError('');
    setFoundUser(null);
    setNewForm(EMPTY_NEW_FORM);
    setSubmitting(false);
    setSubmitError('');
  }

  function handleClose() {
    if (searching || submitting) return;
    reset();
    if (typeof onClose === 'function') onClose();
  }

  async function submitLookup(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (searching) return;
    const trimmed = phone.trim();
    if (!trimmed) {
      setSearchError('Enter a phone number to look up.');
      return;
    }
    setSearchError('');
    setSearching(true);
    try {
      const result = await clientService.searchByPhone(trimmed);
      const user = result && result.user;
      if (user) {
        setFoundUser(user);
        setStep('foundUser');
      } else {
        setNewForm((f) => ({ ...f, name: '', email: '', city: '' }));
        setStep('newForm');
      }
    } catch (err) {
      setSearchError(err.message || 'Lookup failed.');
    } finally {
      setSearching(false);
    }
  }

  async function linkFoundUser() {
    if (!foundUser || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await clientService.linkExisting(foundUser.id);
      if (typeof onAdded === 'function') await onAdded(result);
      reset();
      onClose && onClose();
    } catch (err) {
      setSubmitError(err.message || 'Could not link client.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewClient(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    if (!newForm.name.trim()) {
      setSubmitError('Name is required.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const created = await clientService.create({
        name: newForm.name.trim(),
        email: newForm.email.trim(),
        phone: phone.trim(),
        city: newForm.city.trim(),
        userType: newForm.userType,
      });
      if (typeof onAdded === 'function') await onAdded(created);
      reset();
      onClose && onClose();
    } catch (err) {
      setSubmitError(err.message || 'Could not create client.');
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    step === 'lookup'
      ? 'Add client'
      : step === 'foundUser'
        ? 'Platform user found'
        : 'New client details';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        step === 'lookup' ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={searching}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitLookup}
              disabled={searching || !phone.trim()}
            >
              <Search size={14} />
              {searching ? 'Looking up…' : 'Look up'}
            </Button>
          </>
        ) : step === 'foundUser' ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('lookup')}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={linkFoundUser}
              disabled={submitting}
            >
              {submitting ? 'Adding…' : 'Use this user'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('lookup')}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitNewClient}
              disabled={submitting || !newForm.name.trim()}
            >
              {submitting ? 'Creating…' : 'Add as new client'}
            </Button>
          </>
        )
      }
    >
      {step === 'lookup' && (
        <form onSubmit={submitLookup} className="space-y-3">
          <Input
            label="Phone number"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            required
            hint="We will look this phone up against existing platform users."
          />
          <button type="submit" className="hidden" aria-hidden="true" />
          {searchError && (
            <p className="text-xs text-red-600">{searchError}</p>
          )}
        </form>
      )}

      {step === 'foundUser' && foundUser && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            We found a platform user with this phone number. Add them as your
            client.
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Avatar
              src={foundUser.profilePhoto}
              name={foundUser.name || foundUser.email || 'User'}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {foundUser.name || '—'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {foundUser.email || '—'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {foundUser.phone || ''}
              </p>
            </div>
            {foundUser.role && <Badge variant="gray">{foundUser.role}</Badge>}
          </div>
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        </div>
      )}

      {step === 'newForm' && (
        <form onSubmit={submitNewClient} className="space-y-3">
          <p className="text-sm text-slate-600">
            No match found. Fill in the details to add this person as a new
            client.
          </p>
          <Input
            label="Phone number"
            name="newPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Name"
            name="name"
            value={newForm.name}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, name: e.target.value }))
            }
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={newForm.email}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="Optional"
            hint="Provide an email so the client receives an invitation to claim their account."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="City"
              name="city"
              value={newForm.city}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, city: e.target.value }))
              }
              placeholder="Optional"
            />
            <Select
              label="Client type"
              name="userType"
              value={newForm.userType}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, userType: e.target.value }))
              }
              options={USER_TYPE_OPTIONS}
            />
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        </form>
      )}
    </Modal>
  );
}
