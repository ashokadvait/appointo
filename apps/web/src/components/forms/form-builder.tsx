'use client';

import React, { useState } from 'react';
import { IntakeQuestion, FormFieldType } from '@calendly/types';
import {
  Type,
  AlignLeft,
  ChevronDownSquare,
  CircleDot,
  CheckSquare,
  Mail,
  Phone,
  Hash,
  Calendar,
  Globe,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  Sliders,
  Settings2,
} from 'lucide-react';

export interface FormBuilderProps {
  fields: IntakeQuestion[];
  onChange: (fields: IntakeQuestion[]) => void;
  formTitle?: string;
  formDescription?: string;
  organizationName?: string;
  themeColor?: string;
  compact?: boolean;
}

interface PaletteItem {
  type: FormFieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLabel: string;
  defaultPlaceholder?: string;
  defaultOptions?: string[];
}

const AVAILABLE_ELEMENTS: PaletteItem[] = [
  {
    type: 'text',
    label: 'Single-Line Text',
    description: 'Short answers, names, titles, company name',
    icon: Type,
    defaultLabel: 'Company or Project Name',
    defaultPlaceholder: 'e.g. Acme Corporation',
  },
  {
    type: 'textarea',
    label: 'Paragraph / Notes',
    description: 'Long multi-line text, project goals, agenda',
    icon: AlignLeft,
    defaultLabel: 'What is the primary topic you would like to discuss?',
    defaultPlaceholder: 'Share background context, goals, or questions...',
  },
  {
    type: 'select',
    label: 'Dropdown Select',
    description: 'Pick one option from a dropdown menu',
    icon: ChevronDownSquare,
    defaultLabel: 'Project Stage',
    defaultOptions: ['Idea / Concept', 'Active MVP in Development', 'Live in Production', 'Enterprise Scaling'],
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    description: 'Single choice shown as visible radio pills',
    icon: CircleDot,
    defaultLabel: 'Primary Engagement Model',
    defaultOptions: ['Dedicated Full-Time Team', 'Sprint-Based Advisory', 'Single Consultation'],
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    description: 'Multi-select options or terms agreement',
    icon: CheckSquare,
    defaultLabel: 'Select Technologies / Services Needed',
    defaultOptions: ['Frontend (React/Next.js)', 'Backend & APIs', 'Cloud & DevOps', 'Security Audit'],
  },
  {
    type: 'email',
    label: 'Email Address',
    description: 'Validated corporate or personal email',
    icon: Mail,
    defaultLabel: 'Work / Billing Email',
    defaultPlaceholder: 'contact@organization.com',
  },
  {
    type: 'phone',
    label: 'Phone Number',
    description: 'Telephone / SMS direct number',
    icon: Phone,
    defaultLabel: 'Direct Phone Number',
    defaultPlaceholder: '+1 (555) 000-0000',
  },
  {
    type: 'number',
    label: 'Numeric Count',
    description: 'Quantities, team size, budget estimation',
    icon: Hash,
    defaultLabel: 'Estimated Team / User Seat Count',
    defaultPlaceholder: '25',
  },
  {
    type: 'date',
    label: 'Date Picker',
    description: 'Target launch date, milestone, birthday',
    icon: Calendar,
    defaultLabel: 'Target Project Launch Date',
  },
  {
    type: 'url',
    label: 'Website / Link',
    description: 'Web URL (repository, portfolio, Figma, specs)',
    icon: Globe,
    defaultLabel: 'Repository, Figma, or Portfolio URL',
    defaultPlaceholder: 'https://github.com/organization/repo',
  },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  onChange,
  formTitle = 'Meeting Intake Form',
  formDescription = 'Please fill out the information below prior to your scheduled session.',
  organizationName = 'Organization Booking Form',
  themeColor = '#3b82f6',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Preview interactive state
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const [previewSuccess, setPreviewSuccess] = useState(false);

  // Add field from element palette
  const handleAddField = (elem: PaletteItem) => {
    const newField: IntakeQuestion = {
      id: `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      label: elem.defaultLabel,
      type: elem.type,
      required: false,
      placeholder: elem.defaultPlaceholder || '',
      helpText: '',
      options: elem.defaultOptions ? [...elem.defaultOptions] : undefined,
    };
    const updated = [...fields, newField];
    onChange(updated);
    setActiveFieldId(newField.id);
  };

  // Update existing field
  const handleUpdateField = (index: number, updates: Partial<IntakeQuestion>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  // Remove field
  const handleRemoveField = (index: number) => {
    const next = fields.filter((_, i) => i !== index);
    onChange(next);
  };

  // Duplicate field
  const handleDuplicateField = (index: number) => {
    const target = fields[index];
    const duplicated: IntakeQuestion = {
      ...target,
      id: `q-${Date.now().toString(36)}-copy`,
      label: `${target.label} (Copy)`,
      options: target.options ? [...target.options] : undefined,
    };
    const next = [...fields];
    next.splice(index + 1, 0, duplicated);
    onChange(next);
    setActiveFieldId(duplicated.id);
  };

  // Move up/down
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...fields];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  // Option management for select, radio, checkbox
  const handleAddOption = (fieldIndex: number) => {
    const current = fields[fieldIndex].options || [];
    const nextOptions = [...current, `Option ${current.length + 1}`];
    handleUpdateField(fieldIndex, { options: nextOptions });
  };

  const handleUpdateOption = (fieldIndex: number, optIndex: number, val: string) => {
    const current = [...(fields[fieldIndex].options || [])];
    current[optIndex] = val;
    handleUpdateField(fieldIndex, { options: current });
  };

  const handleRemoveOption = (fieldIndex: number, optIndex: number) => {
    const current = (fields[fieldIndex].options || []).filter((_, i) => i !== optIndex);
    handleUpdateField(fieldIndex, { options: current });
  };

  // Preview test submission
  const handleTestPreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required) {
        const val = previewAnswers[f.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[f.id] = 'This question is required by the host organization.';
        }
      }
    });

    setPreviewErrors(errors);
    if (Object.keys(errors).length === 0) {
      setPreviewSuccess(true);
      setTimeout(() => setPreviewSuccess(false), 4000);
    } else {
      setPreviewSuccess(false);
    }
  };

  const handleResetPreview = () => {
    setPreviewAnswers({});
    setPreviewErrors({});
    setPreviewSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs & Device Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('build')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'build'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Customize Form ({fields.length} {fields.length === 1 ? 'element' : 'elements'})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Interactive Preview</span>
          </button>
        </div>

        {activeTab === 'preview' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  previewDevice === 'desktop' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  previewDevice === 'mobile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleResetPreview}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              title="Reset test input data"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: BUILD MODE */}
      {activeTab === 'build' && (
        <div className="space-y-6">
          {/* Element Selection Palette */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>Input Elements Palette</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Click any element below to add it directly into your customized booking form.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                10 Field Types Available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {AVAILABLE_ELEMENTS.map((elem) => {
                const Icon = elem.icon;
                return (
                  <button
                    key={elem.type}
                    type="button"
                    onClick={() => handleAddField(elem)}
                    className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm active:scale-98"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                        {elem.label}
                      </span>
                    </div>
                    <span className="mt-1 text-[10px] text-slate-500 leading-tight line-clamp-1">
                      {elem.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Custom Form Fields ({fields.length})
              </h4>
              {fields.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Reorder, customize labels, placeholders, and required status
                </span>
              )}
            </div>

            {fields.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-3">
                  <Type className="h-6 w-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-800">Your Form is Empty</h5>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Click any element from the palette above to build your organization&apos;s custom slot booking form.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {fields.map((field, idx) => {
                  const paletteMeta = AVAILABLE_ELEMENTS.find((p) => p.type === field.type) || AVAILABLE_ELEMENTS[0];
                  const Icon = paletteMeta.icon;
                  const isOptionsType = ['select', 'radio', 'checkbox'].includes(field.type);

                  return (
                    <div
                      key={field.id || idx}
                      className={`rounded-2xl border transition bg-white shadow-xs ${
                        activeFieldId === field.id
                          ? 'border-blue-500 ring-2 ring-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Field Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            <Icon className="h-3 w-3" />
                            <span>{paletteMeta.label}</span>
                          </div>
                          {field.required && (
                            <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
                              Required *
                            </span>
                          )}
                        </div>

                        {/* Actions: Reorder, Duplicate, Remove */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveField(idx, 'up')}
                            disabled={idx === 0}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 transition"
                            title="Move Up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveField(idx, 'down')}
                            disabled={idx === fields.length - 1}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 transition"
                            title="Move Down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateField(idx)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="Duplicate Field"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Remove Field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Field Card Body */}
                      <div className="p-4 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Label / Question Input */}
                          <div className="sm:col-span-8">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Question / Field Label *
                            </label>
                            <input
                              type="text"
                              required
                              value={field.label}
                              onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                              placeholder="e.g. Primary Project Goals, Team Size, Repository Link"
                              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          {/* Element Type Selector */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Element Type
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => {
                                const newType = e.target.value as FormFieldType;
                                const updates: Partial<IntakeQuestion> = { type: newType };
                                if (['select', 'radio', 'checkbox'].includes(newType) && (!field.options || field.options.length === 0)) {
                                  updates.options = ['Option 1', 'Option 2', 'Option 3'];
                                }
                                handleUpdateField(idx, updates);
                              }}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                            >
                              {AVAILABLE_ELEMENTS.map((el) => (
                                <option key={el.type} value={el.type}>
                                  {el.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Placeholder & Help Text */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {field.type !== 'date' && field.type !== 'radio' && field.type !== 'checkbox' && (
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Placeholder Text
                              </label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                                placeholder="e.g. Enter details..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          )}

                          <div className={field.type === 'date' || field.type === 'radio' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Helper Text / Instructions (Optional)
                            </label>
                            <input
                              type="text"
                              value={field.helpText || ''}
                              onChange={(e) => handleUpdateField(idx, { helpText: e.target.value })}
                              placeholder="e.g. Provide as much context as possible so we can prepare"
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Options Editor for Select, Radio, Checkbox */}
                        {isOptionsType && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">
                                Options / Choices ({(field.options || []).length})
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddOption(idx)}
                                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Choice</span>
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {(field.options || []).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 w-4">
                                    {optIdx + 1}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                                    placeholder={`Choice ${optIdx + 1}`}
                                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx, optIdx)}
                                    disabled={(field.options || []).length <= 1}
                                    className="rounded p-1 text-slate-400 hover:text-red-600 disabled:opacity-20 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Numeric Constraints */}
                        {field.type === 'number' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Minimum Value
                              </label>
                              <input
                                type="number"
                                value={field.min ?? ''}
                                onChange={(e) => handleUpdateField(idx, { min: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="0"
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Maximum Value
                              </label>
                              <input
                                type="number"
                                value={field.max ?? ''}
                                onChange={(e) => handleUpdateField(idx, { max: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="1000"
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                              />
                            </div>
                          </div>
                        )}

                        {/* Required Toggle */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              Require invitee to answer this question
                            </span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Invitee cannot book slot without answering required fields
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE INTERACTIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                <strong>Live Form Preview:</strong> Test inputs, dropdowns, radios, and validate required checks exactly as your client will see them when booking a slot.
              </span>
            </div>
          </div>

          {previewSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Form validation passed! All required customized details were filled successfully.</span>
            </div>
          )}

          {/* Device Mockup Wrapper */}
          <div className="flex justify-center p-2 sm:p-4 bg-slate-100/70 rounded-3xl border border-slate-200">
            <div
              className={`w-full bg-white transition-all duration-200 shadow-xl border border-slate-200 ${
                previewDevice === 'mobile'
                  ? 'max-w-sm rounded-[36px] p-6 ring-8 ring-slate-800/10'
                  : 'max-w-2xl rounded-2xl p-6 sm:p-8'
              }`}
            >
              {/* Form Header */}
              <div className="border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: themeColor }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {organizationName}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{formTitle}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{formDescription}</p>
              </div>

              {/* Live Preview Form (renders only configured fields when present) */}
              <form onSubmit={handleTestPreviewSubmit} className="space-y-4">
                {fields.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    No custom questions configured. Add elements from the &quot;Customize Form&quot; tab.
                  </div>
                ) : (
                  fields.map((field) => {
                    const hasError = Boolean(previewErrors[field.id]);
                    const currentVal = previewAnswers[field.id];

                    return (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.helpText && (
                          <p className="text-[11px] text-slate-500 leading-tight mb-1">
                            {field.helpText}
                          </p>
                        )}

                        {/* Field Element Renderers */}
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            placeholder={field.placeholder || 'Type here...'}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-800 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select an option...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'radio' ? (
                          <div className="space-y-2 pt-1">
                            {(field.options || []).map((opt) => {
                              const isChecked = currentVal === opt;
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                                    isChecked
                                      ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={field.id}
                                    checked={isChecked}
                                    onChange={() => setPreviewAnswers({ ...previewAnswers, [field.id]: opt })}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : field.type === 'checkbox' ? (
                          <div className="space-y-2 pt-1">
                            {(field.options || []).map((opt) => {
                              const selectedList: string[] = Array.isArray(currentVal) ? currentVal : [];
                              const isChecked = selectedList.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                                    isChecked
                                      ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...selectedList, opt]
                                        : selectedList.filter((s) => s !== opt);
                                      setPreviewAnswers({ ...previewAnswers, [field.id]: next });
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : field.type === 'date' ? (
                          <input
                            type="date"
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            placeholder={field.placeholder || 'e.g. 10'}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        ) : field.type === 'email' ? (
                          <input
                            type="email"
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            placeholder={field.placeholder || 'name@company.com'}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        ) : field.type === 'phone' ? (
                          <input
                            type="tel"
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            placeholder={field.placeholder || '+1 (555) 000-0000'}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        ) : field.type === 'url' ? (
                          <input
                            type="url"
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            placeholder={field.placeholder || 'https://example.com'}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentVal || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                            placeholder={field.placeholder || 'Your response...'}
                            className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:outline-none ${
                              hasError ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-blue-500'
                            }`}
                          />
                        )}

                        {hasError && (
                          <p className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{previewErrors[field.id]}</span>
                          </p>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Interactive simulation for {organizationName}
                  </span>
                  <button
                    type="submit"
                    className="rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-95 transition"
                    style={{ backgroundColor: themeColor }}
                  >
                    Confirm & Schedule Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

