'use client';

import React, { useState } from 'react';
import { RoutingForm, EventType } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import { GitBranch, Plus, Play, CheckCircle2, ArrowRight, Sparkles, Send } from 'lucide-react';

interface RoutingFormsViewProps {
  forms: RoutingForm[];
  eventTypes: EventType[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const RoutingFormsView: React.FC<RoutingFormsViewProps> = ({
  forms,
  eventTypes,
  onRefresh,
  onNotify,
}) => {
  const { showAlert } = useDialog();
  const [selectedForm, setSelectedForm] = useState<RoutingForm | null>(
    forms.length > 0 ? forms[0] : null
  );

  // Live Simulator State
  const [simulatorAnswers, setSimulatorAnswers] = useState<Record<string, string>>({});
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await api.submitRoutingForm(selectedForm.id, simulatorAnswers);
      setEvaluationResult(res);
      onNotify('Form evaluated! See routing path below.');
    } catch (err: any) {
      showAlert({
        title: 'Evaluation Failed',
        message: err.message || 'Failed to submit form',
        type: 'error',
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Routing Forms & Lead Qualification Engine
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Conditional Logic
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Screen high-intent leads upfront with conditional questions and automatically route them to the right meeting type or consultant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Forms List & Rules */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Qualification Forms ({forms.length})
            </span>

            <div className="space-y-2">
              {forms.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedForm(f);
                    setEvaluationResult(null);
                    setSimulatorAnswers({});
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedForm?.id === f.id
                      ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{f.title}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">{f.description}</p>
                </button>
              ))}
            </div>

            {selectedForm && (
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Routing Rules ({selectedForm.rules?.length || 0})
                  </h3>
                </div>

                <div className="space-y-2">
                  {selectedForm.rules?.map((r) => {
                    const targetEt = eventTypes.find((e) => e.id === r.targetId);
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 font-mono">IF [{r.fieldId}]</span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="text-blue-600 font-semibold">{r.operator}</span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            &quot;{r.value}&quot;
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700 font-bold pt-1">
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>ROUTE TO: {targetEt ? targetEt.name : r.targetId}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Interactive Simulator Column */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Play className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Routing Simulator</h3>
              <p className="text-xs text-slate-500">
                Answer the questionnaire to test real-time conditional logic and redirection.
              </p>
            </div>
          </div>

          {selectedForm ? (
            <form onSubmit={handleSimulate} className="space-y-5">
              {selectedForm.questions?.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    {q.label} {q.required && '*'}
                  </label>
                  {q.type === 'select' ? (
                    <select
                      required={q.required}
                      value={simulatorAnswers[q.id] || ''}
                      onChange={(e) =>
                        setSimulatorAnswers({ ...simulatorAnswers, [q.id]: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">Select option...</option>
                      {q.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required={q.required}
                      value={simulatorAnswers[q.id] || ''}
                      onChange={(e) =>
                        setSimulatorAnswers({ ...simulatorAnswers, [q.id]: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={evaluating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition"
              >
                <Send className="h-4 w-4" />
                <span>{evaluating ? 'Evaluating Route...' : 'Submit & Evaluate Route'}</span>
              </button>
            </form>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Select a form to start the simulator.
            </div>
          )}

          {/* Dynamic Evaluation Result */}
          {evaluationResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Qualification Resolved</span>
              </div>
              <p className="text-sm font-extrabold text-slate-900">{evaluationResult.message}</p>
              <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-3 rounded-xl border border-emerald-100">
                <span className="font-mono text-slate-500">Destination:</span>
                <a
                  href={evaluationResult.redirectUrl}
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>{evaluationResult.redirectUrl}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
