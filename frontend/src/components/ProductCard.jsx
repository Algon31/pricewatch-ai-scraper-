import React from 'react';
import { Tag, Star, ShoppingCart, ExternalLink, Building2, CheckCircle2 } from 'lucide-react';

export default function ProductCard({ product }) {
  if (!product) return null;

  const {
    productTitle,
    brand,
    currentPrice,
    originalPrice,
    discount,
    rating,
    reviewCount,
    availability,
    productUrl,
    currency,
  } = product;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return null;
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Brand & Availability Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {brand ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              <Building2 className="w-3.5 h-3.5" />
              {brand}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Tracked Product</span>
          )}

          {availability && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {availability}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-base font-semibold text-white leading-snug line-clamp-3 mb-4">
          {productTitle || 'Amazon Product'}
        </h3>

        {/* Pricing Summary */}
        <div className="flex items-baseline gap-3 mb-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
          <span className="text-3xl font-extrabold text-white">
            {formatCurrency(currentPrice) || 'N/A'}
          </span>

          {originalPrice && originalPrice > currentPrice && (
            <span className="text-base font-medium text-slate-400 line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}

          {discount && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <Tag className="w-3 h-3" />
              {discount}
            </span>
          )}
        </div>

        {/* Ratings & Reviews */}
        <div className="flex items-center gap-4 text-xs text-slate-300">
          {rating !== null && rating !== undefined && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/20 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{rating} / 5</span>
            </div>
          )}

          {reviewCount !== null && reviewCount !== undefined && (
            <span className="text-slate-400">
              ({reviewCount.toLocaleString()} reviews)
            </span>
          )}
        </div>
      </div>

      {/* External Link */}
      {productUrl && (
        <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Source</span>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View on Amazon</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
