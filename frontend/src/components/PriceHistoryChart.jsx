import React from 'react';
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
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center py-12 text-slate-400">
        <History className="w-8 h-8 mb-2 text-slate-500" />
        <p className="text-sm font-medium">No price history available yet</p>
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
      name: `Scrape ${idx + 1}`,
      time: formattedTime,
      price: item.price,
    };
  });

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
          <p className="text-slate-400 mb-1">{data.time}</p>
          <p className="text-sm font-bold text-emerald-400">
            {currencySymbol}{data.price?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Price History Timeline
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          {priceHistory.length} data point{priceHistory.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(val) => `${currencySymbol}${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#818cf8"
              strokeWidth={3}
              dot={{ fill: '#6366f1', stroke: '#c7d2fe', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
