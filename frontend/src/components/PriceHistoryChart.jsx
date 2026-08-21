import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { History, TrendingUp } from 'lucide-react';

export default function PriceHistoryChart({ priceHistory = [], currency = 'INR' }) {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="bw-panel rounded-2xl p-6 flex flex-col items-center justify-center py-10 text-neutral-500 font-mono text-xs">
        <History className="w-6 h-6 mb-2 text-neutral-600" />
        <p>No historical price snapshots recorded yet</p>
      </div>
    );
  }

  // Format data points for Recharts
  const chartData = priceHistory.map((item, idx) => {
    const dateObj = new Date(item.timestamp || Date.now());
    const formattedTime = `${dateObj.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })} ${dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    return {
      name: `Snapshot ${idx + 1}`,
      time: formattedTime,
      price: item.price,
    };
  });

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Compute dynamic data-adaptive Y-axis domain
  const yDomain = useMemo(() => {
    const prices = chartData.map((d) => d.price).filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);
    if (prices.length === 0) return ['auto', 'auto'];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const spread = max - min;
    const step = min > 50000 ? 1000 : min > 5000 ? 500 : 100;
    const buffer = spread > 0 ? Math.max(spread * 0.25, min * 0.02) : Math.max(min * 0.05, 1000);

    const yMin = Math.max(0, Math.floor((min - buffer) / step) * step);
    const yMax = Math.ceil((max + buffer) / step) * step;
    return [yMin, yMax];
  }, [chartData]);

  const formatYTick = (val) => {
    if (val === undefined || val === null) return '';
    if (val >= 1000) {
      const inK = val / 1000;
      return Number.isInteger(inK) ? `${currencySymbol}${inK}k` : `${currencySymbol}${inK.toFixed(1)}k`;
    }
    return `${currencySymbol}${val}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black border border-neutral-700 rounded-xl p-3 shadow-2xl text-xs font-mono">
          <p className="text-neutral-500 mb-1 text-[10px]">{data.time}</p>
          <p className="text-sm font-black text-white">
            {currencySymbol}{data.price?.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bw-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-white" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Price History Trajectory
          </h3>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">
          {priceHistory.length} Snapshot Point{priceHistory.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
            <Line
              type="monotone"
              dataKey="price"
              stroke="#ffffff"
              strokeWidth={2.5}
              dot={{ fill: '#ffffff', stroke: '#000000', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
