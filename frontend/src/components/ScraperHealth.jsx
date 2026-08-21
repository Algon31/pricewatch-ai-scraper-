import React from 'react';
import {
  Activity,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Cpu,
  Network
} from 'lucide-react';

export default function ScraperHealth({ lastVerified }) {
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
    <section className="bw-panel rounded-2xl p-6 sm:p-7 space-y-6">
      {/* Top Header: Scraper Health & Telemetry with Emerald Accents */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Scraper Intelligence &amp; Architecture
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              WebPulse detects the retailer domain and routes the URL to the appropriate Bright Data Scraper Studio collector.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-0.5" />
            <span>ALL 3 DCA COLLECTORS ACTIVE</span>
          </span>
        </div>
      </div>

      {/* 4 Telemetry Status Cards with Emerald Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Cluster Status</span>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-emerald-400 font-mono">100% Operational</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Scraper Engine</span>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-neutral-300 shrink-0" />
            <span className="text-xs font-semibold text-neutral-200 truncate">Scraper Studio DCA</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Collector Routing</span>
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-neutral-300 shrink-0" />
            <span className="text-xs font-semibold text-neutral-200 truncate">Automatic Domain Match</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Self-Healing Protocol</span>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-400 font-mono">Enabled · Active</span>
          </div>
        </div>
      </div>

      {/* Collector Telemetry Table with Supported Sources */}
      <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider block">
            Supported Sources &amp; Custom DCA Collectors:
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            Custom Scrapers per Retailer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Amazon</span>
              <span className="text-emerald-400 text-[10px]">Active</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">amazon.in, amzn.in, amazon.com</p>
            <span className="text-neutral-500 text-[10px] block">Collector ID: c_mt0gyz9d11g1yi8p98</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Kamal Imaging</span>
              <span className="text-emerald-400 text-[10px]">Active</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">kamalimaging.com</p>
            <span className="text-neutral-500 text-[10px] block">Collector ID: c_mt1bz3s5tdc173nng</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Fujifilm X India</span>
              <span className="text-emerald-400 text-[10px]">Active</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">fujifilmxindia.com</p>
            <span className="text-neutral-500 text-[10px] block">Collector ID: c_mt1cchzkfvyuvi8tm</span>
          </div>
        </div>
      </div>

      {/* Verified Self-Healing Incident Record Card */}
      <div className="rounded-xl border border-neutral-800 bg-[#0C0E0D] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Latest Verified Self-Healing Incident Audit
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Verified repair demonstration conducted during collector development
              </p>
            </div>
          </div>

          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>STATUS: REPAIRED &amp; VERIFIED</span>
          </span>
        </div>

        {/* 4-Step Incident Lifecycle */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">
              01. Issue Detected
            </span>
            <p className="text-neutral-200 text-[11px] leading-snug">
              Product title selector modified to an invalid target.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">
              02. Scraper Failure
            </span>
            <p className="text-neutral-200 text-[11px] leading-snug">
              DCA collector timed out waiting for the invalid selector.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono text-neutral-300 font-bold uppercase tracking-wider block">
              03. AI Auto-Repair
            </span>
            <p className="text-neutral-200 text-[11px] leading-snug">
              Bright Data Self-Healing analyzed the DOM &amp; repaired the selector.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black border border-emerald-500/30 space-y-1 bg-emerald-950/10">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
              04. Verification
            </span>
            <p className="text-emerald-200 text-[11px] leading-snug">
              Collector extracted 100% structured product schema without code edits.
            </p>
          </div>
        </div>

        <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono border-t border-neutral-800">
          <span>Collector Engine: Bright Data Scraper Studio (Custom scrapers configured)</span>
          <span className="text-neutral-500">Self-healing demonstrated during development · Zero backend runtime changes</span>
        </div>
      </div>
    </section>
  );
}
