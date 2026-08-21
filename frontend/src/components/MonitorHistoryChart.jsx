import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Clock, History, ZoomIn, Maximize2, Minimize2 } from 'lucide-react';

const SOURCE_COLORS = {
  'Amazon': { stroke: '#E2E8F0', dot: '#FFFFFF' },
  'Kamal Imaging': { stroke: '#06B6D4', dot: '#22D3EE' },
  'Fujifilm X India': { stroke: '#A855F7', dot: '#C084FC' },
};

export default function MonitorHistoryChart({ priceHistory = {} }) {
  // Zoom mode: 'focus' (auto-zoomed to data range), 'tight' (max zoom), 'full' (0 to max)
  const [zoomMode, setZoomMode] = useState('focus');

  const sources = Object.keys(priceHistory);

  if (sources.length === 0) {
    return (
      <div className="bw-panel rounded-2xl p-6 flex flex-col items-center justify-center py-10 text-neutral-500 font-mono text-xs">
        <History className="w-6 h-6 mb-2 text-neutral-600" />
        <p>No historical price snapshots recorded yet</p>
      </div>
    );
  }

  // 1. Gather all unique timestamps across all sources into a sorted list
  const timestampSet = new Set();
  sources.forEach((src) => {
    (priceHistory[src] || []).forEach((snap) => {
      if (snap.timestamp) {
        timestampSet.add(snap.timestamp);
      }
    });
  });

  const sortedTimestamps = Array.from(timestampSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (sortedTimestamps.length === 0) {
    return (
      <div className="bw-panel rounded-2xl p-6 flex flex-col items-center justify-center py-10 text-neutral-500 font-mono text-xs">
        <History className="w-6 h-6 mb-2 text-neutral-600" />
        <p>No timestamped price records available</p>
      </div>
    );
  }

  // 2. Build multi-line chart data records for each timestamp
  const chartData = sortedTimestamps.map((t, idx) => {
    const d = new Date(t);
    const formattedTime = `${d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })} ${d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const record = {
      name: `Snapshot ${idx + 1}`,
      rawTime: t,
      time: formattedTime,
    };

    sources.forEach((src) => {
      const snap = (priceHistory[src] || []).find((s) => s.timestamp === t);
      if (snap && typeof snap.price === 'number') {
        record[src] = snap.price;
      }
    });

    return record;
  });

  // 3. Compute dynamic data-driven Y-axis domain bounds (Auto-Zoom)
  const { yDomain, minVal, maxVal, spread } = useMemo(() => {
    const allPrices = [];
    chartData.forEach((item) => {
      sources.forEach((src) => {
        if (typeof item[src] === 'number' && !isNaN(item[src]) && item[src] > 0) {
          allPrices.push(item[src]);
        }
      });
    });

    if (allPrices.length === 0) {
      return { yDomain: ['auto', 'auto'], minVal: 0, maxVal: 0, spread: 0 };
    }

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const priceSpread = max - min;

    // Step rounding based on scale
    const step = min > 50000 ? 1000 : min > 5000 ? 500 : 100;

    // Adaptive buffer:
    // If range is small (e.g. 5k on a 195k camera), buffer by 25% of spread (or 2% of price)
    // so lines fill ~75-80% of vertical height and micro price changes are clearly visible.
    const buffer = priceSpread > 0
      ? Math.max(priceSpread * 0.25, min * 0.02)
      : Math.max(min * 0.05, 1000);

    const focusedMin = Math.max(0, Math.floor((min - buffer) / step) * step);
    const focusedMax = Math.ceil((max + buffer) / step) * step;

    const tightMin = Math.max(0, Math.floor((min - step * 0.5) / step) * step);
    const tightMax = Math.ceil((max + step * 0.5) / step) * step;

    let computedDomain;
    if (zoomMode === 'tight') {
      computedDomain = [tightMin, tightMax];
    } else if (zoomMode === 'full') {
      computedDomain = [0, focusedMax];
    } else {
      // 'focus' (default data-adaptive zoom)
      computedDomain = [focusedMin, focusedMax];
    }

    return {
      yDomain: computedDomain,
      minVal: min,
      maxVal: max,
      spread: priceSpread,
    };
  }, [chartData, sources, zoomMode]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatYTick = (val) => {
    if (val === undefined || val === null) return '';
    if (val >= 100000) {
      const inK = val / 1000;
      return Number.isInteger(inK) ? `₹${inK}k` : `₹${inK.toFixed(1)}k`;
    }
    if (val >= 1000) {
      const inK = val / 1000;
      return Number.isInteger(inK) ? `₹${inK}k` : `₹${inK.toFixed(1)}k`;
    }
    return `₹${val}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const first = payload[0].payload;
      return (
        <div className="bg-black border border-neutral-700 rounded-xl p-4 shadow-2xl text-xs font-mono space-y-2 min-w-[220px]">
          <div className="border-b border-neutral-800 pb-1.5 flex items-center justify-between text-neutral-400 text-[10px]">
            <span>{first.time}</span>
            <span className="text-neutral-500">{first.name}</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {payload.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: entry.stroke || entry.color }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-bold text-white font-mono">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bw-panel rounded-2xl p-6 space-y-4">
      {/* Header & Dynamic Auto-Zoom Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-white" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Multi-Source Price History Trajectory
          </h3>
        </div>

        {/* Zoom Controls & Domain Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
            Scale: {formatYTick(yDomain[0])} – {formatYTick(yDomain[1])}
          </span>

          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setZoomMode('focus')}
              title="Adaptive zoom focused on price range"
              className={`px-2 py-0.5 rounded transition ${
                zoomMode === 'focus'
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auto Zoom
            </button>

            <button
              type="button"
              onClick={() => setZoomMode('tight')}
              title="Tightest zoom on data variation"
              className={`px-2 py-0.5 rounded transition ${
                zoomMode === 'tight'
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tight
            </button>

            <button
              type="button"
              onClick={() => setZoomMode('full')}
              title="Full scale from 0 to max price"
              className={`px-2 py-0.5 rounded transition ${
                zoomMode === 'full'
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              0-Baseline
            </button>
          </div>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#a3a3a3"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#404040' }}
            />
            <YAxis
              domain={yDomain}
              stroke="#a3a3a3"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
            />
            {sources.map((src) => {
              const theme = SOURCE_COLORS[src] || { stroke: '#10B981', dot: '#34D399' };
              return (
                <Line
                  key={src}
                  type="monotone"
                  dataKey={src}
                  name={src}
                  stroke={theme.stroke}
                  strokeWidth={2.5}
                  dot={{ fill: theme.stroke, stroke: '#000000', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: theme.dot, stroke: '#000000', strokeWidth: 2 }}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
