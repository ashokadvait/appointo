'use client';

import React, { useState } from 'react';
import { WorkflowsMap, WorkflowTemplate } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import { Sliders, Save, Check, Zap, Sparkles, Send } from 'lucide-react';

interface WorkflowEditorProps {
  workflows: WorkflowsMap;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

const TEMPLATE_VARIABLES = [
  '{invitee_name}',
  '{host_name}',
  '{event_name}',
  '{event_date}',
  '{event_time}',
  '{meeting_link}',
  '{invitee_timezone}',
  '{reschedule_url}',
];

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflows,
  onRefresh,
  onNotify,
}) => {
  const { showAlert } = useDialog();
  const [localWorkflows, setLocalWorkflows] = useState<WorkflowsMap>(workflows);
  const [activeStage, setActiveStage] = useState<string>('confirmation');
  const [saving, setSaving] = useState(false);

  // Webhook Simulator state
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.zapier.com/hooks/catch/12345/example');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  const currentTemplate = localWorkflows[activeStage] || {
    id: activeStage,
    enabled: true,
    title: activeStage,
    trigger: 'immediately_after_booking',
    channel: 'email',
    subject: '',
    body: '',
  };

  const handleUpdateCurrent = (updates: Partial<WorkflowTemplate>) => {
    setLocalWorkflows({
      ...localWorkflows,
      [activeStage]: {
        ...currentTemplate,
        ...updates,
      },
    });
  };

  const handleInsertVariable = (variable: string) => {
    handleUpdateCurrent({
      body: (currentTemplate.body || '') + ' ' + variable,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateWorkflows(localWorkflows);
      onNotify('Automation workflow templates saved successfully!');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Save Failed',
        message: err.message || 'Failed to save workflows',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const res = await api.testWebhook(webhookUrl);
      setWebhookResult(res);
      onNotify('Webhook dispatch test succeeded!');
    } catch (err: any) {
      showAlert({
        title: 'Webhook Test Failed',
        message: err.message || 'Failed to test webhook',
        type: 'error',
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  const stages = [
    { id: 'confirmation', name: '1. Instant Confirmation', timing: 'Immediately after booking' },
    { id: 'reminder_24h', name: '2. 24h Advance Notice', timing: '24 hours prior to call' },
    { id: 'reminder_1h', name: '3. 1h Urgent Call', timing: '1 hour prior to call' },
    { id: 'followup_post', name: '4. Post-Meeting Action', timing: '1 hour after meeting ends' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Automated Follow-Up Workflows & Timing
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              Rules Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Define automated email & webhook messaging pipelines triggered across the 4 meeting lifecycle stages.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save All Workflows'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stage Navigation Column */}
        <div className="lg:col-span-4 space-y-2">
          {stages.map((stage) => {
            const isSelected = activeStage === stage.id;
            const wf = localWorkflows[stage.id];
            const isEnabled = wf ? wf.enabled : true;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-white shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{stage.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isEnabled ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <span className="mt-1 block text-xs text-slate-500">{stage.timing}</span>
              </button>
            );
          })}

          {/* Webhook Dispatch Card */}
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider mb-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span>External Webhook Forwarder</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Forward live booking and reminder payloads to Zapier, Make, Slack, or your CRM.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={webhookLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{webhookLoading ? 'Testing...' : 'Test Webhook Dispatch'}</span>
              </button>
            </div>

            {webhookResult && (
              <div className="mt-3 rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-40">
                <pre>{JSON.stringify(webhookResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Template Editor Column */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{currentTemplate.title}</h3>
              <p className="text-xs text-slate-500">
                Channel: <span className="font-semibold uppercase text-blue-600">{currentTemplate.channel}</span>
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <span>Automated</span>
              <input
                type="checkbox"
                checked={currentTemplate.enabled}
                onChange={(e) => handleUpdateCurrent({ enabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email Subject Line
            </label>
            <input
              type="text"
              value={currentTemplate.subject}
              onChange={(e) => handleUpdateCurrent({ subject: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Dynamic Variable Pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Insert Dynamic Variables:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Message Template Body
            </label>
            <textarea
              rows={8}
              value={currentTemplate.body}
              onChange={(e) => handleUpdateCurrent({ body: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 p-4 font-mono text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
