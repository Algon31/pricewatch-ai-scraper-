import React from 'react';
import { TrendingDown, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              PriceWatch AI
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Track product prices automatically
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-700/50 rounded-full px-3 py-1.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Bright Data & MongoDB Connected</span>
        </div>
      </div>
    </header>
  );
}
