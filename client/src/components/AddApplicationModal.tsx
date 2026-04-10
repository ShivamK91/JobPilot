import { useState, useEffect, MouseEvent } from 'react';
import { useQueryClient, useMutation } from 'react-query';
import { parseJD, createApplication, CreateApplicationData } from '../api/applicationApi';
import { ParsedJob } from '../types';
import { useToast } from './Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  company: string;
  role: string;
  location: string;
  seniority: string;
  jdLink: string;
  salaryRange: string;
  notes: string;
  dateApplied: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayISO = (): string => new Date().toISOString().split('T')[0];

const emptyForm = (): FormState => ({
  company: '',
  role: '',
  location: '',
  seniority: '',
  jdLink: '',
  salaryRange: '',
  notes: '',
  dateApplied: todayISO(),
  requiredSkills: [],
  niceToHaveSkills: [],
});

// ── Sub-components ────────────────────────────────────────────────────────────

const SkillChips = ({ skills }: { skills: string[] }): JSX.Element => (
  <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
    {skills.length === 0 ? (
      <span className="text-slate-400 text-xs italic">None parsed yet</span>
    ) : (
      skills.map((s) => (
        <span
          key={s}
          style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            fontSize: '10px',
            fontWeight: 500,
            padding: '2px 10px',
            borderRadius: '9999px',
            border: '1px solid #bfdbfe',
          }}
        >
          {s}
        </span>
      ))
    )}
  </div>
);

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field = ({ id, label, required, children }: FieldProps): JSX.Element => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-medium text-slate-400 uppercase tracking-wider">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass =
  'w-full bg-white border text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-0 transition';

const inputStyle = { borderColor: '#e2e8f0' };

// ── Main Component ────────────────────────────────────────────────────────────

const AddApplicationModal = ({ isOpen, onClose }: AddApplicationModalProps): JSX.Element | null => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Form & AI state
  const [jdText, setJdText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resumeSuggestions, setResumeSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setJdText('');
      setIsParsing(false);
      setParseError(null);
      setResumeSuggestions([]);
      setCopiedIndex(null);
      setFormError(null);
      setForm(emptyForm());
    }
  }, [isOpen]);

  // ── Save mutation ───────────────────────────────────────────────────────────
  const { mutate: saveApplication, isLoading: isSaving } = useMutation(
    (data: CreateApplicationData) => createApplication(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('applications');
        addToast('Application saved successfully!', 'success');
        onClose();
      },
      onError: () => {
        setFormError('Failed to save application. Please try again.');
        addToast('Failed to save application.', 'error');
      },
    }
  );

  // ── AI Parse ────────────────────────────────────────────────────────────────
  const handleParse = async (): Promise<void> => {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const { parsedJob, resumeSuggestions: suggestions } = await parseJD(jdText);
      applyParsed(parsedJob);
      setResumeSuggestions(suggestions);
    } catch {
      setParseError('Failed to parse. Please try again.');
      addToast('AI parsing failed. Please try again.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const applyParsed = (parsed: ParsedJob): void => {
    setForm((prev) => ({
      ...prev,
      company:          parsed.company          || prev.company,
      role:             parsed.role             || prev.role,
      location:         parsed.location         || prev.location,
      seniority:        parsed.seniority        || prev.seniority,
      requiredSkills:   parsed.requiredSkills,
      niceToHaveSkills: parsed.niceToHaveSkills,
    }));
  };

  // ── Clipboard ───────────────────────────────────────────────────────────────
  const handleCopy = async (text: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = (): void => {
    setFormError(null);
    if (!form.company.trim() || !form.role.trim()) {
      setFormError('Company and Role are required.');
      return;
    }
    const payload: CreateApplicationData = {
      company:          form.company.trim(),
      role:             form.role.trim(),
      location:         form.location.trim(),
      seniority:        form.seniority.trim(),
      jdLink:           form.jdLink.trim(),
      salaryRange:      form.salaryRange.trim() || undefined,
      notes:            form.notes.trim(),
      dateApplied:      new Date(form.dateApplied),
      status:           'Applied',
      requiredSkills:   form.requiredSkills,
      niceToHaveSkills: form.niceToHaveSkills,
    };
    saveApplication(payload);
  };

  // ── Overlay click ─────────────────────────────────────────────────────────
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid #e2e8f0' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: '#f1f5f9' }}>
          <h2 className="text-lg font-semibold text-slate-800">Add Application</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ═══ SECTION 1 — JD Parser ═══ */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#534AB7' }}>
              AI Job Description Parser
            </h3>
            <textarea
              id="jd-input"
              rows={5}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description here…"
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
            {parseError && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {parseError}
              </p>
            )}
            <button
              id="parse-jd-btn"
              onClick={handleParse}
              disabled={isParsing || !jdText.trim()}
              className="mt-3 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1.5px solid #534AB7', color: '#534AB7', background: 'transparent' }}
            >
              {isParsing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#534AB7 transparent transparent transparent' }} />
                  Parsing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Parse with AI
                </>
              )}
            </button>
          </section>

          <div className="border-t" style={{ borderColor: '#f1f5f9' }} />

          {/* ═══ SECTION 2 — Application Form ═══ */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#534AB7' }}>
              Application Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field id="add-company" label="Company" required>
                <input
                  id="add-company"
                  type="text"
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
                  placeholder="Acme Corp"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <Field id="add-role" label="Role" required>
                <input
                  id="add-role"
                  type="text"
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  placeholder="Software Engineer"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <Field id="add-location" label="Location">
                <input
                  id="add-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="Remote / New York, NY"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <Field id="add-seniority" label="Seniority">
                <input
                  id="add-seniority"
                  type="text"
                  value={form.seniority}
                  onChange={(e) => setField('seniority', e.target.value)}
                  placeholder="Mid-level / Senior"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <Field id="add-date" label="Date Applied">
                <input
                  id="add-date"
                  type="date"
                  value={form.dateApplied}
                  onChange={(e) => setField('dateApplied', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <Field id="add-salary" label="Salary Range">
                <input
                  id="add-salary"
                  type="text"
                  value={form.salaryRange}
                  onChange={(e) => setField('salaryRange', e.target.value)}
                  placeholder="$100k – $130k"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field id="add-jdlink" label="JD Link">
                  <input
                    id="add-jdlink"
                    type="url"
                    value={form.jdLink}
                    onChange={(e) => setField('jdLink', e.target.value)}
                    placeholder="https://company.com/jobs/123"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field id="add-notes" label="Notes">
                  <textarea
                    id="add-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Referral from John, interesting product…"
                    className={`${inputClass} resize-none`}
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Skill chips — read-only after parse */}
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Required Skills
                </p>
                <SkillChips skills={form.requiredSkills} />
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Nice-to-Have Skills
                </p>
                <SkillChips skills={form.niceToHaveSkills} />
              </div>

            </div>
          </section>

          {/* ═══ SECTION 3 — Resume Suggestions ═══ */}
          {resumeSuggestions.length > 0 && (
            <>
              <div className="border-t" style={{ borderColor: '#f1f5f9' }} />
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#534AB7' }}>
                  AI Resume Suggestions
                </h3>
                <ul className="space-y-3">
                  {resumeSuggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg px-4 py-3"
                      style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                    >
                      <p className="text-slate-700 text-sm flex-1 leading-relaxed">{suggestion}</p>
                      <button
                        onClick={() => handleCopy(suggestion, i)}
                        title="Copy to clipboard"
                        className="shrink-0 mt-0.5 transition-colors"
                        style={{ color: copiedIndex === i ? '#16a34a' : '#534AB7' }}
                      >
                        {copiedIndex === i ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t shrink-0 space-y-3" style={{ borderColor: '#f1f5f9' }}>
          {formError && (
            <p className="text-red-500 text-xs">{formError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              id="add-cancel-btn"
              onClick={onClose}
              className="flex-1 text-slate-500 hover:text-slate-700 text-sm px-4 py-2.5 rounded-lg border transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancel
            </button>
            <button
              id="add-save-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ background: '#534AB7' }}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Application'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddApplicationModal;
