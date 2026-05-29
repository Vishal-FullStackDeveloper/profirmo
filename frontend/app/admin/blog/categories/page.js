'use client';

// Admin blog categories — flat list + inline create/rename/delete.

import { useCallback, useEffect, useState } from 'react';
import {
  ListTree,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '@/services/blogService';
import { ROLES } from '@/utils/constants';

const EMPTY_FORM = { name: '', slug: '', description: '' };

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await adminListCategories();
      setItems(rows);
    } catch (err) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }
  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      slug: row.slug || '',
      description: row.description || '',
    });
    setOpen(true);
  }

  async function submit() {
    if (submitting) return;
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await adminUpdateCategory(editingId, form);
        setNotice('Category updated.');
      } else {
        await adminCreateCategory(form);
        setNotice('Category created.');
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await adminDeleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      setNotice('Category deleted.');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete.');
    }
  }

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Blog · Categories"
      subtitle="Filter chips on /blog and the per-post category dropdown read from this list"
    >
      <div className="space-y-4">
        {notice && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="text-xs font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ListTree size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {items.length} categor{items.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={15} />
              Add category
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 w-full animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ListTree size={24} />}
            title="No categories yet"
            description="Categories help readers filter the journal."
            action={
              <Button onClick={openCreate}>
                <Plus size={15} />
                Add first category
              </Button>
            }
          />
        ) : (
          <Card padding={false}>
            <ul className="divide-y divide-slate-100">
              {items.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="font-mono text-[11px] text-slate-400">
                      /{c.slug}
                    </p>
                    {c.description && (
                      <p className="mt-1 text-xs text-slate-600">{c.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(c)}
                      title="Edit"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget(c)}
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={editingId ? 'Edit category' : 'Add category'}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
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
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Slug (optional)"
            name="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="auto-generated from name"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete category"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-slate-600">
            Delete <strong>{deleteTarget.name}</strong>? Posts that used this
            category will lose the link (but won't be deleted).
          </p>
        )}
      </Modal>
    </DashboardLayout>
  );
}
