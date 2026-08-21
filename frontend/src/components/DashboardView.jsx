import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingDown,
  Building2,
  Clock,
  RefreshCw,
  Eye,
  Plus,
  Zap,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function DashboardView({
  monitors = [],
  recentChangesCount = 0,
  loading,
  onRefresh,
  onSelectMonitor,
  onCheckMonitor,
  onDeleteMonitor,
  onNavigateToAdd,
  checkingMonitorId,
  checkResultsMap = {},
}) {
  const formatPrice = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatTimestamp = (dateInput) => {
    if (!dateInput) return 'Never';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Summary Metrics calculations
  const totalMonitors = monitors.length;
  const totalCompetitorsTracked = monitors.reduce((sum, m) => sum + (m.competitorsCount || 0), 0);
  const mostRecentCheck = monitors.reduce((latest, m) => {
    if (!m.lastCheckedAt) return latest;
    const t = new Date(m.lastCheckedAt).getTime();
    return t > latest ? t : latest;
  }, 0);

  // Dynamic detected changes from recent checks or backend count
  const detectedCheckChangesCount = Object.values(checkResultsMap).reduce(
    (sum, r) => sum + (r?.changes?.length || 0),
    0
  );
  const displayPriceChangesCount = Math.max(recentChangesCount, detectedCheckChangesCount);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Summary Section at Top */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 text-white" />
              <span>Competitor Monitoring Terminal</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Automated multi-source price tracking, snapshot history, and delta intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 border border-neutral-800 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onNavigateToAdd}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-xs font-bold text-black shadow-md transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Monitor</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bw-panel rounded-2xl p-5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider font-semibold">
              Active Monitors
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {totalMonitors}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                Live Feeds
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 block pt-1">
              Multi-source target products
            </span>
          </div>

          <div className="bw-panel rounded-2xl p-5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider font-semibold">
              Competitors Tracked
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {totalCompetitorsTracked}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% DCA Active
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 block pt-1">
              Amazon · Kamal · Fujifilm
            </span>
          </div>

          <div className="bw-panel rounded-2xl p-5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider font-semibold">
              Recent Price Changes
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {displayPriceChangesCount}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Delta Events
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 block pt-1">
              Recorded price &amp; shift logs
            </span>
          </div>

          <div className="bw-panel rounded-2xl p-5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider font-semibold">
              Last Checked
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-neutral-200 font-mono tracking-tight truncate">
                {mostRecentCheck ? formatTimestamp(mostRecentCheck) : 'Just Now'}
              </span>
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <span className="text-[11px] text-neutral-400 block pt-1">
              MongoDB snapshot registry
            </span>
          </div>
        </div>
      </section>

      {/* 2. Monitored Products Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-white" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Monitored Product Portfolio ({monitors.length})
            </h2>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            Auto-synced with MongoDB Snapshots
          </span>
        </div>

        {monitors.length === 0 && !loading ? (
          <div className="bw-panel rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Monitored Products Yet</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Create a monitored product with competitor URLs to start receiving real-time price change alerts and historical graphs.
              </p>
            </div>
            <button
              onClick={onNavigateToAdd}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Your First Monitor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {monitors.map((mon) => {
              const isChecking = checkingMonitorId === mon._id;
              const checkResult = checkResultsMap[mon._id];

              return (
                <div
                  key={mon._id}
                  className="bw-panel rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-white/20 transition group"
                >
                  <div className="space-y-4">
                    {/* Card Top: Brand & Competitor Count */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        {mon.brand || 'Competitor Matrix'}
                      </span>

                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{mon.competitorsCount || 3} Competitors Tracked</span>
                      </span>
                    </div>

                    {/* Product Name */}
                    <div>
                      <h3
                        onClick={() => onSelectMonitor(mon._id)}
                        className="text-base font-bold text-white group-hover:text-neutral-200 transition cursor-pointer line-clamp-1"
                      >
                        {mon.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        Last Scraped: {formatTimestamp(mon.lastCheckedAt)}
                      </p>
                    </div>

                    {/* Market Arbitrage Price Console */}
                    <div className="p-4 rounded-xl bg-black border border-neutral-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block">
                          Lowest Price
                        </span>
                        <span className="text-lg font-black font-mono text-emerald-400 tracking-tight">
                          {formatPrice(mon.lowestPrice)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block">
                          Cheapest Source
                        </span>
                        <span className="text-xs font-bold text-white truncate block mt-0.5">
                          {mon.cheapestSource || 'N/A'}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-3">
                        <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block">
                          Max Spread
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-300 block mt-0.5">
                          {formatPrice(mon.priceDifference)}
                        </span>
                      </div>
                    </div>

                    {/* Check Result Banner (If Check Now was clicked) */}
                    {checkResult && (
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 space-y-1 text-xs animate-fadeIn">
                        {checkResult.changes && checkResult.changes.length > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px] font-mono uppercase">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{checkResult.changes.length} Change(s) Detected:</span>
                            </span>
                            <ul className="mt-1 space-y-0.5 text-neutral-300 text-[11px]">
                              {checkResult.changes.map((ch, cIdx) => (
                                <li key={cIdx} className="font-mono">
                                  • {ch.message || `${ch.type} on ${ch.source}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-neutral-300 text-[11px] font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>No changes detected since the last check.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Check Now, View Monitor & Delete */}
                  <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onCheckMonitor(mon._id)}
                        disabled={isChecking}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 transition disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
                        <span>{isChecking ? 'Scraping...' : 'Check'}</span>
                      </button>

                      {onDeleteMonitor && (
                        <button
                          type="button"
                          title="Delete Monitor"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${mon.name}" and all associated price history?`)) {
                              onDeleteMonitor(mon._id);
                            }
                          }}
                          className="p-2 rounded-xl bg-neutral-900 hover:bg-red-500/10 hover:text-red-400 border border-neutral-800 hover:border-red-500/30 text-neutral-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectMonitor(mon._id)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-sm transition group/btn cursor-pointer"
                    >
                      <span>View Monitor</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
