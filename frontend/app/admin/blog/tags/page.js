'use client';

// Admin blog tags — like categories but lighter weight (no description).

import { useCallback, useEffect, useState } from 'react';
import {
  Hash,
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
  adminListTags,
  adminCreateTag,
  adminUpdateTag,
  adminDeleteTag,
} from '@/services/blogService';
import { ROLES } from '@/utils/constants';

const EMPTY_FORM = { name: '', slug: '' };

export default function AdminBlogTagsPage() {
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
      const rows = await adminListTags();
      setItems(rows);
    } catch (err) {
      setError(err.message || 'Failed to load tags.');
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
    setForm({ name: row.name || '', slug: row.slug || '' });
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
        await adminUpdateTag(editingId, form);
        setNotice('Tag updated.');
      } else {
        await adminCreateTag(form);
        setNotice('Tag created.');
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
      await adminDeleteTag(deleteTarget.id);
      setDeleteTarget(null);
      setNotice('Tag deleted.');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete.');
    }
  }

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Blog · Tags"
      subtitle="Tag a post with one or more keywords to power per-tag filtering"
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
              <Hash size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {items.length} tag{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={15} />
              Add tag
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Hash size={24} />}
            title="No tags yet"
            description="Tags appear on the post detail page and power the /blog?tagSlug filter."
            action={
              <Button onClick={openCreate}>
                <Plus size={15} />
                Add first tag
              </Button>
            }
          />
        ) : (
          <Card>
            <div className="flex flex-wrap gap-2">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 transition hover:border-amber-300"
                >
                  <span>#{t.name}</span>
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="ml-1 text-slate-400 transition hover:text-amber-700"
                    title="Edit"
                    aria-label="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    className="text-slate-400 transition hover:text-red-600"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={editingId ? 'Edit tag' : 'Add tag'}
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
            <Button variant="primary" size="sm" onClick={submit} disabled={submitting}>
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
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete tag"
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
            Delete <strong>#{deleteTarget.name}</strong>? Posts that carried
            this tag will lose it but won't be deleted.
          </p>
        )}
      </Modal>
    </DashboardLayout>
  );
}
