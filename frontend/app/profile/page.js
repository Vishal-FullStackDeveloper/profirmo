'use client';

// Role-based profile VIEW page.
// Auth-guarded. Renders Header + content + Footer. Fetches GET /api/profile
// (and GET /api/law-firm/mine for firm admins) and renders sections that
// depend on the signed-in user's role.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Briefcase,
  Building2,
  Scale,
  Code2,
  Globe,
  Linkedin,
  AlertCircle,
  Users,
  FileText,
  Eye,
} from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import DocumentPreviewModal from '@/components/common/DocumentPreviewModal';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/components/AuthProvider';
import { getProfile, getLawFirm } from '@/services/profileService';
import { formatDate, formatCurrency } from '@/utils/formatters';

const ROLE_LABELS = {
  client: 'Client',
  professional: 'Professional',
  firm_professional: 'Firm Professional',
  firm_admin: 'Law Firm Admin',
  platform_admin: 'Platform Admin',
};

function roleLabel(role) {
  return ROLE_LABELS[role] || 'Member';
}

// A labelled value row.
function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value || '—'}</dd>
    </div>
  );
}

// Render an array as chips. Items may be strings or objects.
function Chips({ items }) {
  const list = (Array.isArray(items) ? items : [])
    .map((it) => {
      if (typeof it === 'string') return it;
      if (it && typeof it === 'object') {
        return it.name || it.title || it.label || '';
      }
      return String(it);
    })
    .filter(Boolean);
  if (list.length === 0) return <span className="text-sm text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SectionCard({ icon, title, action, children }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
            {icon}
          </span>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

// Friendly file name derived from a stored URL.
function fileNameFromUrl(url) {
  if (!url) return 'Document';
  try {
    const clean = String(url).split('?')[0].split('#')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return decodeURIComponent(last) || 'Document';
  } catch {
    return 'Document';
  }
}

// A single document row with a Preview button that opens a preview modal.
function DocumentRow({ label, url, onPreview }) {
  if (!url) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600">
          <FileText size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {label}
          </p>
          <p className="truncate text-xs text-slate-500">
            {fileNameFromUrl(url)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPreview({ url, name: label })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Eye className="h-3.5 w-3.5" />
        Preview
      </button>
    </div>
  );
}

// Renders a list of documents from { label, url } entries (skips empties).
function DocumentsSection({ items, onPreview }) {
  const docs = (items || []).filter((d) => d && d.url);
  if (docs.length === 0) {
    return (
      <p className="text-sm text-slate-500">No documents uploaded yet.</p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {docs.map((d, i) => (
        <DocumentRow
          key={`${d.label}-${i}`}
          label={d.label}
          url={d.url}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-48 w-full animate-pulse rounded-xl bg-slate-100" />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-40 w-full animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [firmData, setFirmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // { url, name } of the document currently being previewed, or null.
  const [preview, setPreview] = useState(null);

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
      const data = await getProfile();
      setProfile(data);
      const role = (data && data.user && data.user.role) || authUser?.role;
      if (role === 'firm_admin') {
        try {
          const firm = await getLawFirm();
          setFirmData(firm);
        } catch {
          setFirmData({ lawFirm: null, members: [] });
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, load]);

  // While auth resolves or the visitor is being redirected.
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">
          <ProfileSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  const user = (profile && profile.user) || authUser || {};
  const role = user.role;
  const address = profile && profile.address;
  const professionalDetail = profile && profile.professionalDetail;
  const lawyerDetail = profile && profile.lawyerDetail;
  const techDetail = profile && profile.techDetail;
  const completion =
    profile && typeof profile.profileCompletion === 'number'
      ? profile.profileCompletion
      : 0;

  const fullName =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    'Your profile';

  const isProfessional =
    role === 'professional' || role === 'firm_professional';

  // Build the professional document list for display.
  const professionalDocuments = professionalDetail
    ? [
        { label: 'Profile resume', url: professionalDetail.profileResume },
        {
          label: 'License document',
          url: professionalDetail.licenseDocument,
        },
        {
          label: 'Identity document',
          url: professionalDetail.identityDocument,
        },
        ...(Array.isArray(professionalDetail.certificationsDocuments)
          ? professionalDetail.certificationsDocuments.map((url, i) => ({
              label: `Certification ${i + 1}`,
              url,
            }))
          : []),
      ].filter((d) => d.url)
    : [];

  // Build the law firm document list for display.
  const firm = firmData && firmData.lawFirm;
  const firmDocuments = firm
    ? [
        {
          label: 'Registration certificate',
          url: firm.registrationCertificate,
        },
        { label: 'Business license', url: firm.businessLicense },
        ...(Array.isArray(firm.taxDocuments)
          ? firm.taxDocuments.map((url, i) => ({
              label: `Tax document ${i + 1}`,
              url,
            }))
          : firm.taxDocument
            ? [{ label: 'Tax document', url: firm.taxDocument }]
            : []),
      ].filter((d) => d.url)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <EmptyState
              icon={<AlertCircle size={24} />}
              title="Could not load your profile"
              description={error}
              action={
                <Button onClick={load} className="bg-amber-600 hover:bg-amber-700">
                  Retry
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
            {/* Profile header card */}
            <Card padding={false} className="overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-amber-400 via-amber-500 to-teal-500" />
              <div className="px-5 pb-5">
                <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <Avatar
                      src={user.profilePhoto}
                      name={fullName}
                      size="xl"
                      className="ring-4 ring-white"
                    />
                    <div className="pb-1">
                      <h1 className="text-xl font-bold text-slate-900">
                        {fullName}
                      </h1>
                      <span className="mt-1 inline-block">
                        <Badge variant="amber">{roleLabel(role)}</Badge>
                      </span>
                    </div>
                  </div>
                  <Button
                    href="/profile/edit"
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  {user.email && (
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{user.email}</span>
                    </span>
                  )}
                  {user.mobileNumber && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {user.mobileNumber}
                    </span>
                  )}
                  {(user.memberSince || user.createdAt) && (
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      Member since{' '}
                      {formatDate(user.memberSince || user.createdAt)}
                    </span>
                  )}
                </div>

                {/* Profile completion */}
                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">
                      Profile completion
                    </p>
                    <span className="text-sm font-bold text-amber-600">
                      {completion}%
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-500 transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Address — all roles */}
            <SectionCard icon={<MapPin size={16} />} title="Address">
              {address &&
              (address.addressLine ||
                address.city ||
                address.state ||
                address.country ||
                address.postalCode) ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Address line" value={address.addressLine} />
                  <Field label="City" value={address.city} />
                  <Field label="State" value={address.state} />
                  <Field label="Country" value={address.country} />
                  <Field label="Postal code" value={address.postalCode} />
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  No address added yet.{' '}
                  <a
                    href="/profile/edit"
                    className="font-medium text-amber-600 hover:underline"
                  >
                    Add your address
                  </a>
                  .
                </p>
              )}
            </SectionCard>

            {/* Professional details */}
            {isProfessional &&
              (professionalDetail ? (
                <>
                  <SectionCard
                    icon={<Briefcase size={16} />}
                    title="Professional details"
                  >
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Professional type"
                        value={professionalDetail.professionalType}
                      />
                      <Field
                        label="Designation"
                        value={professionalDetail.designation}
                      />
                      <Field
                        label="Organization"
                        value={professionalDetail.organization}
                      />
                      <Field
                        label="Experience"
                        value={
                          professionalDetail.yearsOfExperience != null
                            ? `${professionalDetail.yearsOfExperience} years`
                            : null
                        }
                      />
                      <div className="sm:col-span-2">
                        <Field label="Bio" value={professionalDetail.bio} />
                      </div>
                      {professionalDetail.about && (
                        <div className="sm:col-span-2">
                          <Field
                            label="About"
                            value={professionalDetail.about}
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Skills
                        </dt>
                        <dd className="mt-1">
                          <Chips items={professionalDetail.skills} />
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Expertise
                        </dt>
                        <dd className="mt-1">
                          <Chips items={professionalDetail.expertise} />
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Languages
                        </dt>
                        <dd className="mt-1">
                          <Chips items={professionalDetail.languages} />
                        </dd>
                      </div>
                      {professionalDetail.website && (
                        <Field
                          label="Website"
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-slate-400" />
                              {professionalDetail.website}
                            </span>
                          }
                        />
                      )}
                      {professionalDetail.linkedin && (
                        <Field
                          label="LinkedIn"
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              <Linkedin className="h-3.5 w-3.5 text-slate-400" />
                              {professionalDetail.linkedin}
                            </span>
                          }
                        />
                      )}
                    </dl>
                  </SectionCard>

                  {/* Lawyer sub-section */}
                  {professionalDetail.professionalType === 'Lawyer' &&
                    lawyerDetail && (
                      <SectionCard
                        icon={<Scale size={16} />}
                        title="Lawyer details"
                      >
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field
                            label="Bar registration number"
                            value={lawyerDetail.barRegistrationNumber}
                          />
                          <Field
                            label="Enrollment number"
                            value={lawyerDetail.enrollmentNumber}
                          />
                          <Field
                            label="License number"
                            value={lawyerDetail.licenseNumber}
                          />
                          <Field
                            label="Jurisdiction"
                            value={lawyerDetail.jurisdiction}
                          />
                          <Field
                            label="Law degree"
                            value={lawyerDetail.lawDegree}
                          />
                          <Field
                            label="Consultation fee"
                            value={
                              lawyerDetail.consultationFee != null
                                ? formatCurrency(lawyerDetail.consultationFee)
                                : null
                            }
                          />
                          <div className="sm:col-span-2">
                            <Field
                              label="Chamber address"
                              value={lawyerDetail.chamberAddress}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Practice areas
                            </dt>
                            <dd className="mt-1">
                              <Chips items={lawyerDetail.practiceAreas} />
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Court practice
                            </dt>
                            <dd className="mt-1">
                              <Chips items={lawyerDetail.courtPractice} />
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Availability
                            </dt>
                            <dd className="mt-1">
                              <Chips items={lawyerDetail.availability} />
                            </dd>
                          </div>
                        </dl>
                      </SectionCard>
                    )}

                  {/* Tech Consultant sub-section */}
                  {professionalDetail.professionalType ===
                    'Tech Consultant' &&
                    techDetail && (
                      <SectionCard
                        icon={<Code2 size={16} />}
                        title="Tech consultant details"
                      >
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field
                            label="Specialization"
                            value={techDetail.specialization}
                          />
                          <Field
                            label="Consultation fee"
                            value={
                              techDetail.consultationFee != null
                                ? formatCurrency(techDetail.consultationFee)
                                : null
                            }
                          />
                          <Field
                            label="GitHub profile"
                            value={techDetail.githubProfile}
                          />
                          <Field
                            label="Portfolio URL"
                            value={techDetail.portfolioUrl}
                          />
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Technologies
                            </dt>
                            <dd className="mt-1">
                              <Chips items={techDetail.technologies} />
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Certifications
                            </dt>
                            <dd className="mt-1">
                              <Chips items={techDetail.certifications} />
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Experience projects
                            </dt>
                            <dd className="mt-1">
                              <Chips
                                items={techDetail.experienceProjects}
                              />
                            </dd>
                          </div>
                        </dl>
                      </SectionCard>
                    )}

                  {/* Documents */}
                  <SectionCard
                    icon={<FileText size={16} />}
                    title="Documents"
                  >
                    <DocumentsSection
                      items={professionalDocuments}
                      onPreview={setPreview}
                    />
                  </SectionCard>
                </>
              ) : (
                <EmptyState
                  icon={<Briefcase size={24} />}
                  title="Complete your professional profile"
                  description="Add your expertise, experience and credentials so clients can find you."
                  action={
                    <Button
                      href="/profile/edit"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Complete professional profile
                    </Button>
                  }
                />
              ))}

            {/* Law firm — firm_admin */}
            {role === 'firm_admin' &&
              (firmData && firmData.lawFirm ? (
                <>
                  <SectionCard
                    icon={<Building2 size={16} />}
                    title="Law firm"
                  >
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Firm name"
                        value={
                          firmData.lawFirm.firmName || firmData.lawFirm.name
                        }
                      />
                      <Field
                        label="Registration number"
                        value={firmData.lawFirm.registrationNumber}
                      />
                      <Field
                        label="Established year"
                        value={firmData.lawFirm.establishedYear}
                      />
                      <Field
                        label="Headquarters"
                        value={firmData.lawFirm.headquarters}
                      />
                      <Field
                        label="Total employees"
                        value={firmData.lawFirm.totalEmployees}
                      />
                      <Field
                        label="Website"
                        value={firmData.lawFirm.website}
                      />
                      <Field
                        label="Contact email"
                        value={firmData.lawFirm.contactEmail}
                      />
                      <Field
                        label="Contact number"
                        value={firmData.lawFirm.contactNumber}
                      />
                      {firmData.lawFirm.about && (
                        <div className="sm:col-span-2">
                          <Field
                            label="About"
                            value={firmData.lawFirm.about}
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Practice areas
                        </dt>
                        <dd className="mt-1">
                          <Chips items={firmData.lawFirm.practiceAreas} />
                        </dd>
                      </div>
                    </dl>
                  </SectionCard>

                  {/* Firm documents */}
                  <SectionCard
                    icon={<FileText size={16} />}
                    title="Documents"
                  >
                    <DocumentsSection
                      items={firmDocuments}
                      onPreview={setPreview}
                    />
                  </SectionCard>

                  <SectionCard
                    icon={<Users size={16} />}
                    title="Team members"
                    action={
                      <Button
                        href="/profile/edit"
                        variant="outline"
                        size="sm"
                      >
                        Manage team
                      </Button>
                    }
                  >
                    {firmData.members && firmData.members.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {firmData.members.map((m) => {
                          const name =
                            m.fullName ||
                            m.name ||
                            [m.firstName, m.lastName]
                              .filter(Boolean)
                              .join(' ') ||
                            m.email ||
                            'Member';
                          return (
                            <li
                              key={m.id || m._id || m.email}
                              className="flex items-center justify-between gap-3 py-3"
                            >
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={m.profilePhoto}
                                  name={name}
                                  size="sm"
                                />
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {m.email}
                                    {m.professionalType
                                      ? ` · ${m.professionalType}`
                                      : ''}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  m.status === 'active'
                                    ? 'green'
                                    : m.status === 'pending'
                                      ? 'amber'
                                      : 'gray'
                                }
                              >
                                {m.status || 'member'}
                              </Badge>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No team members yet.
                      </p>
                    )}
                  </SectionCard>
                </>
              ) : (
                <EmptyState
                  icon={<Building2 size={24} />}
                  title="Create your law firm"
                  description="Set up your firm profile to start managing your team and clients."
                  action={
                    <Button
                      href="/profile/edit"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Create law firm
                    </Button>
                  }
                />
              ))}
          </div>
        )}
      </main>
      <Footer />

      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        url={preview ? preview.url : ''}
        name={preview ? preview.name : ''}
      />
    </div>
  );
}
