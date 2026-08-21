import React from 'react';
import {
  Trophy,
  TrendingDown,
  ArrowUpRight,
  Percent,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function ComparisonSummary({ data }) {
  if (!data || !data.products || data.products.length === 0) {
    return null;
  }

  const { lowestPrice, highestPrice, priceDifference, cheapestSource, products } = data;

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const savingsPercentage =
    highestPrice && priceDifference
      ? ((priceDifference / highestPrice) * 100).toFixed(1)
      : '0.0';

  return (
    <section className="space-y-4">
      {/* Executive Market Spread Hero Banner */}
      <div className="bw-panel rounded-2xl p-6 sm:p-7 bg-[#0C0E0D] border border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Arbitrage Lead
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {products.length} Competitors Analyzed
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatPrice(priceDifference)} Arbitrage Spread Detected
            </h2>
            <p className="text-xs text-neutral-400">
              Purchasing via <strong className="text-emerald-400 font-semibold">{cheapestSource}</strong> delivers a direct{' '}
              <span className="text-emerald-400 font-bold">{savingsPercentage}% savings</span> over the highest competitor.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-black border border-neutral-800 text-right">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block tracking-wider">
                Cheapest Source
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {cheapestSource}
              </span>
            </div>

            <div className="px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-right shadow-md">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-300 block tracking-wider">
                Lowest Price
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                {formatPrice(lowestPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Precision Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lowest Price Card - Highlighted in Emerald Green */}
        <div className="bw-panel rounded-2xl p-5 border border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60 transition">
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

        {/* Cheapest Source Card */}
        <div className="bw-panel rounded-2xl p-5 hover:border-white/30 transition">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-300">
              Cheapest Retailer
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
            <span>Best direct price leader</span>
          </div>
        </div>

        {/* Highest Price Card */}
        <div className="bw-panel rounded-2xl p-5 hover:border-white/30 transition">
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

        {/* Price Difference / Arbitrage Card */}
        <div className="bw-panel rounded-2xl p-5 hover:border-white/30 transition">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-300">
              Max Arbitrage Delta
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatPrice(priceDifference)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{savingsPercentage}% Spread</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-200 font-mono font-bold">
              Delta
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
