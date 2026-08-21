import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Table } from 'lucide-react';

export default function PriceComparisonChart({ products, lowestPrice, cheapestSource }) {
  const [activeView, setActiveView] = useState('chart');

  if (!products || products.length === 0) return null;

  const validProducts = products.filter(
    (p) => typeof p.currentPrice === 'number' && !isNaN(p.currentPrice) && p.currentPrice > 0
  );

  if (validProducts.length === 0) return null;

  const chartData = validProducts.map((p) => {
    const isCheapest = p.source === cheapestSource || (lowestPrice && p.currentPrice === lowestPrice);
    const differenceFromLowest = lowestPrice ? p.currentPrice - lowestPrice : 0;

    return {
      name: p.source,
      price: p.currentPrice,
      originalPrice: p.originalPrice,
      isCheapest,
      differenceFromLowest,
      availability: p.availability || 'Available',
      sku: p.sku || 'N/A',
      productUrl: p.productUrl,
    };
  });

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-black border border-neutral-700 rounded-xl p-4 shadow-2xl text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-bold text-white text-sm">{item.name}</span>
            {item.isCheapest && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                Cheapest Offer
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-neutral-400">Current Price:</span>
            <span className={`font-black font-mono text-base ${item.isCheapest ? 'text-emerald-400' : 'text-white'}`}>
              {formatCurrency(item.price)}
            </span>
          </div>

          {!item.isCheapest && item.differenceFromLowest > 0 && (
            <div className="flex items-center justify-between text-neutral-400 text-[11px]">
              <span>Spread vs Lowest:</span>
              <span className="font-mono font-bold text-rose-400">+{formatCurrency(item.differenceFromLowest)}</span>
            </div>
          )}

          <div className="text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800">
            <span>Status: {item.availability}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bw-panel rounded-2xl p-6 sm:p-7 space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <BarChart3 className="w-5 h-5 text-white" />
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cross-Market Pricing Terminal
            </h2>
            <p className="text-xs text-neutral-400">
              Comparative visualization and normalized telemetry across competitor endpoints
            </p>
          </div>
        </div>

        {/* View Switcher Tabs in B&W */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveView('chart')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'chart'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Price Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('table')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'table'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Data Matrix</span>
          </button>
        </div>
      </div>

      {/* Chart View with Emerald Green for Lowest Price Bar */}
      {activeView === 'chart' && (
        <div className="space-y-6">
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} opacity={0.6} />
                <XAxis
                  dataKey="name"
                  stroke="#a3a3a3"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#404040' }}
                />
                <YAxis
                  stroke="#a3a3a3"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar dataKey="price" radius={[4, 4, 0, 0]} maxBarSize={68}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCheapest ? '#10b981' : '#525252'}
                      className="transition-all duration-300 hover:opacity-85"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Delta comparison summary chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  item.isCheapest
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                    : 'bg-black border-neutral-800 text-neutral-300'
                }`}
              >
                <span className="font-bold">{item.name}</span>
                <div className="text-right">
                  <span className={`font-mono font-bold block ${item.isCheapest ? 'text-emerald-400' : 'text-white'}`}>
                    {formatCurrency(item.price)}
                  </span>
                  {item.isCheapest ? (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                      ★ Best Price
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-400 font-medium">
                      +{formatCurrency(item.differenceFromLowest)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Data Matrix View */}
      {activeView === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-black">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Retailer</th>
                <th className="py-3 px-4">Extracted Price</th>
                <th className="py-3 px-4">Original MRP</th>
                <th className="py-3 px-4">Arbitrage Spread</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">SKU / Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {chartData.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-900/50 transition">
                  <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                    <span>{row.name}</span>
                    {row.isCheapest && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        Cheapest
                      </span>
                    )}
                  </td>
                  <td className={`py-3 px-4 font-mono font-bold ${row.isCheapest ? 'text-emerald-400' : 'text-white'}`}>
                    {formatCurrency(row.price)}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-500 line-through">
                    {row.originalPrice ? formatCurrency(row.originalPrice) : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {row.isCheapest ? (
                      <span className="text-emerald-400 font-bold">Baseline (₹0)</span>
                    ) : (
                      <span className="text-neutral-400 font-medium">+{formatCurrency(row.differenceFromLowest)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-neutral-300">
                    {row.availability}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-400">
                    {row.sku}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
