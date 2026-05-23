'use client';

// Admin — firm review detail.
// Auth-guarded and admin-only (platform_admin). Shows the full firm profile
// for review and exposes approve / reject / request-modifications actions.

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  FileText,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import DocumentPreviewModal from '@/components/common/DocumentPreviewModal';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/formatters';
import { resolveFileUrl } from '@/services/fileService';
import {
  getFirmReview,
  approveFirm,
  rejectFirm,
  requestFirmModifications,
} from '@/services/adminService';

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

/** Build a display name from a user object. */
function userName(user) {
  if (!user) return 'Unknown owner';
  if (user.fullName) return user.fullName;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : user.email || 'Unknown owner';
}

/** Section wrapper with an icon heading. */
function Section({ icon, title, children }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

/** A single label/value pair. Renders nothing when the value is empty. */
function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-800 break-words">{value}</dd>
    </div>
  );
}

/** A link field that opens in a new tab. */
function LinkField({ label, value }) {
  if (!value || typeof value !== 'string' || !value.trim()) return null;
  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return (
    <Field
      label={label}
      value={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 hover:underline"
        >
          {value}
        </a>
      }
    />
  );
}

/** Chip list rendered from an array or comma-separated string. */
function ChipList({ label, value }) {
  let items = [];
  if (Array.isArray(value)) {
    items = value.filter(Boolean);
  } else if (typeof value === 'string' && value.trim()) {
    items = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (items.length === 0) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700"
          >
            {item}
          </span>
        ))}
      </dd>
    </div>
  );
}

/** Status → { label, variant } for the approval status badge. */
function statusBadge(status) {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE':
      return { label: 'Approved', variant: 'green' };
    case 'REJECTED':
      return { label: 'Rejected', variant: 'red' };
    case 'MODIFICATIONS_REQUESTED':
      return { label: 'Modifications requested', variant: 'blue' };
    case 'PENDING_APPROVAL':
    default:
      return { label: 'Pending approval', variant: 'amber' };
  }
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-40 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminFirmReviewPage() {
  const router = useRouter();
  const params = useParams();
  const approvalId = params && params.id;
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Document preview modal state.
  const [preview, setPreview] = useState(null); // { url, name }

  // Action modal state.
  const [rejectOpen, setRejectOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [modMessage, setModMessage] = useState('');

  // Action feedback / loading.
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const isAdmin = user && user.role === ROLES.PLATFORM_ADMIN;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!approvalId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getFirmReview(approvalId);
      setReview(data || null);
    } catch (err) {
      setError(err.message || 'Failed to load the firm review.');
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      load();
    }
  }, [authLoading, isAuthenticated, isAdmin, load]);

  // ----- Actions -----------------------------------------------------------

  async function handleApprove() {
    if (submitting) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Approve this firm? It will become active and notified.')
    ) {
      return;
    }
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await approveFirm(approvalId);
      setActionSuccess('Firm approved. Returning to the list…');
      setTimeout(() => router.push('/admin/firms'), 900);
    } catch (err) {
      setActionError(err.message || 'Failed to approve.');
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (submitting) return;
    if (!reason.trim()) {
      setActionError('A reason is required to reject.');
      return;
    }
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await rejectFirm(approvalId, reason.trim());
      setRejectOpen(false);
      setActionSuccess('Firm rejected. Returning to the list…');
      setTimeout(() => router.push('/admin/firms'), 900);
    } catch (err) {
      setActionError(err.message || 'Failed to reject.');
      setSubmitting(false);
    }
  }

  async function handleRequestMods() {
    if (submitting) return;
    if (!modMessage.trim()) {
      setActionError('A message is required to request modifications.');
      return;
    }
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await requestFirmModifications(approvalId, modMessage.trim());
      setModOpen(false);
      setModMessage('');
      setActionSuccess('Modification request sent. Reloading…');
      setSubmitting(false);
      await load();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to send the request.');
      setSubmitting(false);
    }
  }

  // ----- Guards ------------------------------------------------------------

  if (authLoading || !isAuthenticated) {
    return <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Review firm" />;
  }

  if (!isAdmin) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Review firm">
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="You need a platform administrator account to review firms."
          action={
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  // ----- Loading / error ---------------------------------------------------

  if (loading) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Review firm">
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !review) {
    return (
      <DashboardLayout role={ROLES.PLATFORM_ADMIN} title="Review firm">
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              {error || 'This firm review could not be found.'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" href="/admin/firms">
                <ArrowLeft size={15} />
                Back to list
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

  // ----- Data --------------------------------------------------------------

  const { approval = {}, lawFirm = {}, owner = {} } = review;
  const firm = lawFirm || {};

  const name = firm.name || firm.firmName || 'Unknown firm';
  const badge = statusBadge(approval.status);
  const decided =
    approval.status === 'APPROVED' ||
    approval.status === 'REJECTED' ||
    approval.status === 'ACTIVE';

  const logoUrl = resolveFileUrl(firm.logo || '');

  // Collect all non-empty documents.
  const documents = [];
  if (firm.registrationCertificate) {
    documents.push({
      label: 'Registration certificate',
      url: firm.registrationCertificate,
    });
  }
  if (firm.businessLicense) {
    documents.push({
      label: 'Business license',
      url: firm.businessLicense,
    });
  }
  if (Array.isArray(firm.taxDocuments)) {
    firm.taxDocuments
      .filter((d) => d && (typeof d === 'string' ? d : d.url))
      .forEach((d, i) => {
        const url = typeof d === 'string' ? d : d.url;
        const label =
          (typeof d === 'object' && (d.name || d.label)) ||
          `Tax document ${i + 1}`;
        documents.push({ label, url });
      });
  } else if (firm.taxDocuments && typeof firm.taxDocuments === 'string') {
    documents.push({ label: 'Tax document', url: firm.taxDocuments });
  }

  // Social links — handle either a nested object or flat fields.
  const social = firm.socialLinks || firm.social || {};
  const socialEntries = [
    ['Website', firm.website || firm.websiteUrl],
    ['LinkedIn', social.linkedin || social.linkedIn || firm.linkedin],
    ['Twitter', social.twitter || firm.twitter],
    ['Facebook', social.facebook || firm.facebook],
    ['Instagram', social.instagram || firm.instagram],
  ].filter(([, v]) => v && typeof v === 'string' && v.trim());

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="Review firm"
      subtitle={name}
    >
      <div className="space-y-6">
        {/* Back link */}
        <div>
          <Button size="sm" variant="ghost" href="/admin/firms">
            <ArrowLeft size={15} />
            Back to firm approvals
          </Button>
        </div>

        {/* Action / success / error feedback */}
        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            {actionSuccess}
          </div>
        )}
        {actionError && !rejectOpen && !modOpen && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} />
            {actionError}
          </div>
        )}

        {/* Firm */}
        <Section icon={<Building2 size={16} />} title="Firm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={name}
                className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-xl font-semibold text-white">
                {getInitials(name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {name}
                </h3>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Firm type" value={firm.firmType || firm.type} />
                <Field
                  label="Registration number"
                  value={firm.registrationNumber}
                />
                <Field
                  label="Establishment year"
                  value={
                    firm.establishmentYear || firm.establishedYear
                      ? String(firm.establishmentYear || firm.establishedYear)
                      : null
                  }
                />
                <Field
                  label="Total employees"
                  value={
                    firm.totalEmployees !== undefined &&
                    firm.totalEmployees !== null
                      ? String(firm.totalEmployees)
                      : firm.employeeCount !== undefined &&
                        firm.employeeCount !== null
                      ? String(firm.employeeCount)
                      : null
                  }
                />
                <Field
                  label="Headquarters"
                  value={
                    firm.headquarters ||
                    firm.headquartersAddress ||
                    [firm.city, firm.state, firm.country]
                      .filter(Boolean)
                      .join(', ') ||
                    null
                  }
                />
                <Field
                  label="Contact email"
                  value={firm.contactEmail || firm.email}
                />
                <Field
                  label="Contact phone"
                  value={
                    firm.contactPhone || firm.phone || firm.contactNumber
                  }
                />
                <LinkField label="Website" value={firm.website} />
                <Field
                  label="Submitted"
                  value={formatDate(approval.submittedAt)}
                />
              </dl>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChipList
                  label="Practice areas"
                  value={firm.practiceAreas || firm.specializations}
                />
              </div>
              {socialEntries.length > 0 && (
                <div className="mt-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Social links
                  </dt>
                  <dd className="flex flex-wrap gap-3">
                    {socialEntries.map(([label, url]) => {
                      const href = /^https?:\/\//i.test(url)
                        ? url
                        : `https://${url}`;
                      return (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-600 hover:underline"
                        >
                          {label}
                        </a>
                      );
                    })}
                  </dd>
                </div>
              )}
              {(firm.description || firm.about) && (
                <div className="mt-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    About
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {firm.description || firm.about}
                  </dd>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Owner */}
        <Section icon={<User size={16} />} title="Owner">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" value={userName(owner)} />
            <Field label="Email" value={owner && owner.email} />
            <Field
              label="Mobile"
              value={owner && (owner.mobileNumber || owner.mobile)}
            />
          </dl>
        </Section>

        {/* Documents */}
        <Section icon={<FileText size={16} />} title="Documents">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc, i) => (
                <div
                  key={`${doc.label}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <FileText size={16} />
                    </span>
                    <p className="truncate text-sm font-medium text-slate-700">
                      {doc.label}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPreview({
                        url: resolveFileUrl(doc.url),
                        name: doc.label,
                      })
                    }
                  >
                    <Eye size={15} />
                    Preview
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Action bar OR decision */}
        {decided ? (
          <Card
            className={
              approval.status === 'REJECTED'
                ? 'border-red-200 bg-red-50'
                : 'border-emerald-200 bg-emerald-50'
            }
          >
            <div className="flex items-start gap-3">
              {approval.status === 'REJECTED' ? (
                <XCircle size={20} className="mt-0.5 text-red-600" />
              ) : (
                <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  This firm has already been{' '}
                  {approval.status === 'REJECTED' ? 'rejected' : 'approved'}.
                </p>
                {approval.decisionReason && (
                  <p className="mt-1 text-sm text-slate-600">
                    {approval.decisionReason}
                  </p>
                )}
                {approval.rejectionReason && (
                  <p className="mt-1 text-sm text-slate-600">
                    {approval.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="sticky bottom-4 z-10 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-700">
                Decide on this firm
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionError('');
                    setModOpen(true);
                  }}
                  disabled={submitting}
                >
                  <MessageSquare size={15} />
                  Request modifications
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setActionError('');
                    setReason('');
                    setRejectOpen(true);
                  }}
                  disabled={submitting}
                >
                  <X size={15} />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  <Check size={15} />
                  {submitting ? 'Working…' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document preview */}
      <DocumentPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        url={preview ? preview.url : ''}
        name={preview ? preview.name : ''}
      />

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        onClose={() => !submitting && setRejectOpen(false)}
        title="Reject firm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? 'Rejecting…' : 'Confirm reject'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Provide a reason for rejecting this firm. They will see this message.
        </p>
        <label
          htmlFor="reject-reason"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reject-reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this firm is being rejected…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
        {actionError && rejectOpen && (
          <p className="mt-2 text-xs text-red-600">{actionError}</p>
        )}
      </Modal>

      {/* Request modifications modal */}
      <Modal
        open={modOpen}
        onClose={() => !submitting && setModOpen(false)}
        title="Request modifications"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRequestMods}
              disabled={submitting || !modMessage.trim()}
            >
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Tell the firm what needs to be changed or corrected. They will be
          able to resubmit.
        </p>
        <label
          htmlFor="mod-message"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="mod-message"
          rows={4}
          value={modMessage}
          onChange={(e) => setModMessage(e.target.value)}
          placeholder="Describe what needs to be modified or clarified…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        {actionError && modOpen && (
          <p className="mt-2 text-xs text-red-600">{actionError}</p>
        )}
      </Modal>
    </DashboardLayout>
  );
}
