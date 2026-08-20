import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from 'lucide-react';

export default function PriceChangeCard({ priceChange }) {
  if (!priceChange) return null;

  const { previousPrice, currentPrice, difference, percentageChange, direction } = priceChange;

  const formatPrice = (val, currency = 'INR') => {
    if (val === null || val === undefined) return 'N/A';
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${val.toLocaleString('en-IN')}`;
  };

  const getBadgeStyle = () => {
    switch (direction) {
      case 'decreased':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <ArrowDownRight className="w-4 h-4 mr-1 text-emerald-400" />,
          label: 'Price Dropped',
        };
      case 'increased':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <ArrowUpRight className="w-4 h-4 mr-1 text-rose-400" />,
          label: 'Price Increased',
        };
      case 'unchanged':
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          icon: <Minus className="w-4 h-4 mr-1 text-slate-400" />,
          label: 'Price Unchanged',
        };
      case 'initial':
      default:
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          icon: <Sparkles className="w-4 h-4 mr-1 text-indigo-400" />,
          label: 'Initial Tracking Scrape',
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Price Change Analytics
        </h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${badge.bg}`}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
          <p className="text-xs text-slate-400 mb-1">Previous Price</p>
          <p className="text-lg font-bold text-slate-200">
            {formatPrice(previousPrice)}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
          <p className="text-xs text-slate-400 mb-1">Current Price</p>
          <p className="text-lg font-bold text-white">
            {formatPrice(currentPrice)}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
          <p className="text-xs text-slate-400 mb-1">Difference</p>
          <p
            className={`text-lg font-bold ${
              difference < 0
                ? 'text-emerald-400'
                : difference > 0
                ? 'text-rose-400'
                : 'text-slate-200'
            }`}
          >
            {difference !== null ? formatPrice(difference) : 'N/A'}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5">
          <p className="text-xs text-slate-400 mb-1">Percentage Change</p>
          <p
            className={`text-lg font-bold ${
              percentageChange < 0
                ? 'text-emerald-400'
                : percentageChange > 0
                ? 'text-rose-400'
                : 'text-slate-200'
            }`}
          >
            {percentageChange !== null
              ? `${percentageChange > 0 ? '+' : ''}${percentageChange}%`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
