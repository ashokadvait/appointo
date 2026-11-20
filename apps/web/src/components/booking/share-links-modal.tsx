'use client';

import React, { useState, useEffect } from 'react';
import { EventType, CustomBookingForm } from '@calendly/types';
import { api } from '@/lib/api-client';
import {
  Link2,
  Copy,
  ExternalLink,
  Check,
  X,
  Sparkles,
  Layers,
  ClipboardList,
  Clock,
  ShieldCheck,
  Share2,
} from 'lucide-react';

interface ShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTypes: EventType[];
  initialTab?: 'forms' | 'events';
  onNotify?: (msg: string) => void;
}

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({
  isOpen,
  onClose,
  eventTypes,
  initialTab = 'forms',
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'forms' | 'events'>(initialTab);
  const [customForms, setCustomForms] = useState<CustomBookingForm[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    api.getCustomForms().then(setCustomForms).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleCopy = (id: string, url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    if (onNotify) {
      onNotify(`Link copied for "${label}"! Anyone can use this link to book free slots.`);
    }
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Shareable Public Booking Links
              </h2>
              <p className="text-xs text-slate-500">
                Anyone with these links can view your free slots and create their own appointment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3">
          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'forms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Different Form Types / Purposes ({customForms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'events'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Event Types & Durations ({eventTypes.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {/* TAB 1: FORM TYPES */}
          {activeTab === 'forms' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50/80 border border-blue-200/70 p-3 text-xs text-blue-900">
                <span className="font-bold">Purpose-Specific Links:</span> Each form presents a different intake questionnaire tailored to that purpose (e.g., Tech Discovery, B2B Sales, Healthcare Clinic, Candidate Screening).
              </div>

              {customForms.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No customized forms created yet. Go to the Custom Forms tab to design one.
                </div>
              ) : (
                customForms.map((f) => {
                  const url = `${origin}/book?form=${encodeURIComponent(f.id)}`;
                  const isCopied = copiedId === f.id;
                  const linkedEts = eventTypes.filter((e) => f.targetEventTypeIds?.includes(e.id));

                  return (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-slate-200 p-4 bg-white hover:border-blue-300 hover:shadow-xs transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                            {f.organizationName && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {f.organizationName}
                              </span>
                            )}
                          </div>
                          {f.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {f.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {f.fields?.length || 0} fields
                          </span>
                          {linkedEts.length > 0 && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                              {linkedEts.map((e) => `${e.duration}m`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          readOnly
                          value={url}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(f.id, url, f.title)}
                          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition active:scale-95 shrink-0"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
                          title="Open live link to test booking"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                          <span>Test</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: EVENT TYPES */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
                <span className="font-bold">Duration-Specific Links:</span> Share direct links for specific meeting lengths (e.g. 15-minute quick call vs 60-minute in-depth review).
              </div>

              {eventTypes.map((et) => {
                const url = `${origin}/book?id=${encodeURIComponent(et.id)}`;
                const isCopied = copiedId === et.id;

                return (
                  <div
                    key={et.id}
                    className="rounded-2xl border border-slate-200 p-4 bg-white hover:border-blue-300 hover:shadow-xs transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: et.color || '#3b82f6' }}
                        />
                        <h4 className="text-sm font-bold text-slate-900">{et.name}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {et.duration} mins
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 capitalize border border-blue-200/50">
                          {et.locationType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={url}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(et.id, url, et.name)}
                        className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition active:scale-95 shrink-0"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
                        title="Open live link to test booking"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        <span>Test</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <p className="text-[11px] text-slate-500">
            Slots booked by invitees are automatically removed from your free availability.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200/80 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

