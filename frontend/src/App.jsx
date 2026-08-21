import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import MonitorDetailView from './components/MonitorDetailView';
import CompareForm from './components/CompareForm';
import ComparisonSummary from './components/ComparisonSummary';
import CompetitorGrid from './components/CompetitorGrid';
import PriceComparisonChart from './components/PriceComparisonChart';
import ScraperHealth from './components/ScraperHealth';
import {
  getMonitors,
  getMonitorById,
  createMonitor,
  checkMonitor,
  deleteMonitor,
  compareProducts
} from './api/config';
import { Sparkles, PlusCircle, ArrowLeft, GitCompare } from 'lucide-react';

export default function App() {
  // Navigation: 'dashboard' (default), 'compare', 'add-monitor', 'detail'
  const [currentView, setCurrentView] = useState('dashboard');

  // Monitors state
  const [monitors, setMonitors] = useState([]);
  const [recentChangesCount, setRecentChangesCount] = useState(0);
  const [loadingMonitors, setLoadingMonitors] = useState(false);
  const [selectedMonitorId, setSelectedMonitorId] = useState(null);
  const [selectedMonitorData, setSelectedMonitorData] = useState(null);
  const [loadingMonitorDetail, setLoadingMonitorDetail] = useState(false);

  // Monitor Check state
  const [checkingMonitorId, setCheckingMonitorId] = useState(null);
  const [checkResultsMap, setCheckResultsMap] = useState({});
  const [lastCheckResult, setLastCheckResult] = useState(null);

  // One-time Comparison State
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState('');

  // Create Monitor State
  const [isCreatingMonitor, setIsCreatingMonitor] = useState(false);
  const [createMonitorError, setCreateMonitorError] = useState('');

  // Last verified telemetry timestamp
  const [lastVerified, setLastVerified] = useState(new Date().toISOString());

  // Load monitors list on initial mount
  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    setLoadingMonitors(true);
    try {
      const res = await getMonitors();
      if (res.success && Array.isArray(res.monitors)) {
        setMonitors(res.monitors);
        if (typeof res.recentChangesCount === 'number') {
          setRecentChangesCount(res.recentChangesCount);
        }
      }
    } catch (err) {
      console.warn('Could not fetch monitors from backend:', err.message);
    } finally {
      setLoadingMonitors(false);
    }
  };

  const handleSelectMonitor = async (id) => {
    setSelectedMonitorId(id);
    setLoadingMonitorDetail(true);
    setLastCheckResult(null);
    setCurrentView('detail');

    try {
      const res = await getMonitorById(id);
      if (res.success && res.monitor) {
        setSelectedMonitorData(res);
      }
    } catch (err) {
      console.error('Failed to fetch monitor details:', err);
    } finally {
      setLoadingMonitorDetail(false);
    }
  };

  const handleCheckMonitor = async (id) => {
    setCheckingMonitorId(id);
    setLastCheckResult(null);

    try {
      const res = await checkMonitor(id);
      if (res.success) {
        setCheckResultsMap((prev) => ({ ...prev, [id]: res }));
        setLastCheckResult(res);
        setLastVerified(new Date().toISOString());

        // If currently viewing details for this monitor, refresh detail state
        if (selectedMonitorId === id || currentView === 'detail') {
          const updatedDetail = await getMonitorById(id);
          if (updatedDetail.success) {
            setSelectedMonitorData(updatedDetail);
          }
        }

        // Refresh global monitors list
        fetchMonitors();
      }
    } catch (err) {
      console.error('Failed checking monitor:', err);
      const errMsg = err.response?.data?.message || err.message || 'Check failed';
      setCheckResultsMap((prev) => ({
        ...prev,
        [id]: { error: errMsg, changes: [] },
      }));
    } finally {
      setCheckingMonitorId(null);
    }
  };

  const handleDeleteMonitor = async (id) => {
    try {
      const res = await deleteMonitor(id);
      if (res.success) {
        if (selectedMonitorId === id) {
          setSelectedMonitorId(null);
          setSelectedMonitorData(null);
          setCurrentView('dashboard');
        }
        await fetchMonitors();
      }
    } catch (err) {
      console.error('Failed to delete monitor:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete monitor');
    }
  };

  const handleCreateMonitor = async (name, urls) => {
    setIsCreatingMonitor(true);
    setCreateMonitorError('');

    try {
      const res = await createMonitor(name, urls);
      if (res.success && res.monitor) {
        setLastVerified(new Date().toISOString());
        await fetchMonitors();
        // Immediately view the newly created monitor
        handleSelectMonitor(res.monitor._id);
      } else {
        setCreateMonitorError(res.message || 'Failed to create monitor.');
      }
    } catch (err) {
      console.error('Create monitor error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create monitor.';
      setCreateMonitorError(msg);
    } finally {
      setIsCreatingMonitor(false);
    }
  };

  const handleOneTimeCompare = async (urls) => {
    setLoadingCompare(true);
    setCompareError('');

    try {
      const res = await compareProducts(urls);
      if (res.success && Array.isArray(res.products)) {
        setComparisonData(res);
        setLastVerified(new Date().toISOString());
      } else {
        setCompareError(res.message || 'Failed to compare competitor products.');
      }
    } catch (err) {
      console.error('Comparison error:', err);
      const msg = err.response?.data?.message || err.message || 'Comparison failed.';
      setCompareError(msg);
    } finally {
      setLoadingCompare(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans bg-grid-minimal selection:bg-white selection:text-black">
      {/* Top Header & Navigation */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'dashboard') {
            fetchMonitors();
          }
        }}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* VIEW 1: Dashboard (Default) */}
        {currentView === 'dashboard' && (
          <DashboardView
            monitors={monitors}
            recentChangesCount={recentChangesCount}
            loading={loadingMonitors}
            onRefresh={fetchMonitors}
            onSelectMonitor={handleSelectMonitor}
            onCheckMonitor={handleCheckMonitor}
            onDeleteMonitor={handleDeleteMonitor}
            onNavigateToAdd={() => setCurrentView('add-monitor')}
            checkingMonitorId={checkingMonitorId}
            checkResultsMap={checkResultsMap}
          />
        )}

        {/* VIEW 2: Monitor Detail Page */}
        {currentView === 'detail' && (
          <MonitorDetailView
            monitorData={selectedMonitorData}
            onBack={() => {
              setCurrentView('dashboard');
              fetchMonitors();
            }}
            onCheckMonitor={handleCheckMonitor}
            onDeleteMonitor={handleDeleteMonitor}
            isChecking={checkingMonitorId === selectedMonitorId}
            lastCheckResult={lastCheckResult}
          />
        )}

        {/* VIEW 3: Add Monitor Deck */}
        {currentView === 'add-monitor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-6 h-6 text-white" />
                  <span>Add Competitor Monitor</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Set up recurring multi-source tracking, automated historical snapshots, and price delta alerts
                </p>
              </div>

              <button
                onClick={() => setCurrentView('dashboard')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 border border-neutral-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            <CompareForm
              mode="add-monitor"
              onCompare={handleOneTimeCompare}
              onCreateMonitor={handleCreateMonitor}
              isLoading={loadingCompare}
              isCreatingMonitor={isCreatingMonitor}
              error={createMonitorError || compareError}
            />
          </div>
        )}

        {/* VIEW 4: Compare Products (One-Time Scrape Deck) */}
        {currentView === 'compare' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-white" />
                  <span>Instant Competitor Comparison</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Run ad-hoc competitor scrapes and optionally save as a continuous monitor
                </p>
              </div>

              <button
                onClick={() => setCurrentView('dashboard')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 border border-neutral-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Ingestion & Comparison Form */}
            <CompareForm
              mode="compare"
              onCompare={handleOneTimeCompare}
              onCreateMonitor={handleCreateMonitor}
              isLoading={loadingCompare}
              isCreatingMonitor={isCreatingMonitor}
              error={compareError}
            />

            {/* Comparison Results */}
            {comparisonData && (
              <div className="space-y-8 animate-fadeIn">
                {/* Executive Summary */}
                <ComparisonSummary data={comparisonData} />

                {/* Storefront Breakdown */}
                <CompetitorGrid
                  products={comparisonData.products}
                  lowestPrice={comparisonData.lowestPrice}
                  cheapestSource={comparisonData.cheapestSource}
                />

                {/* Price Chart & Data Matrix */}
                <PriceComparisonChart
                  products={comparisonData.products}
                  lowestPrice={comparisonData.lowestPrice}
                  cheapestSource={comparisonData.cheapestSource}
                />

                {/* Start Monitoring Callout */}
                <div className="bw-panel-highlight rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Track this Product Over Time</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Save this comparison as a live monitor to get automated snapshots and price change alerts.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const detectedName = comparisonData.products[0]?.brand
                        ? `${comparisonData.products[0].brand} Product`
                        : 'Monitored Product';
                      const urls = comparisonData.products.map((p) => p.productUrl).filter(Boolean);
                      handleCreateMonitor(detectedName, urls);
                    }}
                    disabled={isCreatingMonitor}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider shadow-md transition"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>{isCreatingMonitor ? 'Saving Monitor...' : 'Save as Live Monitor'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Scraper Intelligence & Architecture Telemetry */}
        <ScraperHealth lastVerified={lastVerified} />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-black py-6 text-center text-xs text-neutral-500 space-y-1">
        <p className="font-semibold text-neutral-400">
          WebPulse &copy; {new Date().getFullYear()} — Competitor Price Intelligence Powered by Self-Healing Web Scrapers
        </p>
        <p className="text-[11px] text-neutral-600 font-mono">
          Powered by Bright Data Scraper Studio, Express, MongoDB &amp; React
        </p>
      </footer>
    </div>
  );
}
