import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function ScrapeForm({ onScrape, loading, error }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onScrape(url.trim());
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        Track New Amazon Product
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        Paste an Amazon URL to trigger Bright Data live scraping and save price history.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://amzn.in/d/..."
            disabled={loading}
            required
            className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Scraping Product...
            </>
          ) : (
            'Track Product'
          )}
        </button>
      </form>

      {loading && (
        <div className="mt-4 p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-xs text-indigo-200 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 flex-shrink-0" />
          <span>
            Bright Data Data Collector API is scraping the Amazon page... This usually takes 15–30 seconds.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
