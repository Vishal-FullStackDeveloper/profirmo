'use client';

// Admin — App Settings: cities.
// Flat list of cities with add / edit / delete. The list drives every city
// dropdown across the platform (signup, profile, search filters, etc.).

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Search,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import {
  adminListCities,
  adminCreateCity,
  adminUpdateCity,
  adminDeleteCity,
} from '@/services/appSettingsService';
import { invalidateAppSettings } from '@/hooks/useAppSettings';

const EMPTY_FORM = { name: '', sortOrder: 0, active: true };

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function AdminCitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(null); // { mode, target?, form }
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const isAdmin = user && user.role === ROLES.PLATFORM_ADMIN;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListCities({
        search: search ? search : undefined,
      });
      setCities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load cities.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) load();
  }, [authLoading, isAuthenticated, isAdmin, load]);

  function applySearch(e) {
    if (e) e.preventDefault();
    setSearch(searchInput.trim());
  }

  function openCreate() {
    setModalError('');
    setModal({ mode: 'create', form: { ...EMPTY_FORM } });
  }
  function openEdit(city) {
    setModalError('');
    setModal({
      mode: 'edit',
      target: city,
      form: {
        name: city.name,
        sortOrder: city.sortOrder || 0,
        active: !!city.active,
      },
    });
  }
  function openDelete(city) {
    setModalError('');
    setModal({ mode: 'delete', target: city });
  }
  function close() {
    if (submitting) return;
    setModal(null);
    setModalError('');
  }

  async function submit(e) {
    if (e) e.preventDefault();
    if (!modal || submitting) return;
    setSubmitting(true);
    setModalError('');
    try {
      if (modal.mode === 'create') {
        await adminCreateCity({
          name: modal.form.name.trim(),
          sortOrder: Number(modal.form.sortOrder) || 0,
          active: modal.form.active,
        });
      } else if (modal.mode === 'edit') {
        await adminUpdateCity(modal.target.id, {
          name: modal.form.name.trim(),
          sortOrder: Number(modal.form.sortOrder) || 0,
          active: modal.form.active,
        });
      } else if (modal.mode === 'delete') {
        await adminDeleteCity(modal.target.id);
      }
      invalidateAppSettings();
      setModal(null);
      await load();
    } catch (err) {
      setModalError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) {
    return <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Cities" />;
  }
  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Cities">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to manage cities."
          action={
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Cities"
      subtitle="Drive every city dropdown across the platform"
    >
      <div className="space-y-6">
        <Card>
          <form
            onSubmit={applySearch}
            className="flex flex-wrap items-end gap-2"
          >
            <Input
              label="Search"
              name="city-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="City name…"
            />
            <Button type="submit" variant="outline">
              <Search size={15} />
              Search
            </Button>
          </form>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <MapPin size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {loading
                ? 'Loading…'
                : `${cities.length} cit${cities.length === 1 ? 'y' : 'ies'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={15} />
              Add city
            </Button>
          </div>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </span>
              <p className="text-sm font-medium text-slate-700">{error}</p>
              <Button size="sm" onClick={load}>
                <RefreshCw size={15} />
                Try again
              </Button>
            </div>
          </Card>
        ) : cities.length === 0 ? (
          <EmptyState
            icon={<MapPin size={24} />}
            title="No cities yet"
            description="Add the cities your professionals operate in to populate location dropdowns."
            action={<Button onClick={openCreate}>Add city</Button>}
          />
        ) : (
          <Card>
            <ul className="divide-y divide-slate-100">
              {cities.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {c.name}
                    </span>
                    <Badge variant={c.active ? 'green' : 'gray'}>
                      {c.active ? 'Active' : 'Hidden'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Sort #{c.sortOrder}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDelete(c)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Create / edit modal */}
      <Modal
        open={!!modal && modal.mode !== 'delete'}
        onClose={close}
        title={modal && modal.mode === 'edit' ? 'Edit city' : 'Add city'}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={close}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submit}
              disabled={submitting}
            >
              {submitting
                ? 'Saving…'
                : modal && modal.mode === 'edit'
                  ? 'Save changes'
                  : 'Create city'}
            </Button>
          </>
        }
      >
        {modal && modal.mode !== 'delete' && (
          <form onSubmit={submit} className="space-y-3">
            <Input
              label="Name"
              name="name"
              value={modal.form.name}
              onChange={(e) =>
                setModal((m) => ({
                  ...m,
                  form: { ...m.form, name: e.target.value },
                }))
              }
              required
              placeholder="e.g. Mumbai"
            />
            <Input
              label="Sort order"
              name="sortOrder"
              type="number"
              value={modal.form.sortOrder}
              onChange={(e) =>
                setModal((m) => ({
                  ...m,
                  form: { ...m.form, sortOrder: e.target.value },
                }))
              }
              hint="Lower numbers appear first"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={modal.form.active}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    form: { ...m.form, active: e.target.checked },
                  }))
                }
              />
              Active (visible in dropdowns)
            </label>
            <button type="submit" className="hidden" aria-hidden="true" />
          </form>
        )}
        {modalError && <p className="mt-3 text-xs text-red-600">{modalError}</p>}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!modal && modal.mode === 'delete'}
        onClose={close}
        title="Delete city"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={close}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? 'Deleting…' : 'Delete city'}
            </Button>
          </>
        }
      >
        {modal && modal.mode === 'delete' && (
          <p className="text-sm text-slate-600">
            Permanently delete <strong>{modal.target.name}</strong>? This city
            will disappear from every dropdown. Existing profiles already saved
            with this city will keep their stored value.
          </p>
        )}
        {modalError && <p className="mt-3 text-xs text-red-600">{modalError}</p>}
      </Modal>
    </DashboardLayout>
  );
}
