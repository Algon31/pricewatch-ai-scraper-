const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Product = require('./models/Product');
const ProductMonitor = require('./models/ProductMonitor');
const PriceSnapshot = require('./models/PriceSnapshot');
const ChangeEvent = require('./models/ChangeEvent');

const app = express();
const PORT = process.env.PORT || 5000;

// Reliability & Extraction Validation Configuration
const MAX_SCRAPE_ATTEMPTS = parseInt(process.env.MAX_SCRAPE_ATTEMPTS, 10) || 2;
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS, 10) || 1500;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Extraction Validation Layer: Validate normalized scraped product data.
 *
 * Required Minimum Fields:
 * - source: non-empty string and not 'Unknown'
 * - productTitle: non-empty string
 * - productUrl: non-empty string
 * - currentPrice: valid positive number (> 0)
 *
 * Optional Fields:
 * - originalPrice, image, sku, rating, reviewCount, availability, discount, currency
 *
 * @param {Object} product - The normalized product object to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
function validateScrapedProduct(product) {
  if (!product || typeof product !== 'object') {
    return {
      isValid: false,
      error: 'Product data is missing or not an object',
    };
  }

  if (!product.source || typeof product.source !== 'string' || !product.source.trim() || product.source.trim().toLowerCase() === 'unknown') {
    return {
      isValid: false,
      error: 'Missing or invalid "source" field',
    };
  }

  if (!product.productTitle || typeof product.productTitle !== 'string' || !product.productTitle.trim()) {
    return {
      isValid: false,
      error: 'Missing or empty "productTitle"',
    };
  }

  if (!product.productUrl || typeof product.productUrl !== 'string' || !product.productUrl.trim()) {
    return {
      isValid: false,
      error: 'Missing or empty "productUrl"',
    };
  }

  if (
    product.currentPrice === null ||
    product.currentPrice === undefined ||
    typeof product.currentPrice !== 'number' ||
    isNaN(product.currentPrice) ||
    product.currentPrice <= 0
  ) {
    return {
      isValid: false,
      error: `Invalid currentPrice (${product.currentPrice}): must be a positive number greater than 0`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Safely create and persist a PriceSnapshot ONLY if data is strictly valid
 * Prevents bad, NaN, or null data from corrupting history
 */
async function createValidPriceSnapshot({ monitorId, source, url, price, originalPrice, currency, availability, timestamp }) {
  if (!monitorId) {
    console.warn(`[SNAPSHOT PREVENTED] Missing monitorId`);
    return null;
  }
  if (!source || typeof source !== 'string' || !source.trim() || source.trim().toLowerCase() === 'unknown') {
    console.warn(`[SNAPSHOT PREVENTED] Missing or invalid source for monitorId ${monitorId}`);
    return null;
  }
  if (!url || typeof url !== 'string' || !url.trim()) {
    console.warn(`[SNAPSHOT PREVENTED] Missing or invalid url for ${source}`);
    return null;
  }
  if (price === null || price === undefined || typeof price !== 'number' || isNaN(price) || price <= 0) {
    console.warn(`[SNAPSHOT PREVENTED] Invalid price (${price}) for ${source} - snapshot will not be saved`);
    return null;
  }

  try {
    const snapshot = new PriceSnapshot({
      monitorId,
      source: source.trim(),
      url: url.trim(),
      price,
      originalPrice: (typeof originalPrice === 'number' && !isNaN(originalPrice) && originalPrice > 0) ? originalPrice : null,
      currency: currency || 'INR',
      availability: availability || '',
      timestamp: timestamp || new Date(),
    });
    return await snapshot.save();
  } catch (err) {
    console.warn(`[SNAPSHOT ERROR] Failed to save snapshot for ${source}:`, err.message);
    return null;
  }
}

/**
 * Persist valid scraped product to MongoDB Product catalog
 */
async function persistValidProductCatalogItem(normalized, source) {
  if (mongoose.connection.readyState !== 1 || !normalized.productUrl) return;

  try {
    let product = await Product.findOne({ productUrl: normalized.productUrl });

    if (!product) {
      const initialPriceHistory = [];
      if (typeof normalized.currentPrice === 'number' && normalized.currentPrice > 0) {
        initialPriceHistory.push({
          price: normalized.currentPrice,
          currency: normalized.currency || 'INR',
          timestamp: new Date(),
        });
      }

      product = new Product({
        ...normalized,
        priceHistory: initialPriceHistory,
      });

      await product.save();
      console.log(`[DATABASE] Created new product entry (${source}): "${normalized.productTitle}"`);
    } else {
      const previousPrice = product.currentPrice;
      const priceChanged = previousPrice !== normalized.currentPrice;

      if (typeof normalized.currentPrice === 'number' && normalized.currentPrice > 0 && (priceChanged || product.priceHistory.length === 0)) {
        product.priceHistory.push({
          price: normalized.currentPrice,
          currency: normalized.currency || 'INR',
          timestamp: new Date(),
        });
      }

      // Update fields
      product.source = normalized.source;
      if (normalized.productTitle) product.productTitle = normalized.productTitle;
      if (normalized.brand) product.brand = normalized.brand;
      product.currentPrice = normalized.currentPrice;
      product.currency = normalized.currency || 'INR';
      if (normalized.originalPrice !== null) product.originalPrice = normalized.originalPrice;
      if (normalized.discount) product.discount = normalized.discount;
      if (normalized.rating !== null) product.rating = normalized.rating;
      if (normalized.reviewCount !== null) product.reviewCount = normalized.reviewCount;
      if (normalized.availability) product.availability = normalized.availability;
      if (normalized.image) product.image = normalized.image;
      if (normalized.sku) product.sku = normalized.sku;

      await product.save();
      console.log(`[DATABASE] Updated product (${source}): "${normalized.productTitle}"`);
    }
  } catch (dbErr) {
    console.warn(`[DATABASE WARNING] Failed to persist ${source} product: ${dbErr.message}`);
  }
}

/**
 * Connect to MongoDB using environment configuration
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[DATABASE CONFIG ERROR] MONGODB_URI is not set in environment variables');
    return;
  }
  try {
    await mongoose.connect(mongoUri);
    console.log('[DATABASE] Successfully connected to MongoDB');
  } catch (err) {
    console.error('[DATABASE ERROR] Failed to connect to MongoDB:', err.message);
  }
};

/**
 * Helper to safely extract numeric price values from various formats
 */
function extractPrice(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'object' && val !== null) {
    if (typeof val.value === 'number') return isNaN(val.value) ? null : val.value;
    if (typeof val.value === 'string') {
      const cleaned = parseFloat(val.value.replace(/[^0-9.]/g, ''));
      return isNaN(cleaned) ? null : cleaned;
    }
    if (typeof val.amount === 'number') return isNaN(val.amount) ? null : val.amount;
    if (typeof val.price === 'number') return isNaN(val.price) ? null : val.price;
  }
  if (typeof val === 'string') {
    const cleaned = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(cleaned) ? null : cleaned;
  }
  return null;
}

/**
 * Helper to extract currency code/string
 */
function extractCurrency(rawItem) {
  if (rawItem && rawItem.current_price && typeof rawItem.current_price.currency === 'string' && rawItem.current_price.currency.trim()) {
    return rawItem.current_price.currency.trim();
  }
  if (rawItem && typeof rawItem.currency === 'string' && rawItem.currency.trim()) {
    return rawItem.currency.trim();
  }
  return 'INR';
}

/**
 * Helper function to calculate price change metrics for a single product
 */
function calculatePriceChange(previousPrice, currentPrice) {
  if (
    previousPrice === null ||
    previousPrice === undefined ||
    typeof previousPrice !== 'number' ||
    isNaN(previousPrice)
  ) {
    return {
      previousPrice: null,
      currentPrice: currentPrice,
      difference: null,
      percentageChange: null,
      direction: 'initial',
    };
  }

  if (
    currentPrice === null ||
    currentPrice === undefined ||
    typeof currentPrice !== 'number' ||
    isNaN(currentPrice)
  ) {
    return {
      previousPrice: previousPrice,
      currentPrice: null,
      difference: null,
      percentageChange: null,
      direction: 'unchanged',
    };
  }

  const difference = Number((currentPrice - previousPrice).toFixed(2));
  const rawPercentage = previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  const percentageChange = Number(rawPercentage.toFixed(2));

  let direction = 'unchanged';
  if (difference < 0) {
    direction = 'decreased';
  } else if (difference > 0) {
    direction = 'increased';
  }

  return {
    previousPrice,
    currentPrice,
    difference,
    percentageChange,
    direction,
  };
}

/**
 * Detect domain and resolve corresponding Bright Data Collector ID
 */
function getCollectorForUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { error: 'Invalid URL format' };
  }

  let hostname = '';
  try {
    const parsed = new URL(urlStr.trim());
    hostname = parsed.hostname.toLowerCase();
  } catch {
    try {
      const parsed = new URL('https://' + urlStr.trim());
      hostname = parsed.hostname.toLowerCase();
    } catch {
      return { error: `Invalid URL format: "${urlStr}"` };
    }
  }

  // 1. Amazon (amazon.in, amzn.in, amazon.com)
  if (hostname.includes('amazon.') || hostname.includes('amzn.')) {
    const collectorId = process.env.BRIGHT_DATA_AMAZON_COLLECTOR_ID || process.env.BRIGHT_DATA_COLLECTOR_ID || 'c_mt0gyz9d11g1yi8p98';
    return {
      source: 'Amazon',
      collectorId,
      domain: hostname,
    };
  }

  // 2. Kamal Imaging (kamalimaging.com)
  if (hostname.includes('kamalimaging.com')) {
    const collectorId = process.env.BRIGHT_DATA_KAMAL_COLLECTOR_ID || 'c_mt1bz3s5tdc173nng';
    return {
      source: 'Kamal Imaging',
      collectorId,
      domain: hostname,
    };
  }

  // 3. Fujifilm X India (fujifilmxindia.com)
  if (hostname.includes('fujifilmxindia.com')) {
    const collectorId = process.env.BRIGHT_DATA_FUJIFILM_COLLECTOR_ID || 'c_mt1cchzkfvyuvi8tm';
    return {
      source: 'Fujifilm X India',
      collectorId,
      domain: hostname,
    };
  }

  return {
    error: `Unsupported domain "${hostname}". Supported sources: Amazon (amazon.in, amzn.in), Kamal Imaging (kamalimaging.com), and Fujifilm X India (fujifilmxindia.com).`
  };
}

/**
 * Fallback metadata and price extraction from page schema.org/JSON-LD
 */
async function fallbackExtractDetails(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });
    const html = res.data;
    if (typeof html !== 'string') return {};

    let currentPrice = null;
    let originalPrice = null;
    let image = '';
    let availability = '';

    // Check JSON-LD
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        try {
          const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
          const parsed = JSON.parse(content);
          if (parsed.offers && parsed.offers.price) {
            currentPrice = parseFloat(parsed.offers.price);
            if (parsed.offers.availability) {
              availability = parsed.offers.availability.includes('InStock') ? 'In stock' : parsed.offers.availability;
            }
          } else if (parsed.price) {
            currentPrice = parseFloat(parsed.price);
          }
          if (parsed.image && !image) {
            image = Array.isArray(parsed.image) ? parsed.image[0] : parsed.image;
          }
        } catch {
          // ignore
        }
      }
    }

    // Check embedded JSON fields
    if (currentPrice === null) {
      const sellingMatch = html.match(/"selling_price"\s*:\s*([0-9.]+)/i);
      if (sellingMatch && sellingMatch[1]) {
        currentPrice = parseFloat(sellingMatch[1]);
      }
    }

    if (originalPrice === null) {
      const mrpMatch = html.match(/"mrp"\s*:\s*([0-9.]+)/i);
      if (mrpMatch && mrpMatch[1]) {
        originalPrice = parseFloat(mrpMatch[1]);
      }
    }

    if (!image) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      if (ogImageMatch && ogImageMatch[1]) {
        image = ogImageMatch[1];
      }
    }

    return { currentPrice, originalPrice, image, availability };
  } catch (err) {
    console.warn(`[METADATA FALLBACK] Could not fetch extra details for ${url}:`, err.message);
    return {};
  }
}

/**
 * Normalize raw scraped item into common standardized format
 */
function normalizeScrapedProduct(rawItem, sourceName, fallbackUrl) {
  if (!rawItem || typeof rawItem !== 'object') {
    return {
      source: sourceName || 'Unknown',
      productTitle: '',
      brand: '',
      currentPrice: null,
      originalPrice: null,
      availability: '',
      productUrl: fallbackUrl || '',
      image: '',
      sku: '',
    };
  }

  const productTitle = (
    rawItem.product_title ||
    rawItem.title ||
    rawItem.name ||
    rawItem.productTitle ||
    ''
  ).trim();

  let brand = (
    rawItem.brand ||
    rawItem.brand_name ||
    rawItem.manufacturer ||
    ''
  ).trim();

  // Normalize store-prefixed brand strings (e.g. "Visit the Fujifilm Store" -> "Fujifilm")
  if (brand.toLowerCase().startsWith('visit the ')) {
    brand = brand.replace(/^visit the\s+/i, '').replace(/\s+store$/i, '').trim();
  }

  const currentPrice = extractPrice(
    rawItem.current_price ??
    rawItem.selling_price ??
    rawItem.price ??
    rawItem.currentPrice ??
    rawItem.sale_price
  );

  const originalPrice = extractPrice(
    rawItem.original_price ??
    rawItem.initial_price ??
    rawItem.list_price ??
    rawItem.mrp ??
    rawItem.originalPrice
  );

  const availability = (
    rawItem.availability ||
    rawItem.availability_status ||
    rawItem.stock_status ||
    rawItem.in_stock ||
    ''
  ).toString().trim();

  const productUrl = (
    rawItem.product_url ||
    rawItem.url ||
    rawItem.input?.url ||
    rawItem.productUrl ||
    fallbackUrl ||
    ''
  ).trim();

  const image = (
    rawItem.main_image_url ||
    rawItem.image ||
    rawItem.image_url ||
    rawItem.product_image ||
    rawItem.imageUrl ||
    ''
  ).trim();

  const sku = (
    rawItem.sku ||
    rawItem.product_sku ||
    rawItem.item_model_number ||
    rawItem.model_number ||
    ''
  ).toString().trim();

  const currency = extractCurrency(rawItem);
  const discount = rawItem.discount ? String(rawItem.discount).trim() : '';
  const rating = typeof rawItem.rating === 'number' ? rawItem.rating : (parseFloat(rawItem.rating) || null);
  const reviewCount = typeof rawItem.review_count === 'number' ? rawItem.review_count : (parseInt(rawItem.reviews_count || rawItem.review_count || rawItem.reviews, 10) || null);

  return {
    source: sourceName || 'Unknown',
    productTitle,
    brand,
    currentPrice,
    originalPrice,
    currency,
    discount,
    rating,
    reviewCount,
    availability,
    productUrl,
    image,
    sku,
  };
}

/**
 * Calculate multi-source price comparison analytics
 */
function calculateComparisonAnalytics(products) {
  const validPrices = products.filter(
    p => p && typeof p.currentPrice === 'number' && !isNaN(p.currentPrice) && p.currentPrice > 0
  );

  if (validPrices.length === 0) {
    return {
      lowestPrice: null,
      highestPrice: null,
      priceDifference: null,
      cheapestSource: null,
    };
  }

  let lowestItem = validPrices[0];
  let highestItem = validPrices[0];

  for (const item of validPrices) {
    if (item.currentPrice < lowestItem.currentPrice) {
      lowestItem = item;
    }
    if (item.currentPrice > highestItem.currentPrice) {
      highestItem = item;
    }
  }

  const lowestPrice = lowestItem.currentPrice;
  const highestPrice = highestItem.currentPrice;
  const priceDifference = Number((highestPrice - lowestPrice).toFixed(2));
  const cheapestSource = lowestItem.source;

  return {
    lowestPrice,
    highestPrice,
    priceDifference,
    cheapestSource,
  };
}

/**
 * Helper function to sleep/wait for a given number of milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper function to poll Bright Data dataset API until completion or timeout
 */
async function pollBrightDataResults(jobId, apiKey, maxAttempts = 40, intervalMs = 3000) {
  const datasetUrl = `https://api.brightdata.com/dca/dataset?id=${jobId}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[POLL] Attempt ${attempt}/${maxAttempts} for Job ID: ${jobId}`);

    try {
      const response = await axios.get(datasetUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      const data = response.data;

      // Handle object responses that report job status
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const status = (data.status || '').toLowerCase();

        // 1. Explicit failure / error states
        if (['failed', 'error', 'canceled', 'cancelled'].includes(status)) {
          const failureReason = data.error || data.message || `Bright Data reported job failure with status '${data.status}'`;
          console.error(`[POLL ERROR] Job ID ${jobId} failed: ${failureReason}`);
          throw new Error(`Bright Data job failed: ${failureReason}`);
        }

        // 2. Active / In-progress states: continue polling
        const inProgressStatuses = ['collecting', 'building', 'running', 'pending', 'queued', 'starting', 'processing'];
        if (inProgressStatuses.includes(status)) {
          console.log(`[POLL] Job ${jobId} is in progress (status: '${data.status}'${data.message ? `, message: '${data.message}'` : ''}). Waiting ${intervalMs / 1000}s...`);
          await sleep(intervalMs);
          continue;
        }
      }

      // 3. Completed: data retrieved successfully
      console.log(`[POLL SUCCESS] Data successfully retrieved for Job ID: ${jobId}`);
      return data;

    } catch (error) {
      if (error.message && error.message.startsWith('Bright Data job failed:')) {
        throw error;
      }

      // If 202 Accepted, 404 (temporary building state), or 429 (rate limit), log and retry
      if (error.response && (error.response.status === 202 || error.response.status === 404 || error.response.status === 429)) {
        console.log(`[POLL] Received HTTP ${error.response.status} for Job ID: ${jobId}. Retrying in ${intervalMs / 1000}s...`);
        await sleep(intervalMs);
        continue;
      } else {
        console.error(`[POLL ERROR] Attempt ${attempt} failed: ${error.message}`);
        throw error;
      }
    }
  }

  throw new Error(`Scraping job timed out after ${(maxAttempts * intervalMs) / 1000} seconds`);
}

/**
 * Performs a single Bright Data DCA trigger and poll extraction attempt
 */
async function executeSingleScrapeAttempt(urlStr, apiKey, mapping) {
  const { source, collectorId } = mapping;
  if (!collectorId) {
    throw new Error(`No collector ID configured for source: ${source}`);
  }

  console.log(`[SCRAPE TRIGGER] Source: ${source} | Collector: ${collectorId} | URL: ${urlStr}`);

  // 1. Trigger Bright Data DCA collection job
  const triggerUrl = `https://api.brightdata.com/dca/trigger?collector=${collectorId}&queue_override_incompatible_schema=1&override_incompatible_schema=1`;
  const triggerResponse = await axios.post(
    triggerUrl,
    [{ url: urlStr.trim() }],
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const triggerData = triggerResponse.data;
  const jobId = triggerData.collection_id || triggerData.snapshot_id || triggerData.response_id || triggerData.id;

  if (!jobId) {
    console.error(`[TRIGGER ERROR] Failed to parse Job ID for ${source}:`, triggerData);
    throw new Error(`Failed to obtain job collection ID from Bright Data response for ${source}`);
  }

  console.log(`[TRIGGER SUCCESS] ${source} Job ID: ${jobId}`);

  // 2. Poll for scraping results
  const scrapedResult = await pollBrightDataResults(jobId, apiKey);
  const rawItem = Array.isArray(scrapedResult) ? scrapedResult[0] : scrapedResult;

  if (!rawItem || typeof rawItem !== 'object') {
    throw new Error(`Empty dataset returned from Bright Data collector for ${source}`);
  }

  // 3. Normalize into common format
  const normalized = normalizeScrapedProduct(rawItem, source, urlStr.trim());
  normalized.jobId = jobId;

  // 4. Enrich with fallback page metadata if price, image, or availability is missing
  if (normalized.currentPrice === null || !normalized.image || !normalized.availability) {
    const fallback = await fallbackExtractDetails(urlStr.trim());
    if (normalized.currentPrice === null && fallback.currentPrice !== null && fallback.currentPrice !== undefined) {
      normalized.currentPrice = fallback.currentPrice;
    }
    if (normalized.originalPrice === null && fallback.originalPrice !== null && fallback.originalPrice !== undefined) {
      normalized.originalPrice = fallback.originalPrice;
    }
    if (!normalized.image && fallback.image) {
      normalized.image = fallback.image;
    }
    if (!normalized.availability && fallback.availability) {
      normalized.availability = fallback.availability;
    }
  }

  return normalized;
}

/**
 * Execute scraper for a single URL with extraction validation and automatic retry mechanism
 *
 * @param {string} urlStr - Target product URL
 * @param {string} apiKey - Bright Data API key
 * @param {number} maxAttempts - Maximum number of scrape attempts (defaults to MAX_SCRAPE_ATTEMPTS)
 * @returns {Promise<{ success: boolean, url: string, source: string, product?: Object, error?: string, attempts: number, status: 'success' | 'failed' }>}
 */
async function scrapeSingleUrlWithRetry(urlStr, apiKey, maxAttempts = MAX_SCRAPE_ATTEMPTS) {
  const mapping = getCollectorForUrl(urlStr);
  if (mapping.error) {
    return {
      success: false,
      url: urlStr,
      source: 'Unknown',
      error: mapping.error,
      attempts: 0,
      status: 'failed',
    };
  }

  const { source } = mapping;
  let lastErrorMessage = 'Unknown scrape failure';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[SCRAPE ATTEMPT ${attempt}/${maxAttempts}] Source: ${source} | URL: ${urlStr}`);

    try {
      // Execute extraction attempt
      const normalized = await executeSingleScrapeAttempt(urlStr, apiKey, mapping);

      // Validate extracted product fields
      const validation = validateScrapedProduct(normalized);
      if (!validation.isValid) {
        throw new Error(`Extraction validation failed: ${validation.error}`);
      }

      // Persist to MongoDB Product collection (only valid data reaches here)
      if (mongoose.connection.readyState === 1 && normalized.productUrl) {
        await persistValidProductCatalogItem(normalized, source);
      }

      console.log(`[SCRAPE SUCCESS] ${source} validated successfully on attempt ${attempt}/${maxAttempts}`);
      return {
        success: true,
        url: urlStr,
        source: normalized.source,
        product: normalized,
        attempts: attempt,
        status: 'success',
      };

    } catch (err) {
      lastErrorMessage = err.message || 'Scraping error occurred';
      console.warn(`[SCRAPE ATTEMPT ${attempt} FAILED] ${source} (${urlStr}): ${lastErrorMessage}`);

      if (attempt < maxAttempts) {
        console.log(`[SCRAPE RETRY] Retrying ${source} in ${RETRY_DELAY_MS}ms (Attempt ${attempt + 1}/${maxAttempts})...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  // All attempts exhausted
  console.error(`[SCRAPE EXHAUSTED] ${source} failed after ${maxAttempts} attempt(s): ${lastErrorMessage}`);
  return {
    success: false,
    url: urlStr,
    source,
    error: lastErrorMessage,
    attempts: maxAttempts,
    status: 'failed',
  };
}

/**
 * Execute scraper for a single URL using auto-detected collector with validation
 */
async function scrapeSingleUrl(urlStr, apiKey) {
  const result = await scrapeSingleUrlWithRetry(urlStr, apiKey, MAX_SCRAPE_ATTEMPTS);
  if (!result.success || !result.product) {
    throw new Error(result.error || `Scraping failed for ${urlStr}`);
  }
  return result.product;
}

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return res.status(200).json({
    status: 'ok',
    database: dbStatus,
    collectors: {
      amazon: process.env.BRIGHT_DATA_AMAZON_COLLECTOR_ID || process.env.BRIGHT_DATA_COLLECTOR_ID || 'c_mt0gyz9d11g1yi8p98',
      kamalImaging: process.env.BRIGHT_DATA_KAMAL_COLLECTOR_ID || 'c_mt1bz3s5tdc173nng',
      fujifilmXIndia: process.env.BRIGHT_DATA_FUJIFILM_COLLECTOR_ID || 'c_mt1cchzkfvyuvi8tm',
    },
  });
});

/**
 * Single Product Scrape Endpoint
 * POST /api/scrape
 * Body: { "url": "https://..." }
 */
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid "url" string parameter is required in the request body.',
      });
    }

    const mapping = getCollectorForUrl(url);
    if (mapping.error) {
      return res.status(400).json({
        error: 'Unsupported Domain',
        message: mapping.error,
      });
    }

    const apiKey = process.env.BRIGHT_DATA_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_bright_data_api_key_here') {
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Bright Data API key is missing. Please set BRIGHT_DATA_API_KEY in backend/.env',
      });
    }

    let previousPrice = null;
    if (mongoose.connection.readyState === 1) {
      const existingProduct = await Product.findOne({ productUrl: url.trim() });
      if (existingProduct) {
        previousPrice = existingProduct.currentPrice;
      }
    }

    const scrapeResult = await scrapeSingleUrlWithRetry(url.trim(), apiKey, MAX_SCRAPE_ATTEMPTS);
    if (!scrapeResult.success || !scrapeResult.product) {
      return res.status(422).json({
        error: 'Extraction Validation Failed',
        message: scrapeResult.error || 'Failed to extract valid product data after retries.',
        source: scrapeResult.source,
        attempts: scrapeResult.attempts,
        status: 'failed',
      });
    }

    const product = scrapeResult.product;
    const priceChange = calculatePriceChange(previousPrice, product.currentPrice);

    return res.status(200).json({
      success: true,
      source: product.source,
      status: 'success',
      attempts: scrapeResult.attempts,
      job_id: product.jobId,
      product: product,
      priceChange: priceChange,
    });

  } catch (error) {
    console.error('[SCRAPE ERROR]', error.message);

    if (error.response) {
      const status = error.response.status;
      const apiErrorMessage = error.response.data?.error || error.response.data?.message || 'Bright Data API error';
      return res.status(status >= 400 && status < 600 ? status : 500).json({
        error: 'Scraping Provider Error',
        status: status,
        message: apiErrorMessage,
      });
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timed out')) {
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The scraping operation timed out waiting for Bright Data results.',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred while processing the scrape request.',
    });
  }
});

/**
 * Competitor Price Intelligence Comparison Endpoint
 * POST /api/products/compare
 * Body: { "urls": ["...", "...", "..."] }
 */
app.post('/api/products/compare', async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body must contain a "urls" array with at least one product URL string.',
      });
    }

    const cleanedUrls = urls
      .filter(u => typeof u === 'string' && u.trim().length > 0)
      .map(u => u.trim());

    if (cleanedUrls.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid URL strings found in "urls" array.',
      });
    }

    // Validate domains upfront
    const validationErrors = [];
    cleanedUrls.forEach((url, idx) => {
      const mapping = getCollectorForUrl(url);
      if (mapping.error) {
        validationErrors.push(`URL [${idx + 1}] "${url}": ${mapping.error}`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Unsupported Domain',
        message: 'One or more provided URLs have unsupported domains.',
        details: validationErrors,
        supportedSources: [
          { name: 'Amazon', domains: ['amazon.in', 'amzn.in', 'amazon.com'] },
          { name: 'Kamal Imaging', domains: ['kamalimaging.com'] },
          { name: 'Fujifilm X India', domains: ['fujifilmxindia.com'] },
        ],
      });
    }

    const apiKey = process.env.BRIGHT_DATA_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_bright_data_api_key_here') {
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Bright Data API key is missing. Please set BRIGHT_DATA_API_KEY in backend/.env',
      });
    }

    console.log(`[COMPARE START] Running multi-source price comparison for ${cleanedUrls.length} URLs...`);

    // Scrape in parallel across all URLs with validation and retry
    const results = await scrapeCompetitorUrls(cleanedUrls, apiKey);

    const successfulProducts = results
      .filter(r => r.success && r.product)
      .map(r => r.product);

    const failedScrapes = results
      .filter(r => !r.success)
      .map(r => ({
        url: r.url,
        source: r.source,
        error: r.error,
        attempts: r.attempts,
        status: 'failed',
      }));

    const sourcesStatus = results.map(r => ({
      source: r.source,
      url: r.url,
      status: r.status || (r.success ? 'success' : 'failed'),
      attempts: r.attempts,
      error: r.error || undefined,
    }));

    const analytics = calculateComparisonAnalytics(successfulProducts);

    return res.status(200).json({
      success: true,
      count: successfulProducts.length,
      totalRequested: cleanedUrls.length,
      products: successfulProducts,
      lowestPrice: analytics.lowestPrice,
      highestPrice: analytics.highestPrice,
      priceDifference: analytics.priceDifference,
      cheapestSource: analytics.cheapestSource,
      sourcesStatus: sourcesStatus,
      failed: failedScrapes.length > 0 ? failedScrapes : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[COMPARE FATAL ERROR]', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred during competitor price comparison.',
    });
  }
});

/**
 * Reusable helper to scrape multiple competitor URLs in parallel with extraction validation and retry
 */
async function scrapeCompetitorUrls(urls, apiKey) {
  const scrapePromises = urls.map(url => scrapeSingleUrlWithRetry(url, apiKey, MAX_SCRAPE_ATTEMPTS));
  return await Promise.all(scrapePromises);
}

/**
 * Create a New Monitored Product
 * POST /api/monitors
 * Body: { "name": "Fujifilm X-H2S", "urls": ["...", "...", "..."] }
 */
app.post('/api/monitors', async (req, res) => {
  try {
    const { name, urls } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid "name" string is required for the monitored product.',
      });
    }

    if (!urls || !Array.isArray(urls) || urls.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A "urls" array with at least 2 competitor product URLs is required.',
      });
    }

    const cleanedUrls = urls
      .filter(u => typeof u === 'string' && u.trim().length > 0)
      .map(u => u.trim());

    if (cleanedUrls.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least 2 valid non-empty competitor URLs are required.',
      });
    }

    // Validate domains upfront
    const validationErrors = [];
    cleanedUrls.forEach((url, idx) => {
      const mapping = getCollectorForUrl(url);
      if (mapping.error) {
        validationErrors.push(`URL [${idx + 1}] "${url}": ${mapping.error}`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Unsupported Domain',
        message: 'One or more provided URLs have unsupported domains.',
        details: validationErrors,
        supportedSources: [
          { name: 'Amazon', domains: ['amazon.in', 'amzn.in', 'amazon.com'] },
          { name: 'Kamal Imaging', domains: ['kamalimaging.com'] },
          { name: 'Fujifilm X India', domains: ['fujifilmxindia.com'] },
        ],
      });
    }

    const apiKey = process.env.BRIGHT_DATA_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_bright_data_api_key_here') {
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Bright Data API key is missing. Please set BRIGHT_DATA_API_KEY in backend/.env',
      });
    }

    console.log(`[MONITOR CREATE] Scraping baseline for "${name.trim()}" across ${cleanedUrls.length} sources...`);
    const scrapeResults = await scrapeCompetitorUrls(cleanedUrls, apiKey);

    const successfulProducts = scrapeResults
      .filter(r => r.success && r.product)
      .map(r => r.product);

    const analytics = calculateComparisonAnalytics(successfulProducts);

    let brand = '';
    for (const p of successfulProducts) {
      if (p.brand && p.brand.trim()) {
        brand = p.brand.trim();
        break;
      }
    }

    const checkTimestamp = new Date();

    const competitorUrlsData = scrapeResults.map(r => {
      if (r.success && r.product) {
        return {
          source: r.product.source,
          url: r.url,
          productTitle: r.product.productTitle || '',
          currentPrice: r.product.currentPrice,
          originalPrice: r.product.originalPrice,
          currency: r.product.currency || 'INR',
          discount: r.product.discount || '',
          rating: r.product.rating,
          reviewCount: r.product.reviewCount,
          availability: r.product.availability || '',
          image: r.product.image || '',
          sku: r.product.sku || '',
          jobId: r.product.jobId || '',
          lastCheckedAt: checkTimestamp,
          lastError: null,
        };
      } else {
        return {
          source: r.source,
          url: r.url,
          productTitle: '',
          currentPrice: null,
          originalPrice: null,
          currency: 'INR',
          discount: '',
          rating: null,
          reviewCount: null,
          availability: 'Unavailable',
          image: '',
          sku: '',
          jobId: '',
          lastCheckedAt: checkTimestamp,
          lastError: r.error || 'Scrape failed after retries',
        };
      }
    });

    const monitor = new ProductMonitor({
      name: name.trim(),
      brand: brand,
      competitorUrls: competitorUrlsData,
      lowestPrice: analytics.lowestPrice,
      highestPrice: analytics.highestPrice,
      priceDifference: analytics.priceDifference,
      cheapestSource: analytics.cheapestSource,
      lastCheckedAt: checkTimestamp,
    });

    await monitor.save();
    console.log(`[MONITOR CREATED] Created monitor ID: ${monitor._id} ("${monitor.name}")`);

    // Create initial historical snapshot ONLY for validated successful sources with valid positive prices
    const snapshotPromises = scrapeResults
      .filter(r => r.success && r.product && typeof r.product.currentPrice === 'number' && r.product.currentPrice > 0)
      .map(r => {
        return createValidPriceSnapshot({
          monitorId: monitor._id,
          source: r.product.source,
          url: r.url,
          price: r.product.currentPrice,
          originalPrice: r.product.originalPrice,
          currency: r.product.currency,
          availability: r.product.availability,
          timestamp: checkTimestamp,
        });
      });

    await Promise.all(snapshotPromises);

    const sourcesStatus = scrapeResults.map(r => ({
      source: r.source,
      url: r.url,
      status: r.status || (r.success ? 'success' : 'failed'),
      attempts: r.attempts,
      error: r.error || undefined,
    }));

    return res.status(201).json({
      success: true,
      monitor: monitor,
      comparison: analytics,
      sourcesStatus: sourcesStatus,
      timestamp: checkTimestamp.toISOString(),
    });

  } catch (error) {
    console.error('[POST /api/monitors ERROR]', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create product monitor.',
    });
  }
});

/**
 * Check/Refresh Monitored Product & Detect Changes
 * POST /api/monitors/:id/check
 */
app.post('/api/monitors/:id/check', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid monitor ID format: "${id}". Must be a valid MongoDB ObjectId.`,
      });
    }

    const monitor = await ProductMonitor.findById(id);
    if (!monitor) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product monitor with ID "${id}" was not found.`,
      });
    }

    const apiKey = process.env.BRIGHT_DATA_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_bright_data_api_key_here') {
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Bright Data API key is missing. Please set BRIGHT_DATA_API_KEY in backend/.env',
      });
    }

    const urls = monitor.competitorUrls.map(c => c.url);
    console.log(`[MONITOR CHECK] Re-scraping ${urls.length} sources for monitor "${monitor.name}" (${monitor._id})...`);

    const scrapeResults = await scrapeCompetitorUrls(urls, apiKey);
    const checkTimestamp = new Date();
    const changeEvents = [];

    // Process each competitor URL
    for (const result of scrapeResults) {
      const compSource = result.source;
      const compUrl = result.url;

      const compSubdoc = monitor.competitorUrls.find(c => c.url === compUrl || c.source === compSource);

      // Get latest valid previous snapshot (price > 0) for this source before this run
      const prevSnapshot = await PriceSnapshot.findOne({
        monitorId: monitor._id,
        source: compSource,
        price: { $ne: null, $gt: 0 },
      }).sort({ timestamp: -1 });

      if (!result.success || !result.product) {
        // Source Failure check
        const failureMessage = `Scraper failure on ${compSource}: ${result.error || 'Failed to extract valid data after retries'}`;
        const failureEvent = {
          monitorId: monitor._id,
          type: 'SOURCE_FAILURE',
          source: compSource,
          previousPrice: prevSnapshot ? prevSnapshot.price : null,
          currentPrice: null,
          difference: null,
          percentageChange: null,
          previousAvailability: prevSnapshot ? prevSnapshot.availability || null : null,
          currentAvailability: 'Error / Unavailable',
          message: failureMessage,
          timestamp: checkTimestamp,
        };
        changeEvents.push(failureEvent);

        if (compSubdoc) {
          compSubdoc.lastError = result.error || 'Extraction failed after retries';
          compSubdoc.lastCheckedAt = checkTimestamp;
        }

        // CRITICAL: NEVER create a PriceSnapshot for failed/invalid data
      } else {
        const product = result.product;
        const newPrice = product.currentPrice;
        const newAvailability = product.availability || '';

        // RECOVERY BEHAVIOR: Clear lastError and update timestamp
        if (compSubdoc) {
          compSubdoc.lastError = null;
          compSubdoc.lastCheckedAt = checkTimestamp;
          if (product.productTitle) compSubdoc.productTitle = product.productTitle;
          compSubdoc.currentPrice = newPrice;
          if (product.originalPrice !== null) compSubdoc.originalPrice = product.originalPrice;
          compSubdoc.currency = product.currency || 'INR';
          if (product.discount) compSubdoc.discount = product.discount;
          if (product.rating !== null) compSubdoc.rating = product.rating;
          if (product.reviewCount !== null) compSubdoc.reviewCount = product.reviewCount;
          if (product.availability) compSubdoc.availability = product.availability;
          if (product.image) compSubdoc.image = product.image;
          if (product.sku) compSubdoc.sku = product.sku;
          if (product.jobId) compSubdoc.jobId = product.jobId;
        }

        // Price change detection against actual previous valid snapshot
        if (prevSnapshot && prevSnapshot.price !== null && typeof prevSnapshot.price === 'number' && prevSnapshot.price > 0 && newPrice !== null) {
          const diff = Number((newPrice - prevSnapshot.price).toFixed(2));
          const pct = prevSnapshot.price !== 0
            ? Number((((newPrice - prevSnapshot.price) / prevSnapshot.price) * 100).toFixed(2))
            : 0;

          if (diff < 0) {
            changeEvents.push({
              monitorId: monitor._id,
              type: 'PRICE_DROP',
              source: compSource,
              previousPrice: prevSnapshot.price,
              currentPrice: newPrice,
              difference: diff,
              percentageChange: pct,
              previousAvailability: prevSnapshot.availability,
              currentAvailability: newAvailability,
              message: `Price dropped on ${compSource} by ₹${Math.abs(diff).toLocaleString('en-IN')} (${Math.abs(pct)}%)`,
              timestamp: checkTimestamp,
            });
          } else if (diff > 0) {
            changeEvents.push({
              monitorId: monitor._id,
              type: 'PRICE_INCREASE',
              source: compSource,
              previousPrice: prevSnapshot.price,
              currentPrice: newPrice,
              difference: diff,
              percentageChange: pct,
              previousAvailability: prevSnapshot.availability,
              currentAvailability: newAvailability,
              message: `Price increased on ${compSource} by ₹${diff.toLocaleString('en-IN')} (+${pct}%)`,
              timestamp: checkTimestamp,
            });
          }
        }

        // Availability change detection
        if (
          prevSnapshot &&
          prevSnapshot.availability &&
          newAvailability &&
          prevSnapshot.availability.trim().toLowerCase() !== newAvailability.trim().toLowerCase()
        ) {
          changeEvents.push({
            monitorId: monitor._id,
            type: 'AVAILABILITY_CHANGE',
            source: compSource,
            previousPrice: prevSnapshot.price,
            currentPrice: newPrice,
            difference: null,
            percentageChange: null,
            previousAvailability: prevSnapshot.availability,
            currentAvailability: newAvailability,
            message: `Availability on ${compSource} changed from "${prevSnapshot.availability}" to "${newAvailability}"`,
            timestamp: checkTimestamp,
          });
        }

        // Save new price snapshot (only valid positive price)
        await createValidPriceSnapshot({
          monitorId: monitor._id,
          source: compSource,
          url: compUrl,
          price: newPrice,
          originalPrice: product.originalPrice,
          currency: product.currency || 'INR',
          availability: newAvailability,
          timestamp: checkTimestamp,
        });
      }
    }

    // Recompute analytics across successfully scraped products
    const successfulProducts = scrapeResults
      .filter(r => r.success && r.product)
      .map(r => r.product);

    const newAnalytics = calculateComparisonAnalytics(successfulProducts);

    // NEW_LOWEST_PRICE change detection
    if (newAnalytics.lowestPrice !== null && monitor.lowestPrice !== null) {
      if (newAnalytics.lowestPrice < monitor.lowestPrice) {
        const diff = Number((newAnalytics.lowestPrice - monitor.lowestPrice).toFixed(2));
        const pct = monitor.lowestPrice !== 0
          ? Number((((newAnalytics.lowestPrice - monitor.lowestPrice) / monitor.lowestPrice) * 100).toFixed(2))
          : 0;

        changeEvents.push({
          monitorId: monitor._id,
          type: 'NEW_LOWEST_PRICE',
          source: newAnalytics.cheapestSource,
          previousPrice: monitor.lowestPrice,
          currentPrice: newAnalytics.lowestPrice,
          difference: diff,
          percentageChange: pct,
          previousAvailability: null,
          currentAvailability: null,
          message: `New lowest market price discovered at ${newAnalytics.cheapestSource}: ₹${newAnalytics.lowestPrice.toLocaleString('en-IN')}`,
          timestamp: checkTimestamp,
        });
      } else if (newAnalytics.cheapestSource !== monitor.cheapestSource && newAnalytics.lowestPrice <= monitor.lowestPrice) {
        changeEvents.push({
          monitorId: monitor._id,
          type: 'NEW_LOWEST_PRICE',
          source: newAnalytics.cheapestSource,
          previousPrice: monitor.lowestPrice,
          currentPrice: newAnalytics.lowestPrice,
          difference: 0,
          percentageChange: 0,
          previousAvailability: null,
          currentAvailability: null,
          message: `${newAnalytics.cheapestSource} is now the cheapest source at ₹${newAnalytics.lowestPrice.toLocaleString('en-IN')}`,
          timestamp: checkTimestamp,
        });
      }
    }

    // Persist ChangeEvent records
    if (changeEvents.length > 0) {
      await ChangeEvent.insertMany(changeEvents);
      console.log(`[MONITOR CHECK] Recorded ${changeEvents.length} change event(s) for "${monitor.name}"`);
    }

    // Update Monitor Document
    if (newAnalytics.lowestPrice !== null) {
      monitor.lowestPrice = newAnalytics.lowestPrice;
      monitor.highestPrice = newAnalytics.highestPrice;
      monitor.priceDifference = newAnalytics.priceDifference;
      monitor.cheapestSource = newAnalytics.cheapestSource;
    }
    monitor.lastCheckedAt = checkTimestamp;

    await monitor.save();

    const sourcesStatus = scrapeResults.map(r => ({
      source: r.source,
      url: r.url,
      status: r.status || (r.success ? 'success' : 'failed'),
      attempts: r.attempts,
      error: r.error || undefined,
    }));

    return res.status(200).json({
      success: true,
      monitor: monitor,
      comparison: newAnalytics,
      changes: changeEvents,
      sourcesStatus: sourcesStatus,
    });

  } catch (error) {
    console.error(`[POST /api/monitors/${req.params.id}/check ERROR]`, error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to perform monitor check.',
    });
  }
});

/**
 * Get All Monitored Products
 * GET /api/monitors
 */
app.get('/api/monitors', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database Unavailable',
        message: 'Database is not connected. Please verify MONGODB_URI configuration.',
      });
    }

    const rawMonitors = await ProductMonitor.find().sort({ updatedAt: -1 });
    const recentChangesCount = await ChangeEvent.countDocuments();

    const monitors = rawMonitors.map(m => ({
      _id: m._id,
      name: m.name,
      brand: m.brand,
      competitorsCount: m.competitorUrls ? m.competitorUrls.length : 0,
      lowestPrice: m.lowestPrice,
      highestPrice: m.highestPrice,
      priceDifference: m.priceDifference,
      cheapestSource: m.cheapestSource,
      lastCheckedAt: m.lastCheckedAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: monitors.length,
      recentChangesCount: recentChangesCount,
      monitors: monitors,
    });

  } catch (error) {
    console.error('[GET /api/monitors ERROR]', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve monitored products from database.',
    });
  }
});

/**
 * Get Single Monitored Product with Full History & Change Events
 * GET /api/monitors/:id
 */
app.get('/api/monitors/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database Unavailable',
        message: 'Database is not connected. Please verify MONGODB_URI configuration.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid monitor ID format: "${id}". Must be a valid MongoDB ObjectId.`,
      });
    }

    const monitor = await ProductMonitor.findById(id);
    if (!monitor) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product monitor with ID "${id}" was not found.`,
      });
    }

    // Fetch all snapshots grouped by source
    const snapshots = await PriceSnapshot.find({ monitorId: id }).sort({ timestamp: 1 });

    const priceHistoryBySource = {};
    snapshots.forEach(s => {
      if (!priceHistoryBySource[s.source]) {
        priceHistoryBySource[s.source] = [];
      }
      priceHistoryBySource[s.source].push({
        _id: s._id,
        price: s.price,
        originalPrice: s.originalPrice,
        currency: s.currency,
        availability: s.availability,
        timestamp: s.timestamp,
      });
    });

    // Fetch recent change events
    const recentChanges = await ChangeEvent.find({ monitorId: id })
      .sort({ timestamp: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      monitor: monitor,
      comparison: {
        lowestPrice: monitor.lowestPrice,
        highestPrice: monitor.highestPrice,
        priceDifference: monitor.priceDifference,
        cheapestSource: monitor.cheapestSource,
      },
      priceHistory: priceHistoryBySource,
      recentChanges: recentChanges,
    });

  } catch (error) {
    console.error(`[GET /api/monitors/${req.params.id} ERROR]`, error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve monitor details from database.',
    });
  }
});

/**
 * Delete Monitored Product with Cascading Snapshots & Change Events
 * DELETE /api/monitors/:id
 */
app.delete('/api/monitors/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database Unavailable',
        message: 'Database is not connected. Please verify MONGODB_URI configuration.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid monitor ID format: "${id}". Must be a valid MongoDB ObjectId.`,
      });
    }

    const monitor = await ProductMonitor.findById(id);
    if (!monitor) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product monitor with ID "${id}" was not found.`,
      });
    }

    // Cascade delete associated snapshots and change events
    const [deletedSnapshots, deletedEvents] = await Promise.all([
      PriceSnapshot.deleteMany({ monitorId: id }),
      ChangeEvent.deleteMany({ monitorId: id }),
      ProductMonitor.findByIdAndDelete(id),
    ]);

    console.log(`[MONITOR DELETED] Deleted monitor ID: ${id} ("${monitor.name}") and cleaned up snapshots/events.`);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted monitor "${monitor.name}" and associated telemetry data.`,
      deletedId: id,
      deletedSnapshotsCount: deletedSnapshots.deletedCount,
      deletedEventsCount: deletedEvents.deletedCount,
    });

  } catch (error) {
    console.error(`[DELETE /api/monitors/${req.params.id} ERROR]`, error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete product monitor from database.',
    });
  }
});

/**
 * Get All Tracked Products Endpoint
 * GET /api/products
 */
app.get('/api/products', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database Unavailable',
        message: 'Database is not connected. Please verify MONGODB_URI configuration.',
      });
    }

    const products = await Product.find().sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('[GET /api/products ERROR]', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve products from database.',
    });
  }
});

/**
 * Get Single Product Endpoint with Price History
 * GET /api/products/:id
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database Unavailable',
        message: 'Database is not connected. Please verify MONGODB_URI configuration.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid product ID format: "${id}". Must be a valid MongoDB ObjectId.`,
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID "${id}" was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(`[GET /api/products/${req.params.id} ERROR]`, error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve product details from database.',
    });
  }
});

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.originalUrl} does not exist.` });
});

// Connect to MongoDB and Start Express Server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` WebPulse / PriceWatch AI Backend running on port ${PORT}`);
    console.log(` Health check:      GET  http://localhost:${PORT}/api/health`);
    console.log(` Scrape route:       POST http://localhost:${PORT}/api/scrape`);
    console.log(` Compare route:      POST http://localhost:${PORT}/api/products/compare`);
    console.log(` Monitors create:    POST http://localhost:${PORT}/api/monitors`);
    console.log(` Monitors list:      GET  http://localhost:${PORT}/api/monitors`);
    console.log(` Monitor by ID:      GET  http://localhost:${PORT}/api/monitors/:id`);
    console.log(` Monitor check:      POST http://localhost:${PORT}/api/monitors/:id/check`);
    console.log(` Monitor delete:     DELETE http://localhost:${PORT}/api/monitors/:id`);
    console.log(` Products list:      GET  http://localhost:${PORT}/api/products`);
    console.log(` Product by ID:      GET  http://localhost:${PORT}/api/products/:id`);
    console.log(`==================================================`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  MAX_SCRAPE_ATTEMPTS,
  RETRY_DELAY_MS,
  validateScrapedProduct,
  createValidPriceSnapshot,
  scrapeSingleUrlWithRetry,
  scrapeCompetitorUrls,
  scrapeSingleUrl,
  calculateComparisonAnalytics,
  calculatePriceChange,
  normalizeScrapedProduct,
  getCollectorForUrl,
  connectDB,
};

