import React, { useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  TrendingDown,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Sparkles,
  Check,
  Box,
  Star,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  Activity,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import MonitorHistoryChart from './MonitorHistoryChart';

export default function MonitorDetailView({
  monitorData,
  onBack,
  onCheckMonitor,
  onDeleteMonitor,
  isChecking,
  lastCheckResult,
}) {
  if (!monitorData || !monitorData.monitor) {
    return (
      <div className="bw-panel rounded-2xl p-12 text-center space-y-3">
        <p className="text-neutral-400">Loading monitor telemetry...</p>
      </div>
    );
  }

  const { monitor, comparison = {}, priceHistory = {}, recentChanges = [] } = monitorData;
  const competitorUrls = monitor.competitorUrls || [];
  const lowestPrice = comparison.lowestPrice ?? monitor.lowestPrice;
  const highestPrice = comparison.highestPrice ?? monitor.highestPrice;
  const priceDifference = comparison.priceDifference ?? monitor.priceDifference;
  const cheapestSource = comparison.cheapestSource ?? monitor.cheapestSource;

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const savingsPct =
    highestPrice && priceDifference
      ? ((priceDifference / highestPrice) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Top Header & Control Bar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 border border-neutral-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-xs text-neutral-500 font-mono">
            Monitor ID: {monitor._id}
          </span>
        </div>

        <div className="bw-panel rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                {monitor.brand || 'Competitor Target'}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {competitorUrls.length} Competitors Monitored
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {monitor.name}
            </h1>

            <div className="flex items-center space-x-3 text-xs text-neutral-400 font-mono">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Last Scraped: {formatTimestamp(monitor.lastCheckedAt)}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons: Check Now & Delete */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onCheckMonitor(monitor._id)}
              disabled={isChecking}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider shadow-lg disabled:opacity-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Bright Data DCA...' : 'Check Now'}</span>
            </button>

            {onDeleteMonitor && (
              <button
                type="button"
                title="Delete Monitor"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${monitor.name}" and all historical snapshots?`)) {
                    onDeleteMonitor(monitor._id);
                  }
                }}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-3 rounded-xl bg-neutral-900 hover:bg-red-500/10 hover:text-red-400 border border-neutral-800 hover:border-red-500/30 text-neutral-400 text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Change Banner / Toast if Check was performed */}
        {lastCheckResult && (
          <div className="bw-panel rounded-2xl p-4 border border-neutral-700 space-y-2 animate-fadeIn">
            {lastCheckResult.changes && lastCheckResult.changes.length > 0 ? (
              <div>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs font-mono uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>{lastCheckResult.changes.length} Change Event(s) Detected During Check:</span>
                </span>
                <ul className="mt-2 space-y-1 text-xs font-mono text-neutral-200 pl-2">
                  {lastCheckResult.changes.map((ch, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{ch.message || `${ch.type} on ${ch.source}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5 text-xs font-mono text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No changes detected since the last check. All prices and stock remain identical.</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Current Market Summary (4 Tiles) */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lowest Price Card */}
          <div className="bw-panel rounded-2xl p-5 border border-emerald-500/40 bg-emerald-950/10">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                Lowest Market Price
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatPrice(lowestPrice)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="text-emerald-300/90 font-medium">Source: {cheapestSource}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                Lowest Offer
              </span>
            </div>
          </div>

          {/* Cheapest Competitor Card */}
          <div className="bw-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-300">
                Cheapest Competitor
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-white tracking-tight truncate">
              {cheapestSource || 'N/A'}
            </div>
            <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Current arbitrage leader</span>
            </div>
          </div>

          {/* Highest Price Card */}
          <div className="bw-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                Highest Competitor
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-300 font-mono tracking-tight">
              {formatPrice(highestPrice)}
            </div>
            <div className="mt-2 text-[11px] text-neutral-500 font-medium">
              Upper market baseline price
            </div>
          </div>

          {/* Price Difference Card */}
          <div className="bw-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-300">
                Max Arbitrage Spread
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatPrice(priceDifference)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
              <span>{savingsPct}% Spread</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-200 font-mono font-bold">
                Delta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Competitor Status Breakdown Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Competitor Storefront Status ({competitorUrls.length})
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            Latest Normalized Snapshot Data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitorUrls.map((item, index) => {
            const isCheapest = item.source === cheapestSource || (lowestPrice && item.currentPrice === lowestPrice);
            const priceSpread = lowestPrice && item.currentPrice ? item.currentPrice - lowestPrice : 0;

            return (
              <div
                key={index}
                className={`rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                  isCheapest
                    ? 'bw-panel border-2 border-emerald-500/80 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bw-panel hover:border-white/20'
                }`}
              >
                {/* Cheapest Offer Ribbon */}
                {isCheapest && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[11px] font-black uppercase tracking-wider py-1.5 px-4 flex items-center justify-center space-x-1.5 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 fill-black stroke-black" />
                    <span>★ Lowest Market Offer</span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  {/* Header: Retailer Pill & SKU */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-neutral-900 border border-neutral-800 text-white">
                      <span className="tracking-tight">{item.source}</span>
                    </div>

                    {item.sku && (
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail & Title */}
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productTitle || item.source}
                          className="w-full h-full object-contain p-1.5"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Box className="w-8 h-8 text-neutral-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-bold text-neutral-100 line-clamp-2 leading-snug"
                        title={item.productTitle}
                      >
                        {item.productTitle || 'Product details extracted'}
                      </h3>
                    </div>
                  </div>

                  {/* Price Console */}
                  <div className="p-4 rounded-xl bg-black border border-neutral-800 flex items-baseline justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500 tracking-wider block">
                        Current Price
                      </span>
                      <div className="flex items-baseline space-x-2 mt-0.5">
                        <span className={`text-2xl font-black font-mono tracking-tight ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
                          {formatPrice(item.currentPrice)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.currentPrice && (
                          <span className="text-xs text-neutral-500 line-through font-mono">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.discount ? (
                      <span className="bg-neutral-800 text-white border border-neutral-700 text-xs font-bold px-2 py-0.5 rounded font-mono">
                        {item.discount}
                      </span>
                    ) : isCheapest ? (
                      <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                        Best Price
                      </span>
                    ) : priceSpread > 0 ? (
                      <span className="text-[11px] font-mono text-neutral-400">
                        +{formatPrice(priceSpread)}
                      </span>
                    ) : null}
                  </div>

                  {/* Stock & Rating Micro-Details */}
                  <div className="space-y-2 text-xs">
                    {item.availability && (
                      <div className="flex items-center space-x-1.5 text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                        <span className="truncate font-medium">{item.availability}</span>
                      </div>
                    )}

                    {item.rating && (
                      <div className="flex items-center space-x-2 text-neutral-400 text-xs">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                          <span className="font-bold text-white font-mono">{item.rating}</span>
                        </div>
                        {item.reviewCount && (
                          <span className="text-neutral-500 font-mono">({item.reviewCount.toLocaleString()} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Storefront Link */}
                <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[170px]">
                    {item.url}
                  </span>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-white hover:text-emerald-400 transition"
                    >
                      <span>Open Store</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Multi-Line Price History Graph */}
      <section className="space-y-4">
        <MonitorHistoryChart priceHistory={priceHistory} />
      </section>

      {/* 5. Recent Changes Section */}
      <section className="bw-panel rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-white" />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Change Detection Audit Log
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {recentChanges.length} Change Record{recentChanges.length > 1 ? 's' : ''}
          </span>
        </div>

        {recentChanges.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-400 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-neutral-300">No changes detected yet.</p>
            <p className="text-neutral-500 text-[11px]">
              Whenever prices shift, stock updates, or new market leads appear during checks, events will be recorded here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {recentChanges.map((event, idx) => {
              const isDrop = event.type === 'PRICE_DROP';
              const isIncrease = event.type === 'PRICE_INCREASE';
              const isAvail = event.type === 'AVAILABILITY_CHANGE';
              const isLowest = event.type === 'NEW_LOWEST_PRICE';
              const isFail = event.type === 'SOURCE_FAILURE';

              return (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0">
                      {isDrop && <TrendingDown className="w-4 h-4 text-emerald-400" />}
                      {isIncrease && <TrendingUp className="w-4 h-4 text-rose-400" />}
                      {isAvail && <Check className="w-4 h-4 text-cyan-400" />}
                      {isLowest && <Trophy className="w-4 h-4 text-amber-400" />}
                      {isFail && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            isDrop
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                              : isIncrease
                              ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                              : isAvail
                              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
                              : isLowest
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                              : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {event.type}
                        </span>

                        <span className="text-xs font-bold text-white font-mono">
                          {event.source}
                        </span>

                        {/* Price Change Pill */}
                        {typeof event.previousPrice === 'number' && typeof event.currentPrice === 'number' && (
                          <span className="text-[10px] font-mono text-neutral-400 bg-black px-2 py-0.5 rounded border border-neutral-800">
                            ₹{event.previousPrice.toLocaleString('en-IN')} → ₹{event.currentPrice.toLocaleString('en-IN')}
                          </span>
                        )}

                        {/* Availability Pill */}
                        {event.previousAvailability && event.currentAvailability && (
                          <span className="text-[10px] font-mono text-neutral-400 bg-black px-2 py-0.5 rounded border border-neutral-800">
                            "{event.previousAvailability}" → "{event.currentAvailability}"
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-200">
                        {event.message || (
                          isDrop
                            ? `${event.source} dropped its price by ₹${Math.abs(event.difference || 0).toLocaleString('en-IN')}`
                            : isIncrease
                            ? `${event.source} increased its price by ₹${(event.difference || 0).toLocaleString('en-IN')}`
                            : isAvail
                            ? `Availability on ${event.source} changed from "${event.previousAvailability}" to "${event.currentAvailability}"`
                            : isFail
                            ? `Scraper failure on ${event.source}`
                            : `${event.type} on ${event.source}`
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500 self-end sm:self-auto shrink-0">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
