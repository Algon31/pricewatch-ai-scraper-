import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScrapeForm from './components/ScrapeForm';
import ScraperHealth from './components/ScraperHealth';
import ProductCard from './components/ProductCard';
import PriceChangeCard from './components/PriceChangeCard';
import PriceHistoryChart from './components/PriceHistoryChart';
import ProductList from './components/ProductList';
import { scrapeProduct, getProducts, getProductById } from './api/config';
import { Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [lastVerified, setLastVerified] = useState(new Date().toISOString());

  // Fetch initial tracked products on mount
  useEffect(() => {
    fetchProductList();
  }, []);

  const fetchProductList = async () => {
    setLoadingProducts(true);
    try {
      const data = await getProducts();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
        // If items exist, get latest updatedAt for lastVerified
        if (data.data.length > 0) {
          const latestTime = data.data.reduce((latest, item) => {
            const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
            return itemTime > latest ? itemTime : latest;
          }, 0);
          if (latestTime > 0) {
            setLastVerified(new Date(latestTime).toISOString());
          }
        }
        // If no product is currently selected and items exist, select the first one
        if (!selectedProduct && data.data.length > 0) {
          handleSelectProduct(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleScrape = async (url) => {
    setLoadingScrape(true);
    setError('');

    try {
      const res = await scrapeProduct(url);
      if (res.success) {
        setSelectedProduct(res.product);
        setPriceChange(res.priceChange || null);
        setLastVerified(new Date().toISOString());

        // Refresh product list and update selection
        const listData = await getProducts();
        if (listData.success && Array.isArray(listData.data)) {
          setProducts(listData.data);
        }
      } else {
        setError(res.message || 'Failed to scrape product.');
      }
    } catch (err) {
      console.error('Scrape error:', err);
      const apiMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'An error occurred while triggering the scraper.';
      setError(apiMsg);
    } finally {
      setLoadingScrape(false);
    }
  };

  const handleSelectProduct = async (id) => {
    try {
      const res = await getProductById(id);
      if (res.success && res.data) {
        setSelectedProduct(res.data);
        // Reset or clear transient priceChange banner if switching manually
        setPriceChange(null);
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Scrape Form Section */}
        <ScrapeForm
          onScrape={handleScrape}
          loading={loadingScrape}
          error={error}
        />

        {/* Scraper Health & Self-Healing Section */}
        <ScraperHealth lastVerified={lastVerified} />

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left / Main Details (2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Price Change Analytics Banner */}
            {priceChange && <PriceChangeCard priceChange={priceChange} />}

            {/* Selected Product Card */}
            {selectedProduct ? (
              <ProductCard product={selectedProduct} />
            ) : (
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-400">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                <h3 className="text-base font-semibold text-slate-200">No Product Selected</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Submit an Amazon link above or choose a tracked product from the sidebar list.
                </p>
              </div>
            )}

            {/* Price History Line Chart */}
            {selectedProduct && (
              <PriceHistoryChart
                priceHistory={selectedProduct.priceHistory}
                currency={selectedProduct.currency}
              />
            )}
          </div>

          {/* Right Sidebar: Tracked Products List (1 col) */}
          <div className="lg:col-span-1">
            <ProductList
              products={products}
              selectedProductId={selectedProduct?._id}
              onSelectProduct={handleSelectProduct}
              onRefresh={fetchProductList}
              loading={loadingProducts}
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        PriceWatch AI &copy; {new Date().getFullYear()} — Powered by Bright Data DCA &amp; MongoDB
      </footer>
    </div>
  );
}
