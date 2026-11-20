'use client';

import React, { useState, useEffect } from 'react';
import { EventType, CustomBookingForm } from '@calendly/types';
import { api } from '@/lib/api-client';
import { Copy, Check, ExternalLink, Code2, Globe, MonitorPlay, Sparkles, ClipboardList, Layers, Link2 } from 'lucide-react';

interface EmbedSuiteProps {
  eventTypes: EventType[];
  onNotify: (msg: string) => void;
}

export const EmbedSuite: React.FC<EmbedSuiteProps> = ({ eventTypes, onNotify }) => {
  const [shareMode, setShareMode] = useState<'form' | 'event'>('form');
  const [customForms, setCustomForms] = useState<CustomBookingForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedEventTypeSlug, setSelectedEventTypeSlug] = useState<string>('');
  const [origin, setOrigin] = useState<string>('http://localhost:3000');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Widget settings
  const [badgeText, setBadgeText] = useState('Schedule appointment');
  const [badgeColor, setBadgeColor] = useState('#3b82f6');
  const [iframeHeight, setIframeHeight] = useState('650');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    if (eventTypes.length > 0 && !selectedEventTypeSlug) {
      setSelectedEventTypeSlug(eventTypes[0].slug || eventTypes[0].id);
    }
    api.getCustomForms().then((forms) => {
      setCustomForms(forms);
      if (forms.length > 0 && !selectedFormId) {
        setSelectedFormId(forms[0].id);
      }
    }).catch(() => {});
  }, [eventTypes, selectedEventTypeSlug, selectedFormId]);

  const bookingUrl = shareMode === 'form' && selectedFormId
    ? `${origin}/book?form=${encodeURIComponent(selectedFormId)}`
    : `${origin}/book?slug=${encodeURIComponent(selectedEventTypeSlug)}`;

  const iframeSnippet = `<iframe
  src="${bookingUrl}"
  width="100%"
  height="${iframeHeight}px"
  frameborder="0"
  style="border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"
></iframe>`;

  const widgetScriptSnippet = `<!-- Calendly Recreate Universal Widget Badge -->
<link rel="stylesheet" href="${origin}/embed.css" />
<script src="${origin}/embed.js" async></script>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    CalendlyWidget.initBadge({
      url: '${bookingUrl}',
      text: '${badgeText}',
      color: '${badgeColor}',
      textColor: '#ffffff'
    });
  });
</script>`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    onNotify('Embed snippet copied to clipboard!');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Universal Embed & Share Suite
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
              Widget Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Share direct booking links, embed inline responsive iFrames, or install floating badge widgets on any website.
          </p>
        </div>

        {/* Purpose Form vs Event Type Switcher & Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setShareMode('form')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                shareMode === 'form'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Form Type</span>
            </button>
            <button
              type="button"
              onClick={() => setShareMode('event')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                shareMode === 'event'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Event Type</span>
            </button>
          </div>

          {shareMode === 'form' ? (
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none"
            >
              {customForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.fields?.length || 0} fields)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedEventTypeSlug}
              onChange={(e) => setSelectedEventTypeSlug(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none"
            >
              {eventTypes.map((et) => (
                <option key={et.id} value={et.slug || et.id}>
                  {et.name} ({et.duration}m)
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Embed Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Direct Share Link */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Direct Shareable Link</h3>
              <p className="text-xs text-slate-500">Send directly in emails, LinkedIn, or messaging apps.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-700 select-all"
            />
            <button
              onClick={() => handleCopy(bookingUrl, 'link')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
            >
              {copiedType === 'link' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
              <span>{copiedType === 'link' ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition"
              title="Open client booking page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Card 2: Floating Badge Widget */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Floating Badge Widget</h3>
              <p className="text-xs text-slate-500">A floating button in the bottom corner of your website.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Badge Button Text
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={badgeColor}
                  onChange={(e) => setBadgeColor(e.target.value)}
                  className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600">{badgeColor}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <pre className="rounded-xl bg-slate-900 p-3.5 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-32">
              {widgetScriptSnippet}
            </pre>
            <button
              onClick={() => handleCopy(widgetScriptSnippet, 'widget')}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 transition"
            >
              {copiedType === 'widget' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedType === 'widget' ? 'Copied' : 'Copy Snippet'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline iFrame Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MonitorPlay className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inline Embedded iFrame</h3>
              <p className="text-xs text-slate-500">
                Embed directly into your React, Next.js, WordPress, or HTML website with auto-sizing.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopy(iframeSnippet, 'iframe')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
          >
            {copiedType === 'iframe' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedType === 'iframe' ? 'Copied iFrame Code' : 'Copy iFrame Code'}</span>
          </button>
        </div>

        {/* iFrame Code Snippet */}
        <pre className="rounded-2xl bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
          {iframeSnippet}
        </pre>

        {/* Live Simulator Preview Frame */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Embed Simulator
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Embedded src: /book?slug={selectedEventTypeSlug}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-300/80 bg-slate-100 p-2 shadow-inner">
            <div className="h-6 flex items-center gap-1.5 px-3 pb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[10px] font-mono text-slate-400 truncate">
                https://yourdomain.com/schedule
              </span>
            </div>
            <div className="rounded-xl bg-white overflow-hidden border border-slate-200">
              <iframe
                src={`/book?slug=${selectedEventTypeSlug}`}
                title="Calendly Embed Preview"
                width="100%"
                height="560px"
                className="border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
