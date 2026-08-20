const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

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
 * Helper function to calculate price change metrics
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
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return res.status(200).json({
    status: 'ok',
    database: dbStatus
  });
});

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
          'Accept': 'application/json'
        },
        timeout: 10000 // 10s HTTP timeout for each poll request
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

      // 3. Completed: data retrieved successfully (e.g. array of items or product object)
      console.log(`[POLL SUCCESS] Data successfully retrieved for Job ID: ${jobId}`);
      return data;

    } catch (error) {
      // Re-throw explicit job failure errors
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
 * Scrape Endpoint
 * POST /api/scrape
 * Body: { "url": "https://amzn.in/d/05nY9mcD" }
 */
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    // 1. Validate request body
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid "url" string parameter is required in the request body.'
      });
    }

    // 2. Validate environment configuration
    const apiKey = process.env.BRIGHT_DATA_API_KEY;
    const collectorId = process.env.BRIGHT_DATA_COLLECTOR_ID || 'c_mt0gyz9d11g1yi8p98';

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_bright_data_api_key_here') {
      console.error('[CONFIG ERROR] BRIGHT_DATA_API_KEY is not set or configured in .env file');
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Bright Data API key is missing. Please set BRIGHT_DATA_API_KEY in backend/.env'
      });
    }

    console.log(`[SCRAPE START] Triggering scraper for URL: ${url}`);
    console.log(`[SCRAPE CONFIG] Collector ID: ${collectorId}`);

    // 3. Trigger Bright Data DCA collection job
    const triggerUrl = `https://api.brightdata.com/dca/trigger?collector=${collectorId}`;
    
    const triggerResponse = await axios.post(
      triggerUrl,
      [{ url: url.trim() }],
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15s timeout for trigger request
      }
    );

    // 4. Extract Job / Collection ID from trigger response
    const triggerData = triggerResponse.data;
    const jobId = triggerData.collection_id || triggerData.snapshot_id || triggerData.response_id || triggerData.id;

    if (!jobId) {
      console.error('[TRIGGER ERROR] Failed to parse Job ID from Bright Data response:', triggerData);
      return res.status(502).json({
        error: 'Bad Gateway',
        message: 'Failed to obtain job collection ID from Bright Data API response.'
      });
    }

    console.log(`[TRIGGER SUCCESS] Job ID received: ${jobId}`);

    // 5. Poll for scraping results
    const scrapedResult = await pollBrightDataResults(jobId, apiKey);

    // 6. Normalize and persist scraped product data to MongoDB
    const rawItem = Array.isArray(scrapedResult) ? scrapedResult[0] : scrapedResult;
    const targetUrl = (rawItem && (rawItem.product_url || rawItem.url || rawItem.input?.url)) || url.trim();
    const productTitle = (rawItem && (rawItem.product_title || rawItem.title || rawItem.name)) || '';
    const brand = (rawItem && rawItem.brand) || '';
    const currentPrice = extractPrice(rawItem && (rawItem.current_price ?? rawItem.price));
    const originalPrice = extractPrice(rawItem && (rawItem.original_price ?? rawItem.initial_price ?? rawItem.list_price));
    const currency = extractCurrency(rawItem);
    const discount = (rawItem && rawItem.discount) ? String(rawItem.discount).trim() : '';
    const rating = rawItem && typeof rawItem.rating === 'number' ? rawItem.rating : (parseFloat(rawItem && rawItem.rating) || null);
    const reviewCount = rawItem && typeof rawItem.review_count === 'number' ? rawItem.review_count : (parseInt(rawItem && (rawItem.reviews_count || rawItem.review_count || rawItem.reviews), 10) || null);
    const availability = (rawItem && rawItem.availability) ? String(rawItem.availability).trim() : '';

    let savedProduct = null;
    let isNewProduct = false;
    let priceChange = null;

    if (mongoose.connection.readyState === 1) {
      let product = await Product.findOne({ productUrl: targetUrl });

      if (!product) {
        // Create new product document
        isNewProduct = true;
        priceChange = calculatePriceChange(null, currentPrice);

        const initialPriceHistory = [];
        if (currentPrice !== null && currentPrice !== undefined) {
          initialPriceHistory.push({
            price: currentPrice,
            currency: currency,
            timestamp: new Date()
          });
        }

        product = new Product({
          productUrl: targetUrl,
          productTitle,
          brand,
          currentPrice,
          currency,
          originalPrice,
          discount,
          rating,
          reviewCount,
          availability,
          priceHistory: initialPriceHistory
        });

        savedProduct = await product.save();
        console.log(`[DATABASE] Created new product entry: "${productTitle}" (_id: ${savedProduct._id})`);
      } else {
        // Read previous currentPrice before updating
        const previousPrice = product.currentPrice;
        priceChange = calculatePriceChange(previousPrice, currentPrice);

        const priceChanged = priceChange.direction !== 'unchanged' && priceChange.direction !== 'initial';

        // Add a new priceHistory entry when appropriate (price changed or no history exists)
        if (currentPrice !== null && (priceChanged || product.priceHistory.length === 0)) {
          product.priceHistory.push({
            price: currentPrice,
            currency: currency,
            timestamp: new Date()
          });
        }

        // Update product fields with latest scraped values
        product.currentPrice = currentPrice;
        product.currency = currency;
        if (productTitle) product.productTitle = productTitle;
        if (brand) product.brand = brand;
        if (originalPrice !== null) product.originalPrice = originalPrice;
        if (discount) product.discount = discount;
        if (rating !== null) product.rating = rating;
        if (reviewCount !== null) product.reviewCount = reviewCount;
        if (availability) product.availability = availability;

        savedProduct = await product.save();
        console.log(`[DATABASE] Updated existing product (_id: ${savedProduct._id}, direction: ${priceChange.direction}, diff: ${priceChange.difference})`);
      }
    } else {
      console.warn('[DATABASE WARNING] MongoDB is not connected; skipping database persistence.');
      priceChange = calculatePriceChange(null, currentPrice);
    }

    // 7. Return product data and price-change information in API response
    return res.status(200).json({
      success: true,
      job_id: jobId,
      is_new_product: isNewProduct,
      product: savedProduct,
      priceChange: priceChange,
      data: scrapedResult
    });

  } catch (error) {
    console.error('[SCRAPE ERROR]', error.message);

    // Handle Axios errors cleanly without leaking sensitive details like API key
    if (error.response) {
      const status = error.response.status;
      const apiErrorMessage = error.response.data?.error || error.response.data?.message || 'Bright Data API error';

      return res.status(status >= 400 && status < 600 ? status : 500).json({
        error: 'Scraping Provider Error',
        status: status,
        message: apiErrorMessage
      });
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timed out')) {
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The scraping operation timed out waiting for Bright Data results.'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred while processing the scrape request.'
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
        message: 'Database is not connected. Please verify MONGODB_URI configuration.'
      });
    }

    const products = await Product.find().sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('[GET /api/products ERROR]', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve products from database.'
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
        message: 'Database is not connected. Please verify MONGODB_URI configuration.'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid product ID format: "${id}". Must be a valid MongoDB ObjectId.`
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID "${id}" was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(`[GET /api/products/${req.params.id} ERROR]`, error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve product details from database.'
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
    console.log(` PriceWatch AI Backend running on port ${PORT}`);
    console.log(` Health check:  http://localhost:${PORT}/api/health`);
    console.log(` Scrape route:   POST http://localhost:${PORT}/api/scrape`);
    console.log(` Products list:  GET http://localhost:${PORT}/api/products`);
    console.log(` Product by ID:  GET http://localhost:${PORT}/api/products/:id`);
    console.log(`==================================================`);
  });
};

startServer();

