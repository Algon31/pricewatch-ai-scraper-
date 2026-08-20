import React from 'react';
import { Package, RefreshCw, ChevronRight, Layers } from 'lucide-react';

export default function ProductList({
  products = [],
  selectedProductId,
  onSelectProduct,
  onRefresh,
  loading,
}) {
  const formatCurrency = (val, currency = 'INR') => {
    if (val === null || val === undefined) return 'N/A';
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Tracked Products ({products.length})
          </h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh products list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <Package className="w-10 h-10 mb-2 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">No tracked products yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Submit an Amazon URL above to start price tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
          {products.map((prod) => {
            const isSelected = prod._id === selectedProductId;
            return (
              <div
                key={prod._id}
                onClick={() => onSelectProduct(prod._id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/80 shadow-md'
                    : 'bg-slate-900/60 border-slate-700/50 hover:bg-slate-700/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-slate-200 line-clamp-2 group-hover:text-white transition-colors">
                    {prod.productTitle || 'Amazon Product'}
                  </h4>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform ${
                      isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    {formatCurrency(prod.currentPrice, prod.currency)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {prod.priceHistory ? `${prod.priceHistory.length} history point(s)` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
