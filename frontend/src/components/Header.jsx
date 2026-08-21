import React from 'react';
import { Activity, ShieldCheck, Zap, LayoutDashboard, GitCompare, PlusCircle } from 'lucide-react';

export default function Header({ currentView, onNavigate }) {
  return (
    <header className="border-b border-neutral-800 bg-black/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black shadow-sm group-hover:bg-neutral-200 transition">
                <Activity className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white font-sans">
                WebPulse
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 uppercase">
                B2B Intel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-2 border-l border-neutral-800">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'dashboard' || currentView === 'detail'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('compare')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'compare'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Products</span>
            </button>

            <button
              onClick={() => onNavigate('add-monitor')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'add-monitor'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Monitor</span>
            </button>
          </nav>
        </div>

        {/* Telemetry Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-medium text-[11px]">3 Collectors Active</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs">
            <Zap className="w-3 h-3 text-neutral-400" />
            <span className="text-[11px] font-mono">Bright Data DCA</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm">
            <ShieldCheck className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Self-Healing</span>
          </div>
        </div>
      </div>
    </header>
  );
}
