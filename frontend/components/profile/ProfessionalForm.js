'use client';

// ProfessionalForm — edits professional details for `professional` and
// `firm_professional` roles. Shows a Lawyer or Tech Consultant sub-form
// depending on the selected professionalType. Saves via
// PUT /api/profile/professional.

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import FileUpload from '@/components/common/FileUpload';
import { updateProfessionalDetails } from '@/services/profileService';

const PROFESSIONAL_TYPES = [
  { value: 'Lawyer', label: 'Lawyer' },
  { value: 'Tech Consultant', label: 'Tech Consultant' },
  { value: 'Tax Consultant', label: 'Tax Consultant' },
  { value: 'Business Consultant', label: 'Business Consultant' },
  { value: 'CA', label: 'CA' },
  { value: 'Other', label: 'Other' },
];

// Comma-separated string -> trimmed, de-empt array.
function toArray(str) {
  if (!str) return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Array -> comma-separated string (for prefilling text inputs).
function toCsv(arr) {
  if (!Array.isArray(arr)) return '';
  return arr
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.name || item.title || item.label || '';
      }
      return String(item);
    })
    .filter(Boolean)
    .join(', ');
}

function buildInitialState(detail, lawyer, tech) {
  const d = detail || {};
  const l = lawyer || {};
  const t = tech || {};
  return {
    professionalType: d.professionalType || 'Lawyer',
    designation: d.designation || '',
    organization: d.organization || '',
    yearsOfExperience:
      d.yearsOfExperience === 0 || d.yearsOfExperience
        ? String(d.yearsOfExperience)
        : '',
    bio: d.bio || '',
    about: d.about || '',
    skills: toCsv(d.skills),
    expertise: toCsv(d.expertise),
    languages: toCsv(d.languages),
    certifications: toCsv(d.certifications),
    education: toCsv(d.education),
    achievements: toCsv(d.achievements),
    website: d.website || '',
    linkedin: d.linkedin || '',
    profileResume: d.profileResume || '',
    licenseDocument: d.licenseDocument || '',
    identityDocument: d.identityDocument || '',
    certificationsDocuments: Array.isArray(d.certificationsDocuments)
      ? d.certificationsDocuments.filter(Boolean)
      : [],
    // Lawyer sub-form
    barRegistrationNumber: l.barRegistrationNumber || '',
    enrollmentNumber: l.enrollmentNumber || '',
    licenseNumber: l.licenseNumber || '',
    practiceAreas: toCsv(l.practiceAreas),
    courtPractice: toCsv(l.courtPractice),
    jurisdiction: l.jurisdiction || '',
    lawDegree: l.lawDegree || '',
    chamberAddress: l.chamberAddress || '',
    lawyerConsultationFee:
      l.consultationFee === 0 || l.consultationFee
        ? String(l.consultationFee)
        : '',
    availability: toCsv(l.availability),
    // Tech sub-form
    technologies: toCsv(t.technologies),
    specialization: t.specialization || '',
    githubProfile: t.githubProfile || '',
    portfolioUrl: t.portfolioUrl || '',
    techCertifications: toCsv(t.certifications),
    experienceProjects: toCsv(t.experienceProjects),
    techConsultationFee:
      t.consultationFee === 0 || t.consultationFee
        ? String(t.consultationFee)
        : '',
  };
}

/**
 * ProfessionalForm
 * Props:
 *  - professionalDetail, lawyerDetail, techDetail: prefill data
 *  - onSaved: (refreshedProfile) => void
 */
export default function ProfessionalForm({
  professionalDetail,
  lawyerDetail,
  techDetail,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    buildInitialState(professionalDetail, lawyerDetail, techDetail)
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // ---- certification documents (array of URL strings) ----------------------
  function addCertificationDoc() {
    setForm((f) => ({
      ...f,
      certificationsDocuments: [...f.certificationsDocuments, ''],
    }));
  }

  function updateCertificationDoc(index, url) {
    setForm((f) => {
      const next = [...f.certificationsDocuments];
      next[index] = url;
      return { ...f, certificationsDocuments: next };
    });
  }

  function removeCertificationDoc(index) {
    setForm((f) => ({
      ...f,
      certificationsDocuments: f.certificationsDocuments.filter(
        (_, i) => i !== index
      ),
    }));
  }

  const isLawyer = form.professionalType === 'Lawyer';
  const isTech = form.professionalType === 'Tech Consultant';

  function validate() {
    const next = {};
    if (!form.professionalType)
      next.professionalType = 'Select a professional type.';
    if (!form.designation.trim())
      next.designation = 'Designation is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        professionalType: form.professionalType,
        designation: form.designation.trim(),
        organization: form.organization.trim(),
        yearsOfExperience: form.yearsOfExperience
          ? Number(form.yearsOfExperience)
          : 0,
        bio: form.bio.trim(),
        about: form.about.trim(),
        skills: toArray(form.skills),
        expertise: toArray(form.expertise),
        languages: toArray(form.languages),
        certifications: toArray(form.certifications),
        education: toArray(form.education),
        achievements: toArray(form.achievements),
        website: form.website.trim(),
        linkedin: form.linkedin.trim(),
        profileResume: form.profileResume.trim() || undefined,
        licenseDocument: form.licenseDocument.trim() || undefined,
        identityDocument: form.identityDocument.trim() || undefined,
        certificationsDocuments: form.certificationsDocuments
          .map((url) => (url || '').trim())
          .filter(Boolean),
      };

      if (isLawyer) {
        payload.lawyer = {
          barRegistrationNumber: form.barRegistrationNumber.trim(),
          enrollmentNumber: form.enrollmentNumber.trim(),
          licenseNumber: form.licenseNumber.trim(),
          practiceAreas: toArray(form.practiceAreas),
          courtPractice: toArray(form.courtPractice),
          jurisdiction: form.jurisdiction.trim(),
          lawDegree: form.lawDegree.trim(),
          chamberAddress: form.chamberAddress.trim(),
          consultationFee: form.lawyerConsultationFee
            ? Number(form.lawyerConsultationFee)
            : 0,
          availability: toArray(form.availability),
        };
      } else if (isTech) {
        payload.tech = {
          technologies: toArray(form.technologies),
          specialization: form.specialization.trim(),
          githubProfile: form.githubProfile.trim(),
          portfolioUrl: form.portfolioUrl.trim(),
          certifications: toArray(form.techCertifications),
          experienceProjects: toArray(form.experienceProjects),
          consultationFee: form.techConsultationFee
            ? Number(form.techConsultationFee)
            : 0,
        };
      }

      const refreshed = await updateProfessionalDetails(payload);
      setFeedback({
        type: 'success',
        message: 'Professional details saved.',
      });
      if (typeof onSaved === 'function') await onSaved(refreshed);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not save your professional details.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Professional details
          </h2>
          <p className="text-sm text-slate-500">
            Your expertise, experience and credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Professional type"
            name="professionalType"
            required
            value={form.professionalType}
            onChange={(e) => update('professionalType', e.target.value)}
            options={PROFESSIONAL_TYPES}
            error={errors.professionalType}
          />
          <Input
            label="Designation"
            name="designation"
            required
            value={form.designation}
            onChange={(e) => update('designation', e.target.value)}
            error={errors.designation}
          />
          <Input
            label="Organization"
            name="organization"
            value={form.organization}
            onChange={(e) => update('organization', e.target.value)}
          />
          <Input
            label="Years of experience"
            name="yearsOfExperience"
            type="number"
            min="0"
            value={form.yearsOfExperience}
            onChange={(e) => update('yearsOfExperience', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Short bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={2}
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label
              htmlFor="about"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              About
            </label>
            <textarea
              id="about"
              name="about"
              rows={4}
              value={form.about}
              onChange={(e) => update('about', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Skills"
            name="skills"
            value={form.skills}
            onChange={(e) => update('skills', e.target.value)}
            hint="Comma-separated, e.g. Negotiation, Drafting"
          />
          <Input
            label="Expertise"
            name="expertise"
            value={form.expertise}
            onChange={(e) => update('expertise', e.target.value)}
            hint="Comma-separated"
          />
          <Input
            label="Languages"
            name="languages"
            value={form.languages}
            onChange={(e) => update('languages', e.target.value)}
            hint="Comma-separated, e.g. English, Hindi"
          />
          <Input
            label="Certifications"
            name="certifications"
            value={form.certifications}
            onChange={(e) => update('certifications', e.target.value)}
            hint="Comma-separated"
          />
          <Input
            label="Education"
            name="education"
            value={form.education}
            onChange={(e) => update('education', e.target.value)}
            hint="Comma-separated"
          />
          <Input
            label="Achievements"
            name="achievements"
            value={form.achievements}
            onChange={(e) => update('achievements', e.target.value)}
            hint="Comma-separated"
          />
          <Input
            label="Website"
            name="website"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            placeholder="https://…"
          />
          <Input
            label="LinkedIn"
            name="linkedin"
            value={form.linkedin}
            onChange={(e) => update('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/…"
          />
        </div>

        {/* Lawyer sub-form */}
        {isLawyer && (
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-800">
              Lawyer details
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Bar registration number"
                name="barRegistrationNumber"
                value={form.barRegistrationNumber}
                onChange={(e) =>
                  update('barRegistrationNumber', e.target.value)
                }
              />
              <Input
                label="Enrollment number"
                name="enrollmentNumber"
                value={form.enrollmentNumber}
                onChange={(e) => update('enrollmentNumber', e.target.value)}
              />
              <Input
                label="License number"
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) => update('licenseNumber', e.target.value)}
              />
              <Input
                label="Jurisdiction"
                name="jurisdiction"
                value={form.jurisdiction}
                onChange={(e) => update('jurisdiction', e.target.value)}
              />
              <Input
                label="Practice areas"
                name="practiceAreas"
                value={form.practiceAreas}
                onChange={(e) => update('practiceAreas', e.target.value)}
                hint="Comma-separated"
              />
              <Input
                label="Court practice"
                name="courtPractice"
                value={form.courtPractice}
                onChange={(e) => update('courtPractice', e.target.value)}
                hint="Comma-separated"
              />
              <Input
                label="Law degree"
                name="lawDegree"
                value={form.lawDegree}
                onChange={(e) => update('lawDegree', e.target.value)}
              />
              <Input
                label="Consultation fee"
                name="lawyerConsultationFee"
                type="number"
                min="0"
                value={form.lawyerConsultationFee}
                onChange={(e) =>
                  update('lawyerConsultationFee', e.target.value)
                }
              />
              <Input
                label="Chamber address"
                name="chamberAddress"
                value={form.chamberAddress}
                onChange={(e) => update('chamberAddress', e.target.value)}
                className="sm:col-span-2"
              />
              <Input
                label="Availability"
                name="availability"
                value={form.availability}
                onChange={(e) => update('availability', e.target.value)}
                hint="Comma-separated, e.g. Mon, Tue, Wed"
                className="sm:col-span-2"
              />
            </div>
          </div>
        )}

        {/* Tech Consultant sub-form */}
        {isTech && (
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-800">
              Tech consultant details
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Technologies"
                name="technologies"
                value={form.technologies}
                onChange={(e) => update('technologies', e.target.value)}
                hint="Comma-separated"
              />
              <Input
                label="Specialization"
                name="specialization"
                value={form.specialization}
                onChange={(e) => update('specialization', e.target.value)}
              />
              <Input
                label="GitHub profile"
                name="githubProfile"
                value={form.githubProfile}
                onChange={(e) => update('githubProfile', e.target.value)}
                placeholder="https://github.com/…"
              />
              <Input
                label="Portfolio URL"
                name="portfolioUrl"
                value={form.portfolioUrl}
                onChange={(e) => update('portfolioUrl', e.target.value)}
                placeholder="https://…"
              />
              <Input
                label="Certifications"
                name="techCertifications"
                value={form.techCertifications}
                onChange={(e) => update('techCertifications', e.target.value)}
                hint="Comma-separated"
              />
              <Input
                label="Experience projects"
                name="experienceProjects"
                value={form.experienceProjects}
                onChange={(e) => update('experienceProjects', e.target.value)}
                hint="Comma-separated"
              />
              <Input
                label="Consultation fee"
                name="techConsultationFee"
                type="number"
                min="0"
                value={form.techConsultationFee}
                onChange={(e) => update('techConsultationFee', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-800">Documents</h3>
          <p className="mt-1 text-xs text-slate-500">
            Upload your resume and supporting documents (images or PDF, up to
            10 MB each).
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FileUpload
              label="Profile resume"
              category="resume"
              value={form.profileResume}
              onChange={(url) => update('profileResume', url)}
            />
            <FileUpload
              label="License document"
              category="license_document"
              value={form.licenseDocument}
              onChange={(url) => update('licenseDocument', url)}
            />
            <div className="sm:col-span-2">
              <FileUpload
                label="Identity document"
                category="identity_document"
                value={form.identityDocument}
                onChange={(url) => update('identityDocument', url)}
              />
            </div>
          </div>

          {/* Certification documents — variable-length list */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">
                Certification documents
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertificationDoc}
              >
                <Plus className="h-3.5 w-3.5" />
                Add document
              </Button>
            </div>
            {form.certificationsDocuments.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No certification documents added.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {form.certificationsDocuments.map((docUrl, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex-1">
                      <FileUpload
                        category="certification"
                        value={docUrl}
                        onChange={(url) =>
                          updateCertificationDoc(index, url)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertificationDoc(index)}
                      aria-label="Remove certification document"
                      className="mt-1 rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? 'Saving…' : 'Save professional details'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
