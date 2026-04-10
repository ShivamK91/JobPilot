import { useState, useEffect, MouseEvent } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { Application } from '../types';
import { updateApplication, deleteApplication, UpdateApplicationData } from '../api/applicationApi';
import { useToast } from './Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApplicationModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = 'view' | 'edit' | 'confirm-delete';

type AppStatus = Application['status'];

interface EditForm {
  company: string;
  role: string;
  location: string;
  seniority: string;
  jdLink: string;
  salaryRange: string;
  notes: string;
  dateApplied: string;
  status: AppStatus;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: AppStatus[] = [
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
];

const STATUS_BADGE: Record<AppStatus, { bg: string; text: string; border: string }> = {
  Applied:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Phone Screen': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  Interview:      { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  Offer:          { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  Rejected:       { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDateInput = (date: Date | string): string =>
  new Date(date).toISOString().split('T')[0];

const formatDate = (date: Date | string): string =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const appToForm = (app: Application): EditForm => ({
  company:     app.company,
  role:        app.role,
  location:    app.location,
  seniority:   app.seniority,
  jdLink:      app.jdLink,
  salaryRange: app.salaryRange ?? '',
  notes:       app.notes,
  dateApplied: toDateInput(app.dateApplied),
  status:      app.status,
});

// ── Sub-components ────────────────────────────────────────────────────────────

const inputClass =
  'w-full bg-white border text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-0 transition';

const inputStyle = { borderColor: '#e2e8f0' };

const SectionLabel = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
    {children}
  </p>
);

const SkillChips = ({ skills, color = 'blue' }: { skills: string[]; color?: 'blue' | 'teal' }): JSX.Element => {
  const style =
    color === 'teal'
      ? { background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', fontSize: '10px' }
      : { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '10px' };
  return (
    <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
      {skills.length === 0 ? (
        <span className="text-slate-400 text-xs italic">None</span>
      ) : (
        skills.map((s) => (
          <span key={s} style={{ ...style, fontWeight: 500, padding: '2px 10px', borderRadius: '9999px' }}>
            {s}
          </span>
        ))
      )}
    </div>
  );
};

const CopyButton = ({ text: _text, isCopied, onCopy }: { text: string; isCopied: boolean; onCopy: () => void }): JSX.Element => (
  <button onClick={onCopy} title="Copy to clipboard" className="shrink-0 text-slate-500 hover:text-indigo-400 transition-colors mt-0.5">
    {isCopied ? (
      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────

const ApplicationModal = ({ application, isOpen, onClose }: ApplicationModalProps): JSX.Element | null => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [mode, setMode]             = useState<ModalMode>('view');
  const [form, setForm]             = useState<EditForm | null>(null);
  const [formError, setFormError]   = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Reset state whenever modal opens with a new application
  useEffect(() => {
    if (isOpen && application) {
      setMode('view');
      setForm(appToForm(application));
      setFormError(null);
      setCopiedIndex(null);
    }
  }, [isOpen, application]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const { mutate: saveUpdate, isLoading: isSaving } = useMutation(
    ({ id, data }: { id: string; data: UpdateApplicationData }) =>
      updateApplication(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('applications');
        addToast('Application updated successfully!', 'success');
        setMode('view');
      },
      onError: () => {
        setFormError('Failed to save changes. Please try again.');
        addToast('Failed to update application.', 'error');
      },
    }
  );

  const { mutate: confirmDelete, isLoading: isDeleting } = useMutation(
    (id: string) => deleteApplication(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('applications');
        addToast('Application deleted.', 'success');
        onClose();
      },
      onError: () => {
        setFormError('Failed to delete. Please try again.');
        addToast('Failed to delete application.', 'error');
      },
    }
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]): void =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = (): void => {
    if (!application || !form) return;
    setFormError(null);
    if (!form.company.trim() || !form.role.trim()) {
      setFormError('Company and Role are required.');
      return;
    }
    const payload: UpdateApplicationData = {
      company:     form.company.trim(),
      role:        form.role.trim(),
      location:    form.location.trim(),
      seniority:   form.seniority.trim(),
      jdLink:      form.jdLink.trim(),
      salaryRange: form.salaryRange.trim() || undefined,
      notes:       form.notes.trim(),
      dateApplied: new Date(form.dateApplied),
      status:      form.status,
    };
    saveUpdate({ id: application._id, data: payload });
  };

  const handleCopy = async (text: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* silently ignore */ }
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || !application || !form) return null;

  // ── VIEW MODE ───────────────────────────────────────────────────────────────
  const ViewMode = (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">{application.role}</h2>
          <p className="text-slate-500 text-sm font-medium mt-0.5">{application.company}</p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
          style={{
            background: STATUS_BADGE[application.status].bg,
            color: STATUS_BADGE[application.status].text,
            border: `1px solid ${STATUS_BADGE[application.status].border}`,
          }}
        >
          {application.status}
        </span>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {application.location && (
          <div>
            <SectionLabel>Location</SectionLabel>
            <p className="text-slate-700">{application.location}</p>
          </div>
        )}
        {application.seniority && (
          <div>
            <SectionLabel>Seniority</SectionLabel>
            <p className="text-slate-700">{application.seniority}</p>
          </div>
        )}
        <div>
          <SectionLabel>Date Applied</SectionLabel>
          <p className="text-slate-700">{formatDate(application.dateApplied)}</p>
        </div>
        {application.salaryRange && (
          <div>
            <SectionLabel>Salary Range</SectionLabel>
            <p className="text-slate-700">{application.salaryRange}</p>
          </div>
        )}
        {application.jdLink && (
          <div className="col-span-2">
            <SectionLabel>JD Link</SectionLabel>
            <a
              href={application.jdLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm break-all underline underline-offset-2 transition-colors hover:opacity-80"
              style={{ color: '#534AB7' }}
            >
              {application.jdLink}
            </a>
          </div>
        )}
      </div>

      {/* Skills */}
      <div>
        <SectionLabel>Required Skills</SectionLabel>
        <SkillChips skills={application.requiredSkills} color="blue" />
      </div>
      <div>
        <SectionLabel>Nice-to-Have Skills</SectionLabel>
        <SkillChips skills={application.niceToHaveSkills} color="teal" />
      </div>

      {/* Notes */}
      {application.notes && (
        <div>
          <SectionLabel>Notes</SectionLabel>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
            {application.notes}
          </p>
        </div>
      )}

      {/* Resume suggestions */}
      {application.resumeSuggestions.length > 0 && (
        <div>
          <SectionLabel>AI Resume Suggestions</SectionLabel>
          <ul className="space-y-2 mt-1">
            {application.resumeSuggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <p className="text-slate-700 text-sm flex-1 leading-relaxed">{s}</p>
                <CopyButton
                  text={s}
                  isCopied={copiedIndex === i}
                  onCopy={() => handleCopy(s, i)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete confirmation inline */}
      {mode === 'confirm-delete' && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-red-700 text-sm font-medium">
            Are you sure you want to delete this application?
          </p>
          <p className="text-red-500 text-xs">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              id="confirm-delete-btn"
              onClick={() => confirmDelete(application._id)}
              disabled={isDeleting}
              className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#dc2626' }}
            >
              {isDeleting ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              ) : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setMode('view')}
              className="text-slate-600 hover:text-slate-800 text-sm px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── EDIT MODE ───────────────────────────────────────────────────────────────
  const EditModeContent = (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Status */}
        <div className="sm:col-span-2">
          <label htmlFor="edit-status" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Status
          </label>
          <select
            id="edit-status"
            value={form.status}
            onChange={(e) => setField('status', e.target.value as AppStatus)}
            className={inputClass}
            style={inputStyle}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {[
          { id: 'edit-company',  label: 'Company',  key: 'company'  as const, required: true,  placeholder: 'Acme Corp' },
          { id: 'edit-role',     label: 'Role',     key: 'role'     as const, required: true,  placeholder: 'Software Engineer' },
          { id: 'edit-location', label: 'Location', key: 'location' as const, required: false, placeholder: 'Remote / NYC' },
          { id: 'edit-seniority',label: 'Seniority',key: 'seniority'as const, required: false, placeholder: 'Senior' },
          { id: 'edit-salary',   label: 'Salary Range', key: 'salaryRange' as const, required: false, placeholder: '$100k – $130k' },
        ].map(({ id, label, key, required, placeholder }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              id={id}
              type="text"
              value={form[key]}
              onChange={(e) => setField(key, e.target.value)}
              placeholder={placeholder}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        ))}

        <div>
          <label htmlFor="edit-date" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Date Applied
          </label>
          <input
            id="edit-date"
            type="date"
            value={form.dateApplied}
            onChange={(e) => setField('dateApplied', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="edit-jdlink" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            JD Link
          </label>
          <input
            id="edit-jdlink"
            type="url"
            value={form.jdLink}
            onChange={(e) => setField('jdLink', e.target.value)}
            placeholder="https://company.com/jobs/123"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="edit-notes" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Notes
          </label>
          <textarea
            id="edit-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className={`${inputClass} resize-none`}
            style={inputStyle}
          />
        </div>

        {/* Skills — read-only in edit mode */}
        <div className="sm:col-span-2">
          <SectionLabel>Required Skills (from AI parse)</SectionLabel>
          <SkillChips skills={application.requiredSkills} color="indigo" />
        </div>
        <div className="sm:col-span-2">
          <SectionLabel>Nice-to-Have Skills (from AI parse)</SectionLabel>
          <SkillChips skills={application.niceToHaveSkills} color="teal" />
        </div>

      </div>
    </div>
  );

  // ── Footer per mode ──────────────────────────────────────────────────────────
  const FooterView = (
    <div className="flex items-center justify-between px-6 py-4 border-t shrink-0" style={{ borderColor: '#f1f5f9' }}>
      <button
        id="delete-app-btn"
        onClick={() => setMode('confirm-delete')}
        className="text-sm border px-4 py-2 rounded-lg transition-colors hover:opacity-80"
        style={{ color: '#b91c1c', borderColor: '#fecaca' }}
      >
        Delete
      </button>
      <button
        id="edit-app-btn"
        onClick={() => { setMode('edit'); setFormError(null); }}
        className="text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        style={{ background: '#534AB7' }}
      >
        Edit
      </button>
    </div>
  );

  const FooterEdit = (
    <div className="flex items-center justify-between px-6 py-4 border-t shrink-0" style={{ borderColor: '#f1f5f9' }}>
      {formError ? (
        <p className="text-red-500 text-xs">{formError}</p>
      ) : <span />}
      <div className="flex gap-3">
        <button
          id="edit-cancel-btn"
          onClick={() => { setMode('view'); setFormError(null); setForm(appToForm(application)); }}
          className="text-slate-500 hover:text-slate-700 text-sm px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: '#e2e8f0' }}
        >
          Cancel
        </button>
        <button
          id="edit-save-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="text-white text-sm font-semibold px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: '#534AB7' }}
        >
          {isSaving ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid #e2e8f0' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: '#f1f5f9' }}>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {mode === 'edit' ? 'Edit Application' : 'Application Detail'}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {mode === 'edit' ? EditModeContent : ViewMode}

        {/* Footer */}
        {mode === 'edit' ? FooterEdit : (mode === 'view' ? FooterView : null)}

      </div>
    </div>
  );
};

export default ApplicationModal;
