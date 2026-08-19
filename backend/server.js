const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Basic Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

/**
 * Helper function to sleep/wait for a given number of milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper function to poll Bright Data dataset API until completion or timeout
 */
async function pollBrightDataResults(jobId, apiKey, maxAttempts = 30, intervalMs = 3000) {
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

      // Bright Data returns status object if job is still in progress
      // e.g. { status: "building" } or { status: "running" }
      const isBuilding = data && typeof data === 'object' && !Array.isArray(data) && 
        (data.status === 'building' || data.status === 'running' || data.status === 'pending');

      if (!isBuilding) {
        console.log(`[POLL] Data successfully retrieved for Job ID: ${jobId}`);
        return data;
      }

      console.log(`[POLL] Job ${jobId} status is '${data.status}'. Waiting ${intervalMs / 1000}s...`);
    } catch (error) {
      // If 202 Accepted or 404 temporary during build phase, log and retry
      if (error.response && (error.response.status === 202 || error.response.status === 404)) {
        console.log(`[POLL] Received HTTP ${error.response.status} for Job ID: ${jobId}. Retrying...`);
      } else {
        console.error(`[POLL ERROR] Attempt ${attempt} failed: ${error.message}`);
        throw error;
      }
    }

    await sleep(intervalMs);
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

    // 6. Return scraped result to client
    return res.status(200).json({
      success: true,
      job_id: jobId,
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
      return res.status(540 || 504).json({
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

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.originalUrl} does not exist.` });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` PriceWatch AI Backend running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Scrape route:  POST http://localhost:${PORT}/api/scrape`);
  console.log(`==================================================`);
});
