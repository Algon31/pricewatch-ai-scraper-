import React from 'react';
import {
  Activity,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';

export default function ScraperHealth({ lastVerified }) {
  // Format the last verified timestamp
  const formatTimestamp = (dateInput) => {
    if (!dateInput) {
      return new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <section className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Scraper Health */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Scraper Health
            </h2>
            <p className="text-xs text-slate-400">
              Collector infrastructure status &amp; self-healing verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-0.5" />
            Healthy
          </span>
        </div>
      </div>

      {/* Scraper Health Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Status</span>
          <div className="flex items-center gap-2 mt-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-emerald-400">Healthy</span>
          </div>
        </div>

        {/* Custom Scraper */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Custom Scraper</span>
          <div className="flex items-center gap-2 mt-1.5">
            <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-200 truncate">
              Amazon Product Scraper
            </span>
          </div>
        </div>

        {/* Provider */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Provider</span>
          <div className="flex items-center gap-2 mt-1.5">
            <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-200 truncate">
              Bright Data Scraper Studio
            </span>
          </div>
        </div>

        {/* Self-Healing */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Self-Healing</span>
          <div className="flex items-center gap-2 mt-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              Enabled
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Active
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Last verified bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/40 border border-slate-700/30 rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-slate-300">Last verified:</span>
        </span>
        <span className="text-slate-200 font-mono text-xs">
          {formatTimestamp(lastVerified)}
        </span>
      </div>

      {/* Self-Healing Event Card */}
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden shadow-lg">
        {/* Accent indicator bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-emerald-400" />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Latest Verified Self-Healing Event
            </h3>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Repaired &amp; Verified
          </span>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* Issue detected */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Issue detected:
            </span>
            <p className="text-slate-200 font-medium">
              Product title selector failed
            </p>
          </div>

          {/* Failure */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Failure:
            </span>
            <p className="text-slate-200">
              scraper timed out waiting for an invalid selector
            </p>
          </div>

          {/* Repair */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-medium text-indigo-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Repair:
            </span>
            <p className="text-slate-200">
              Bright Data Self-Healing analyzed the scraper and repaired the selector
            </p>
          </div>

          {/* Verification */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Verification:
            </span>
            <p className="text-slate-200">
              scraper successfully extracted product data after the repair
            </p>
          </div>
        </div>

        {/* Attribution / Technical Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span>Self-healing executed via <strong>Bright Data Scraper Studio</strong></span>
          </span>
          <span className="text-slate-500 font-mono text-[10px]">
            Infrastructure Resiliency Demo
          </span>
        </div>
      </div>
    </section>
  );
}
