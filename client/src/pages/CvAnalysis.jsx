import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles, FileText, RefreshCw, Trash2, Plus, AlertTriangle, CheckCircle2, XCircle, History, Wand2,
} from 'lucide-react';
import { useCvLatest, useCvAnalyses, useAnalysis, useAnalyzeCv, useDeleteAnalysis, useApplySkills } from '../services/ai.js';
import { apiErrorMessage } from '../api/client.js';
import { Button } from '../components/Button.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Skeleton } from '../components/Loaders.jsx';
import { ScoreGauge } from '../components/ScoreGauge.jsx';

const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-700 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-50 text-slate-600 ring-slate-200',
};

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CvAnalysis() {
  const [text, setText] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { data: latest, isLoading: loadingLatest } = useCvLatest();
  const { data: history } = useCvAnalyses({ limit: 20 });
  const { data: selected } = useAnalysis(selectedId, { enabled: !!selectedId });

  const analyze = useAnalyzeCv();
  const del = useDeleteAnalysis();
  const applySkills = useApplySkills();

  // Show the explicitly selected analysis, else the latest.
  const analysis = selected || latest;
  const result = analysis?.result;

  const runAnalyze = async (opts = {}) => {
    try {
      const a = await analyze.mutateAsync({ text: text.trim() || undefined, ...opts });
      setSelectedId(a._id || a.id);
      toast.success('CV analyzed');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Analysis failed'));
    }
  };

  const onApplySkills = async () => {
    try {
      const { added } = await applySkills.mutateAsync(analysis._id || analysis.id);
      toast.success(added.length ? `Added ${added.length} skill(s) to your profile` : 'No new skills to add');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update profile'));
    }
  };

  const onDelete = async (id) => {
    try {
      await del.mutateAsync(id);
      if ((analysis?._id || analysis?.id) === id) setSelectedId(null);
      toast.success('Analysis deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 text-brand-700">
        <Sparkles className="h-5 w-5" />
        <h1 className="text-2xl font-bold text-slate-900">CV Analyzer</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Get an instant, AI-assisted read on your CV — detected skills, scores, and concrete improvements.
      </p>

      {/* Advisory disclaimer */}
      <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This analysis is advisory and assesses presentation only. It is <b>not identity verification</b> and does not confirm any claim on your CV.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* PLACEHOLDER_CONTROLS */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Run an analysis</h2>
            <p className="mt-1 text-sm text-slate-500">
              Analyze the CV on your profile, or paste CV text below (useful for image-only PDFs).
            </p>
            <Textarea
              className="mt-3"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional: paste your CV text here…"
              hint={`${text.length} characters`}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => runAnalyze()} loading={analyze.isPending}>
                {text.trim() ? <Wand2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {text.trim() ? 'Analyze pasted text' : 'Analyze my uploaded CV'}
              </Button>
              {analysis && (
                <Button variant="secondary" onClick={() => runAnalyze({ force: true })} loading={analyze.isPending}>
                  <RefreshCw className="h-4 w-4" /> Re-run
                </Button>
              )}
            </div>
          </section>
          {/* PLACEHOLDER_RESULTS */}
          {loadingLatest && !analysis ? (
            <Skeleton className="h-64" />
          ) : !result ? (
            <section className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-medium text-slate-700">No analysis yet</p>
              <p className="mt-1 text-sm text-slate-500">Run your first CV analysis to see scores and tips.</p>
            </section>
          ) : (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-6">
                    <ScoreGauge value={result.overallScore} label="Overall" />
                    <ScoreGauge value={result.atsScore} label="ATS" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 capitalize">{result.seniority || 'n/a'}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{result.experienceYears} yr experience</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{result.wordCount} words</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{result.summary}</p>
                    <p className="mt-2 text-xs text-slate-400">Analyzed {fmtDate(analysis.createdAt)} · {analysis.provider}</p>
                  </div>
                </div>
              </section>

              {/* Skills */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900">Detected skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.detectedSkills.length ? result.detectedSkills.map((s) => (
                    <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium capitalize text-brand-700">{s}</span>
                  )) : <p className="text-sm text-slate-500">No skills detected.</p>}
                </div>
                {result.suggestedSkills?.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700">Not on your profile yet</h3>
                      <Button size="sm" variant="secondary" onClick={onApplySkills} loading={applySkills.isPending}>
                        <Plus className="h-4 w-4" /> Add all to profile
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.suggestedSkills.map((s) => (
                        <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Strengths / weaknesses */}
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Strengths</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {result.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span> {s}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900"><XCircle className="h-5 w-5 text-red-500" /> Weaknesses</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {result.weaknesses.map((s, i) => <li key={i} className="flex gap-2"><span className="text-red-400">•</span> {s}</li>)}
                  </ul>
                </div>
              </section>

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold text-slate-900">Recommendations</h2>
                  <ul className="mt-3 space-y-3">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-slate-900">{r.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.medium}`}>{r.priority}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{r.detail}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
        {/* PLACEHOLDER_HISTORY */}
        <div>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><History className="h-5 w-5 text-brand-600" /> History</h2>
            {history?.items?.length ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {history.items.map((a) => {
                  const active = (analysis?._id || analysis?.id) === (a._id || a.id);
                  return (
                    <li key={a._id || a.id} className="flex items-center justify-between gap-2 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(a._id || a.id)}
                        className={`min-w-0 flex-1 text-left ${active ? 'text-brand-700' : 'text-slate-700 hover:text-brand-600'}`}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className={`inline-block h-2 w-2 rounded-full ${a.result.overallScore >= 75 ? 'bg-emerald-500' : a.result.overallScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                          Score {a.result.overallScore}
                        </div>
                        <div className="truncate text-xs text-slate-400">{fmtDate(a.createdAt)}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(a._id || a.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete analysis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Your past analyses will appear here.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
