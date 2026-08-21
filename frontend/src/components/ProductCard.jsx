import React from 'react';
import { Tag, Star, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function ProductCard({ product }) {
  if (!product) return null;

  const {
    source,
    productTitle,
    brand,
    currentPrice,
    originalPrice,
    discount,
    rating,
    reviewCount,
    availability,
    productUrl,
    image,
    sku,
    currency,
  } = product;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return null;
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bw-panel rounded-2xl p-6 flex flex-col justify-between space-y-5">
      <div>
        {/* Brand & Source Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            {source && (
              <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded bg-neutral-900 text-white border border-neutral-800">
                {source}
              </span>
            )}
            {brand && (
              <span className="text-[11px] font-mono text-neutral-400">
                {brand}
              </span>
            )}
          </div>

          {availability && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              {availability}
            </span>
          )}
        </div>

        {/* Thumbnail & Title */}
        <div className="flex space-x-4 mb-4">
          {image && (
            <div className="w-16 h-16 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
              <img src={image} alt={productTitle} className="w-full h-full object-contain p-1" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
              {productTitle || 'Tracked Competitor Product'}
            </h3>
            {sku && (
              <span className="text-[10px] font-mono text-neutral-500 block mt-1">
                SKU: {sku}
              </span>
            )}
          </div>
        </div>

        {/* Pricing Summary Console in B&W */}
        <div className="flex items-baseline gap-3 bg-black p-4 rounded-xl border border-neutral-800">
          <span className="text-3xl font-black font-mono text-white tracking-tight">
            {formatCurrency(currentPrice) || 'N/A'}
          </span>

          {originalPrice && originalPrice > currentPrice && (
            <span className="text-sm font-mono text-neutral-500 line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}

          {discount && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
              <Tag className="w-3 h-3" />
              {discount}
            </span>
          )}
        </div>

        {/* Ratings & Reviews */}
        {(rating !== null && rating !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-neutral-300 mt-3">
            <div className="flex items-center gap-1 bg-neutral-900 text-white px-2 py-0.5 rounded border border-neutral-800 font-mono font-bold">
              <Star className="w-3 h-3 fill-white" />
              <span>{rating} / 5</span>
            </div>

            {reviewCount !== null && reviewCount !== undefined && (
              <span className="text-neutral-500 font-mono text-[11px]">
                ({reviewCount.toLocaleString()} verified reviews)
              </span>
            )}
          </div>
        )}
      </div>

      {/* External Link */}
      {productUrl && (
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[200px]">
            {productUrl}
          </span>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-neutral-400 transition-colors"
          >
            <span>Open Target URL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
