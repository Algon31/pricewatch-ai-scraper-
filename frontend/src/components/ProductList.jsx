import React from 'react';
import { Package, RefreshCw, ChevronRight, Database } from 'lucide-react';

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
    <div className="bw-panel rounded-2xl p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-white" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Archived Snapshots ({products.length})
          </h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition disabled:opacity-50 cursor-pointer"
          title="Refresh products list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 font-mono text-xs">
          <Package className="w-8 h-8 mb-2 text-neutral-600" />
          <p className="text-neutral-300 font-semibold">No archived products</p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Scraped products will automatically appear in this MongoDB catalog.
          </p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
          {products.map((prod) => {
            const isSelected = prod._id === selectedProductId;
            return (
              <div
                key={prod._id}
                onClick={() => onSelectProduct(prod._id)}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer group ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-black border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {prod.source && (
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border block w-fit mb-1 ${
                        isSelected ? 'bg-black text-white border-black' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}>
                        {prod.source}
                      </span>
                    )}
                    <h4 className={`text-xs font-semibold line-clamp-1 transition ${
                      isSelected ? 'text-black' : 'text-neutral-200 group-hover:text-white'
                    }`}>
                      {prod.productTitle || 'Tracked Product'}
                    </h4>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 mt-1 transition-transform ${
                      isSelected ? 'text-black translate-x-0.5' : 'text-neutral-500 group-hover:text-white'
                    }`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs font-mono">
                  <span className={`font-bold ${isSelected ? 'text-black' : 'text-white'}`}>
                    {formatCurrency(prod.currentPrice, prod.currency)}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-neutral-600' : 'text-neutral-500'}`}>
                    {prod.priceHistory ? `${prod.priceHistory.length} record(s)` : ''}
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
