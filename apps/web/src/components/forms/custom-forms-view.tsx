'use client';

import React, { useState, useEffect } from 'react';
import { CustomBookingForm, EventType, IntakeQuestion } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import { FormBuilder } from './form-builder';
import {
  ClipboardList,
  Plus,
  Save,
  Trash2,
  Copy,
  Sparkles,
  Building2,
  Layers,
  CheckCircle2,
  ExternalLink,
  Calendar,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Link2,
  Share2,
  X,
  Check,
} from 'lucide-react';

interface CustomFormsViewProps {
  eventTypes: EventType[];
  onOpenBookingWizard?: (eventTypeId?: string) => void;
  onRefreshEventTypes?: () => void;
}

const TEMPLATES: {
  name: string;
  org: string;
  desc: string;
  tag: string;
  fields: IntakeQuestion[];
}[] = [
  {
    name: 'Tech & Architecture Discovery',
    org: 'Acme Cloud Engineering',
    tag: 'Engineering / Dev',
    desc: 'Capture repository links, tech stack details, timeline, and mutual NDA requirements.',
    fields: [
      {
        id: 't-company',
        label: 'Company or Project Name',
        type: 'text',
        placeholder: 'e.g. Acme Corporation',
        required: true,
        helpText: 'The legal organization or client entity',
      },
      {
        id: 't-objective',
        label: 'Primary Project Goals & Technical Deliverables',
        type: 'textarea',
        placeholder: 'Describe what you need built, audited, or reviewed...',
        required: true,
      },
      {
        id: 't-repo',
        label: 'Repository or Architecture Spec URL',
        type: 'url',
        placeholder: 'https://github.com/organization/repo',
        required: false,
        helpText: 'GitHub, GitLab, Figma design, or technical specification link',
      },
      {
        id: 't-stack',
        label: 'Primary Technologies in Use',
        type: 'checkbox',
        required: false,
        options: ['React / Next.js', 'Node.js / Express', 'Python / AI / ML', 'PostgreSQL / Prisma', 'AWS / Cloud Infra'],
      },
      {
        id: 't-timeline',
        label: 'Target Delivery Timeline',
        type: 'select',
        required: true,
        options: ['Immediate (under 2 weeks)', '1 to 2 months', '3 to 6 months', 'Exploratory sync'],
      },
      {
        id: 't-nda',
        label: 'Do you require a mutual Non-Disclosure Agreement (NDA)?',
        type: 'radio',
        required: true,
        options: ['Yes, please send NDA prior to meeting', 'No NDA required'],
      },
    ],
  },
  {
    name: 'B2B SaaS Sales & Qualification',
    org: 'SaaS Platform Sales',
    tag: 'B2B Sales',
    desc: 'Qualify prospects with corporate domain, team size, budget, and business bottlenecks.',
    fields: [
      {
        id: 's-company',
        label: 'Company Name',
        type: 'text',
        placeholder: 'e.g. Stripe, Airbnb',
        required: true,
      },
      {
        id: 's-workemail',
        label: 'Corporate Business Email',
        type: 'email',
        placeholder: 'alex@company.com',
        required: true,
        helpText: 'Please use your official work email address',
      },
      {
        id: 's-website',
        label: 'Company Website URL',
        type: 'url',
        placeholder: 'https://company.com',
        required: true,
      },
      {
        id: 's-teamsize',
        label: 'Estimated User Seats / Team Size',
        type: 'number',
        placeholder: '25',
        min: 1,
        max: 50000,
        required: true,
      },
      {
        id: 's-painpoint',
        label: 'What is your team’s greatest scheduling bottleneck today?',
        type: 'textarea',
        placeholder: 'Explain the current pain points in your workflow...',
        required: true,
      },
      {
        id: 's-phone',
        label: 'Mobile / Telephone Number',
        type: 'phone',
        placeholder: '+1 (555) 000-0000',
        required: false,
      },
    ],
  },
  {
    name: 'Clinic & Healthcare Intake',
    org: 'Wellness & Health Clinic',
    tag: 'Healthcare / Medical',
    desc: 'Collect patient dates of birth, insurance details, and primary medical concerns.',
    fields: [
      {
        id: 'h-legalname',
        label: 'Full Legal Name (as on ID)',
        type: 'text',
        placeholder: 'Jane Doe',
        required: true,
      },
      {
        id: 'h-dob',
        label: 'Date of Birth',
        type: 'date',
        required: true,
      },
      {
        id: 'h-emergencyphone',
        label: 'Emergency Contact Telephone',
        type: 'phone',
        placeholder: '+1 (555) 123-4567',
        required: true,
      },
      {
        id: 'h-insurance',
        label: 'Insurance Provider / Billing Method',
        type: 'select',
        required: true,
        options: ['BlueCross / BlueShield', 'Aetna', 'UnitedHealth', 'Cigna', 'Direct Self-Pay'],
      },
      {
        id: 'h-symptoms',
        label: 'Reason for Appointment & Symptoms',
        type: 'textarea',
        placeholder: 'Briefly describe the symptoms or reason for your visit...',
        required: true,
      },
      {
        id: 'h-telehealth',
        label: 'Consent for Virtual Telehealth Consultation',
        type: 'checkbox',
        required: true,
        options: ['I understand and agree to virtual telehealth privacy terms'],
      },
    ],
  },
  {
    name: 'Recruitment & Candidate Screening',
    org: 'Talent & People Ops',
    tag: 'HR / Recruitment',
    desc: 'Gather resume links, years of relevant experience, and current notice period.',
    fields: [
      {
        id: 'r-linkedin',
        label: 'LinkedIn or Portfolio Profile URL',
        type: 'url',
        placeholder: 'https://linkedin.com/in/username',
        required: true,
      },
      {
        id: 'r-experience',
        label: 'Years of Professional Experience',
        type: 'number',
        placeholder: '5',
        min: 0,
        max: 50,
        required: true,
      },
      {
        id: 'r-currentrole',
        label: 'Current Title & Organization',
        type: 'text',
        placeholder: 'Senior Fullstack Engineer at TechCorp',
        required: true,
      },
      {
        id: 'r-notice',
        label: 'Earliest Availability / Notice Period',
        type: 'select',
        required: true,
        options: ['Immediate start', '2 weeks notice', '1 month notice', '2+ months notice'],
      },
      {
        id: 'r-highlights',
        label: 'Key Technical Achievement or Project Highlight',
        type: 'textarea',
        placeholder: 'Tell us about a project or system you are particularly proud of...',
        required: false,
      },
    ],
  },
  {
    name: 'Blank Custom Form',
    org: 'Custom Organization',
    tag: 'Custom',
    desc: 'Start with a clean blank canvas and select whichever input elements your organization needs.',
    fields: [
      {
        id: 'b-topic',
        label: 'What is the primary topic you would like to discuss?',
        type: 'text',
        placeholder: 'e.g. New feature onboarding',
        required: true,
      },
    ],
  },
];

export const CustomFormsView: React.FC<CustomFormsViewProps> = ({
  eventTypes,
  onOpenBookingWizard,
  onRefreshEventTypes,
}) => {
  const { showAlert, showConfirm, showToast } = useDialog();

  const [forms, setForms] = useState<CustomBookingForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);

  // Form Editor State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [targetEventTypeIds, setTargetEventTypeIds] = useState<string[]>([]);
  const [fields, setFields] = useState<IntakeQuestion[]>([]);

  const copyFormLink = (formId: string, formTitle?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/book?form=${encodeURIComponent(formId)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    showToast(`Booking link copied for "${formTitle || 'form'}"! Anyone can use this link to book free slots.`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Load custom forms on mount
  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomForms();
      setForms(data);
      if (data.length > 0) {
        const initial = data[0];
        setSelectedFormId(initial.id);
        populateForm(initial);
      } else {
        // Fallback to first template
        applyTemplate(TEMPLATES[0]);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Could not fetch custom forms', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const populateForm = (form: CustomBookingForm) => {
    setTitle(form.title || 'Custom Booking Form');
    setDescription(form.description || '');
    setOrganizationName(form.organizationName || 'My Organization');
    setIsDefault(Boolean(form.isDefault));
    setTargetEventTypeIds(form.targetEventTypeIds || []);
    setFields(form.fields || []);
  };

  const handleSelectForm = (id: string) => {
    setSelectedFormId(id);
    const found = forms.find((f) => f.id === id);
    if (found) populateForm(found);
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.name);
    setOrganizationName(tpl.org);
    setDescription(tpl.desc);
    setFields(tpl.fields.map((f) => ({ ...f, id: `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}` })));
  };

  const handleCreateNewForm = () => {
    const newId = `form-${Date.now().toString(36)}`;
    const blankForm: CustomBookingForm = {
      id: newId,
      title: 'New Organization Intake Form',
      description: 'Please answer these questions to help us tailor our meeting to your specific requirements.',
      organizationName: 'Our Organization',
      isDefault: false,
      targetEventTypeIds: [],
      fields: [
        {
          id: `q-1`,
          label: 'What is the primary topic you would like to discuss?',
          type: 'text',
          placeholder: 'e.g. Discovery, architectural sync, project kick-off',
          required: true,
        },
      ],
    };
    setForms([...forms, blankForm]);
    setSelectedFormId(newId);
    populateForm(blankForm);
    showToast('New customized form created. Choose input elements to customize.', 'info');
  };

  const handleSaveForm = async () => {
    if (!title.trim()) {
      showAlert({
        title: 'Form Title Required',
        message: 'Please provide a descriptive title for this customized form.',
        type: 'warning',
      });
      return;
    }

    if (fields.length === 0) {
      showAlert({
        title: 'Input Elements Required',
        message: 'Please add at least one input element to your form.',
        type: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<CustomBookingForm> = {
        id: selectedFormId || `form-${Date.now().toString(36)}`,
        title,
        description,
        organizationName,
        isDefault,
        targetEventTypeIds,
        fields,
      };

      const saved = await api.saveCustomForm(payload);

      // If user assigned target event types, sync their customQuestions directly
      if (targetEventTypeIds.length > 0) {
        await Promise.all(
          targetEventTypeIds.map(async (etId) => {
            const et = eventTypes.find((e) => e.id === etId);
            if (et) {
              await api.updateEventType(etId, {
                customQuestions: fields,
              });
            }
          })
        );
        if (onRefreshEventTypes) {
          onRefreshEventTypes();
        }
      }

      showToast(`Form "${title}" saved successfully!`, 'success');
      // Refresh form list
      const updatedForms = await api.getCustomForms();
      setForms(updatedForms);
      setSelectedFormId(saved.id);
    } catch (err: any) {
      showAlert({
        title: 'Save Failed',
        message: err.message || 'Could not save customized form',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteForm = async (targetId?: string) => {
    const idToDelete = targetId || selectedFormId;
    if (!idToDelete) return;
    const formToDelete = forms.find((f) => f.id === idToDelete);
    const formName = formToDelete?.title || title || 'this custom form';

    const confirmed = await showConfirm({
      title: 'Delete Custom Form?',
      message: `Are you sure you want to permanently delete "${formName}"? This action cannot be undone.`,
      confirmText: 'Delete Form',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      try {
        await api.deleteCustomForm(idToDelete);
      } catch (err: any) {
        console.warn('API delete note:', err.message);
      }
      showToast(`Form "${formName}" deleted successfully`, 'success');

      const remaining = forms.filter((f) => f.id !== idToDelete);
      setForms(remaining);

      if (remaining.length > 0) {
        const next = remaining[0];
        setSelectedFormId(next.id);
        populateForm(next);
      } else {
        const newId = `form-${Date.now().toString(36)}`;
        const freshForm: CustomBookingForm = {
          id: newId,
          title: 'Custom Booking Form',
          description: 'Please answer these questions to help us tailor our meeting.',
          organizationName: 'Our Organization',
          isDefault: true,
          targetEventTypeIds: [],
          fields: [
            {
              id: 'q-1',
              label: 'What is the primary topic you would like to discuss?',
              type: 'text',
              placeholder: 'e.g. Project kick-off, discovery, consultation',
              required: true,
            },
          ],
        };
        setForms([freshForm]);
        setSelectedFormId(newId);
        populateForm(freshForm);
      }
    } catch (err: any) {
      showAlert({
        title: 'Delete Failed',
        message: err.message || 'Could not delete form',
        type: 'error',
      });
    }
  };

  const handleDuplicateForm = () => {
    const dupId = `form-${Date.now().toString(36)}`;
    const duplicated: CustomBookingForm = {
      id: dupId,
      title: `${title} (Copy)`,
      description,
      organizationName,
      isDefault: false,
      targetEventTypeIds: [],
      fields: fields.map((f) => ({ ...f, id: `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}` })),
    };
    setForms([...forms, duplicated]);
    setSelectedFormId(dupId);
    populateForm(duplicated);
    showToast('Form duplicated! Make edits and click Save.', 'info');
  };

  const toggleTargetEventType = (id: string) => {
    if (targetEventTypeIds.includes(id)) {
      setTargetEventTypeIds(targetEventTypeIds.filter((t) => t !== id));
    } else {
      setTargetEventTypeIds([...targetEventTypeIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-500">Loading form builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Custom Booking Forms
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Every organization has unique intake requirements. Customize your invitee questionnaires by selecting input elements, reordering questions, configuring required rules, and previewing the form in real time.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLinksModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 transition active:scale-98"
          >
            <Link2 className="h-4 w-4 text-indigo-600" />
            <span>All Purpose Links ({forms.length})</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewForm}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-98"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span>New Custom Form</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicateForm}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            title="Duplicate current form"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => handleDeleteForm()}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition active:scale-98"
            title="Delete this form"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            type="button"
            onClick={handleSaveForm}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Form'}</span>
          </button>
        </div>
      </div>

      {/* Form Switcher & Quick Templates Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Selector & Metadata Settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Form Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Active Form
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                {forms.length} {forms.length === 1 ? 'Form' : 'Forms'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {forms.map((f) => {
                const isSelected = f.id === selectedFormId;
                return (
                  <div key={f.id} className="flex items-center gap-1.5 group">
                    <button
                      type="button"
                      onClick={() => handleSelectForm(f.id)}
                      className={`flex-1 flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      <span className="truncate">{f.title}</span>
                      <span
                        className={`text-[10px] uppercase px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                          isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {f.fields?.length || 0} fields
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyFormLink(f.id, f.title);
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition shrink-0"
                      title={`Copy booking link for "${f.title}"`}
                    >
                      {copiedId === f.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteForm(f.id);
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                      title={`Delete "${f.title}"`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shareable Link Card for this Form Type */}
          {selectedFormId && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                      Public Booking Link
                    </h3>
                    <p className="text-[10px] text-blue-700/80 font-medium">
                      Tailored for "{title || 'this purpose'}"
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800">
                  Free Slots
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Send this link to anyone. Invitees can pick any of your available free slots and answer this form's specific questions.
              </p>

              {(() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const currentUrl = `${origin}/book?form=${encodeURIComponent(selectedFormId)}`;
                const isCopied = copiedId === selectedFormId;

                return (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentUrl}
                        className="flex-1 rounded-xl border border-blue-200/90 bg-white px-3 py-2 text-xs font-mono text-slate-700 select-all shadow-2xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyFormLink(selectedFormId, title)}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 shrink-0"
                        title="Copy public booking link"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <a
                        href={currentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 shrink-0"
                        title="Open live booking link in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        <span>Test</span>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Form Properties & Organization Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Form & Organization Settings</span>
            </h3>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Form Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Discovery & Technical Scope Form"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Organization / Team Name
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Acme Health Clinic, GrowthSync Labs"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Description / Greeting for Invitee
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell your invitees why you are asking these questions..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Target Event Types Assignment */}
            <div className="border-t border-slate-100 pt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Assign Form to Event Types
              </label>
              <p className="text-[10px] text-slate-400 mb-2">
                When invitees book these meetings, this customized form will be presented.
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {eventTypes.map((et) => {
                  const isChecked = targetEventTypeIds.includes(et.id);
                  return (
                    <label
                      key={et.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs cursor-pointer transition ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/50 font-bold text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: et.color || '#3b82f6' }}
                        />
                        <span className="truncate">{et.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTargetEventType(et.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Test in Booking Wizard Button */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  if (onOpenBookingWizard) {
                    onOpenBookingWizard(targetEventTypeIds[0] || eventTypes[0]?.id);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Test Booking Experience</span>
              </button>
            </div>
          </div>

          {/* Quick Organizational Presets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Quick Industry Templates
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              One-click organizational blueprints. Click to load preset inputs:
            </p>

            <div className="space-y-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => {
                    applyTemplate(tpl);
                    showToast(`Loaded ${tpl.name} template`, 'info');
                  }}
                  className="w-full text-left rounded-xl border border-slate-200 p-2.5 hover:border-blue-400 hover:bg-blue-50/30 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                      {tpl.name}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 line-clamp-1">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Form Canvas & Live Preview Studio */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <FormBuilder
              fields={fields}
              onChange={setFields}
              formTitle={title}
              formDescription={description}
              organizationName={organizationName}
              themeColor="#3b82f6"
            />
          </div>
        </div>
      </div>

      {/* All Purpose Links Modal */}
      {isLinksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Booking Links by Purpose / Form Type
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribute different links for different purposes. Anyone with the link can select a free slot and book!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinksModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {forms.map((f) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const formUrl = `${origin}/book?form=${encodeURIComponent(f.id)}`;
                const isCopied = copiedId === f.id;
                const assignedEts = eventTypes.filter((e) => f.targetEventTypeIds?.includes(e.id));

                return (
                  <div
                    key={f.id}
                    className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                          {f.organizationName && (
                            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {f.organizationName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {f.description || 'Customized questionnaire for this specific meeting purpose.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {f.fields?.length || 0} fields
                        </span>
                        {assignedEts.length > 0 && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            {assignedEts.map((e) => `${e.duration}m`).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={formUrl}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyFormLink(f.id, f.title)}
                        className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition active:scale-95 shrink-0"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLinksModalOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

