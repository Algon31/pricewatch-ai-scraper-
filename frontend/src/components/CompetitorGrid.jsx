import React from 'react';
import {
  ExternalLink,
  Check,
  ShoppingBag,
  Box,
  Star,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function CompetitorGrid({ products, lowestPrice, cheapestSource }) {
  if (!products || products.length === 0) return null;

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Competitor Storefront Breakdown
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs text-neutral-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Bright Data DCA Feeds</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((item, index) => {
          const isCheapest = item.source === cheapestSource || (lowestPrice && item.currentPrice === lowestPrice);
          const priceSpread = lowestPrice && item.currentPrice ? item.currentPrice - lowestPrice : 0;

          return (
            <div
              key={index}
              className={`rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative group ${
                isCheapest
                  ? 'bw-panel border-2 border-emerald-500/80 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bw-panel hover:border-white/20'
              }`}
            >
              {/* Cheapest Offer Ribbon in Vibrant Emerald Green */}
              {isCheapest && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[11px] font-black uppercase tracking-wider py-1.5 px-4 flex items-center justify-center space-x-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 fill-black stroke-black" />
                  <span>★ Lowest Market Offer</span>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                {/* Header: Retailer Pill & Collector ID */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-neutral-900 border border-neutral-800 text-white">
                    <span className="tracking-tight">{item.source}</span>
                  </div>

                  {item.sku && (
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                      SKU: {item.sku}
                    </span>
                  )}
                </div>

                {/* Product Thumbnail & Title Block */}
                <div className="flex space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative group/img">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productTitle || item.source}
                        className="w-full h-full object-contain p-1.5 group-hover/img:scale-110 transition duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Box className="w-8 h-8 text-neutral-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block truncate">
                        {item.brand}
                      </span>
                    )}
                    <h3
                      className="text-sm font-bold text-neutral-100 line-clamp-2 leading-snug mt-0.5 group-hover:text-white transition"
                      title={item.productTitle}
                    >
                      {item.productTitle || 'Product details extracted'}
                    </h3>
                  </div>
                </div>

                {/* Price Display Console */}
                <div className="p-4 rounded-xl bg-black border border-neutral-800 flex items-baseline justify-between shadow-inner">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500 tracking-wider block">
                      Current Price
                    </span>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className={`text-2xl font-black font-mono tracking-tight ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
                        {formatPrice(item.currentPrice)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.currentPrice && (
                        <span className="text-xs text-neutral-500 line-through font-mono">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.discount ? (
                    <span className="bg-neutral-800 text-white border border-neutral-700 text-xs font-bold px-2 py-0.5 rounded font-mono">
                      {item.discount}
                    </span>
                  ) : isCheapest ? (
                    <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      Best Price
                    </span>
                  ) : priceSpread > 0 ? (
                    <span className="text-[11px] font-mono text-neutral-400">
                      +{formatPrice(priceSpread)}
                    </span>
                  ) : null}
                </div>

                {/* Stock & Rating Micro-Details */}
                <div className="space-y-2 text-xs">
                  {item.availability && (
                    <div className="flex items-center space-x-1.5 text-neutral-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                      <span className="truncate font-medium">{item.availability}</span>
                    </div>
                  )}

                  {item.rating && (
                    <div className="flex items-center space-x-2 text-neutral-400 text-xs">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                        <span className="font-bold text-white font-mono">{item.rating}</span>
                      </div>
                      {item.reviewCount && (
                        <span className="text-neutral-500 font-mono">({item.reviewCount.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Source URL Link */}
              <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[170px]">
                  {item.productUrl}
                </span>

                {item.productUrl && (
                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-white hover:text-emerald-400 transition group/btn"
                  >
                    <span>Open Store</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
