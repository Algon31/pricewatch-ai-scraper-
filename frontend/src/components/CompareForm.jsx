import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Layers,
  Globe,
  Radio,
  PlusCircle,
  Tag
} from 'lucide-react';

const PRESETS = [
  {
    id: 'xh2s',
    name: 'Fujifilm X-H2S',
    title: 'Fujifilm X-H2S (Mirrorless Body)',
    tag: 'Flagship Speed',
    urls: [
      'https://www.amazon.in/Fujifilm-16756924-FUJIFILM-Mirrorless-Camera/dp/B0B2F5VHLM/ref=sr_1_2_sspa?sr=8-2-spons&aref=zL8zerqRtq&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1',
      'https://kamalimaging.com/products/fujifilm-x-h2s-mirrorless-camera?utm_pdp_clicked=9cd6b872-d863-4b82-867f-7a4048992bf6',
      'https://fujifilmxindia.com/products/fujifilm-x-h2s-mirrorless?_pos=1&_psq=Fujifilm+X-H2S&_psid=f9700e959&_ss=e',
    ],
  },
  {
    id: 'xm5',
    name: 'Fujifilm X-M5',
    title: 'Fujifilm X-M5 (with 15-45mm Kit)',
    tag: 'Compact Hybrid',
    urls: [
      'https://amzn.in/d/05nY9mcD',
      'https://kamalimaging.com/products/fujifilm-x-m5-mirrorless-camera-with-xc-15-45mm-lens-silver',
      'https://fujifilmxindia.com/products/fujifilm-x-m5',
    ],
  },
];

const DETECT_SOURCE = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const lower = urlStr.toLowerCase();
  if (lower.includes('amazon.') || lower.includes('amzn.')) {
    return { name: 'Amazon', badge: 'bg-neutral-800 text-white border-neutral-700', collector: 'c_mt0gyz9d11g1yi8p98' };
  }
  if (lower.includes('kamalimaging.com')) {
    return { name: 'Kamal Imaging', badge: 'bg-neutral-800 text-white border-neutral-700', collector: 'c_mt1bz3s5tdc173nng' };
  }
  if (lower.includes('fujifilmxindia.com')) {
    return { name: 'Fujifilm X India', badge: 'bg-neutral-800 text-white border-neutral-700', collector: 'c_mt1cchzkfvyuvi8tm' };
  }
  if (urlStr.length > 8) {
    return { name: 'Custom Domain', badge: 'bg-neutral-900 text-neutral-400 border-neutral-800', collector: 'Auto DCA Routing' };
  }
  return null;
};

export default function CompareForm({
  onCompare,
  onCreateMonitor,
  isLoading,
  isCreatingMonitor,
  error,
  mode = 'compare', // 'compare' or 'add-monitor'
}) {
  const [urls, setUrls] = useState(PRESETS[0].urls);
  const [monitorName, setMonitorName] = useState(PRESETS[0].name);
  const [activePreset, setActivePreset] = useState('xh2s');
  const [inputError, setInputError] = useState('');

  const handleUrlChange = (index, value) => {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
    setActivePreset(null);
    if (inputError) setInputError('');
  };

  const handleAddUrl = () => {
    if (urls.length >= 6) return;
    setUrls([...urls, '']);
    setActivePreset(null);
  };

  const handleRemoveUrl = (index) => {
    if (urls.length <= 1) return;
    const updated = urls.filter((_, idx) => idx !== index);
    setUrls(updated);
    setActivePreset(null);
  };

  const handleSelectPreset = (preset) => {
    setUrls(preset.urls);
    setMonitorName(preset.name);
    setActivePreset(preset.id);
    setInputError('');
  };

  const handleRunCompare = (e) => {
    if (e) e.preventDefault();
    const validUrls = urls.map((u) => u.trim()).filter((u) => u.length > 0);

    if (validUrls.length < 2) {
      setInputError('Please provide at least 2 competitor URLs for price comparison.');
      return;
    }

    setInputError('');
    onCompare(validUrls);
  };

  const handleStartMonitoring = (e) => {
    if (e) e.preventDefault();
    const validUrls = urls.map((u) => u.trim()).filter((u) => u.length > 0);

    if (!monitorName.trim()) {
      setInputError('Please enter a product monitor name (e.g. "Fujifilm X-H2S").');
      return;
    }

    if (validUrls.length < 2) {
      setInputError('Please provide at least 2 competitor URLs to create a monitor.');
      return;
    }

    setInputError('');
    onCreateMonitor(monitorName.trim(), validUrls);
  };

  return (
    <section className="bw-panel rounded-2xl p-6 sm:p-7 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              {mode === 'add-monitor' ? 'Create New Product Monitor' : 'Competitor URL Ingestion Deck'}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Provide multi-retailer URLs. WebPulse automatically routes each target to its custom Bright Data Scraper Studio collector.
          </p>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 w-fit">
          DCA Collector Mode
        </span>
      </div>

      {/* Preset Selectors: Dedicated Aligned 2-Column Grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
          Demo Target Presets:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition border text-left cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${activePreset === preset.id ? 'bg-black' : 'bg-white'}`} />
                <span className="font-bold truncate">{preset.title}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                  activePreset === preset.id
                    ? 'bg-black text-white'
                    : 'bg-black text-neutral-400 border border-neutral-800'
                }`}
              >
                {preset.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Monitor Name Input Field */}
      <div className="p-3.5 rounded-xl bg-black border border-neutral-800 space-y-1.5">
        <label className="text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider flex items-center space-x-1.5">
          <Tag className="w-3 h-3 text-neutral-400" />
          <span>Product Monitor Name</span>
        </label>
        <input
          type="text"
          value={monitorName}
          onChange={(e) => setMonitorName(e.target.value)}
          placeholder="e.g. Fujifilm X-H2S Mirrorless"
          disabled={isLoading || isCreatingMonitor}
          className="w-full bg-transparent px-2 py-1 text-xs font-bold text-white placeholder-neutral-600 focus:outline-none font-sans"
        />
      </div>

      {/* Ingestion URL Form */}
      <form onSubmit={handleRunCompare} className="space-y-4">
        <div className="space-y-3">
          {urls.map((url, index) => {
            const detected = DETECT_SOURCE(url);

            return (
              <div
                key={index}
                className="group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-black border border-neutral-800 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500 transition shadow-inner"
              >
                {/* Index Pill & Detected Source Badge */}
                <div className="flex items-center space-x-2 px-2 shrink-0">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[11px] font-mono font-bold text-neutral-400">
                    {index + 1}
                  </span>

                  {detected ? (
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${detected.badge}`}
                    >
                      <span className="truncate">{detected.name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800">
                      <Globe className="w-3 h-3 text-neutral-500" />
                      <span>URL #{index + 1}</span>
                    </span>
                  )}
                </div>

                {/* Input Text Box */}
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder={`https://domain.com/product-url-${index + 1}`}
                  disabled={isLoading || isCreatingMonitor}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none font-mono selection:bg-white selection:text-black"
                />

                {/* Remove URL Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  disabled={urls.length <= 2 || isLoading || isCreatingMonitor}
                  title={urls.length <= 2 ? 'At least 2 URLs are required' : 'Remove URL'}
                  className="self-end sm:self-center p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-700 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-500 transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Controls & Submission Deck */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={urls.length >= 6 || isLoading || isCreatingMonitor}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add URL Field</span>
            </button>

            <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
              ({urls.filter((u) => u.trim()).length} targets active)
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Run Compare button */}
            <button
              type="button"
              onClick={handleRunCompare}
              disabled={isLoading || isCreatingMonitor || urls.filter((u) => u.trim()).length < 2}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white shadow-sm disabled:opacity-40 transition"
            >
              {isLoading ? (
                <span>Comparing...</span>
              ) : (
                <>
                  <span>Run Comparison</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Start Monitoring button */}
            <button
              type="button"
              onClick={handleStartMonitoring}
              disabled={isLoading || isCreatingMonitor || urls.filter((u) => u.trim()).length < 2}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider text-black shadow-lg disabled:opacity-40 transition active:scale-[0.99]"
            >
              {isCreatingMonitor ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Creating Monitor...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Start Monitoring</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* In-Progress Telemetry Status */}
        {(isLoading || isCreatingMonitor) && (
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Parallel DCA Collectors Active: Amazon · Kamal Imaging · Fujifilm X India</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">Polling async datasets (~15-30s)...</span>
          </div>
        )}

        {/* Error Notification */}
        {(inputError || error) && (
          <div className="p-3.5 bg-neutral-900 border border-neutral-700 rounded-xl flex items-start space-x-2.5 text-xs text-neutral-300">
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">Ingestion Warning</span>
              <span>{inputError || error}</span>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
