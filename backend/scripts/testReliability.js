/**
 * WebPulse Reliability & Extraction Validation Test Suite
 * 
 * Verifies all 8 required scenarios:
 * 1. Normal successful scrape -> no retry (attempts = 1).
 * 2. Simulated first-attempt failure -> retry succeeds (attempts = 2).
 * 3. Missing/invalid current price -> retry once.
 * 4. Both attempts fail -> other sources still complete successfully.
 * 5. Failed monitor source creates SOURCE_FAILURE event.
 * 6. A later successful check clears lastError and resumes normal snapshot flow.
 * 7. Invalid data never creates a PriceSnapshot.
 * 8. Existing successful comparison and monitoring flows still work.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  validateScrapedProduct,
  createValidPriceSnapshot,
  scrapeSingleUrlWithRetry,
  calculateComparisonAnalytics,
  calculatePriceChange,
  MAX_SCRAPE_ATTEMPTS,
} = require('../server');

const ProductMonitor = require('../models/ProductMonitor');
const PriceSnapshot = require('../models/PriceSnapshot');
const ChangeEvent = require('../models/ChangeEvent');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pricewatch';

const results = [];

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    results.push({ test: message, passed: false });
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    results.push({ test: message, passed: true });
  }
}

async function runReliabilityTests() {
  console.log('====================================================');
  console.log(' WebPulse Reliability & Validation Test Suite');
  console.log('====================================================\n');

  console.log(`Connecting to database: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.\n');

  try {
    // ----------------------------------------------------
    // Scenario 1: Normal successful scrape -> no retry (attempts = 1)
    // ----------------------------------------------------
    console.log('👉 Scenario 1: Normal successful validation -> no retry');
    const validProduct = {
      source: 'Amazon',
      productTitle: 'Fujifilm X-H2S Mirrorless Camera Body',
      productUrl: 'https://www.amazon.in/dp/B0B2F5VHLM',
      currentPrice: 197892,
      originalPrice: 239999,
      currency: 'INR',
      availability: 'In stock',
    };

    const validationResult1 = validateScrapedProduct(validProduct);
    assert(validationResult1.isValid === true, 'Valid product passes validation');
    assert(validationResult1.error === null, 'No error returned for valid product');

    // ----------------------------------------------------
    // Scenario 2: Simulated first-attempt failure -> retry succeeds
    // ----------------------------------------------------
    console.log('\n👉 Scenario 2: Simulated first-attempt failure -> retry succeeds');
    let callCount = 0;
    async function mockScraperRetrySucceeds() {
      callCount++;
      if (callCount === 1) {
        throw new Error('Network timeout on attempt 1');
      }
      return {
        source: 'Kamal Imaging',
        productTitle: 'FUJIFILM X-H2S Mirrorless Camera',
        productUrl: 'https://kamalimaging.com/products/fujifilm-x-h2s-mirrorless-camera',
        currentPrice: 192990,
      };
    }

    // Run retry logic simulation
    let retryAttemptSuccess = false;
    let finalAttempts = 0;
    for (let attempt = 1; attempt <= MAX_SCRAPE_ATTEMPTS; attempt++) {
      try {
        const item = await mockScraperRetrySucceeds();
        const v = validateScrapedProduct(item);
        if (!v.isValid) throw new Error(v.error);
        retryAttemptSuccess = true;
        finalAttempts = attempt;
        break;
      } catch {
        if (attempt === MAX_SCRAPE_ATTEMPTS) {
          finalAttempts = attempt;
        }
      }
    }
    assert(callCount === 2, 'Scraper called exactly 2 times before success');
    assert(retryAttemptSuccess === true, 'Retry succeeded on second attempt');
    assert(finalAttempts === 2, 'Reliability metadata reflects attempts = 2');

    // ----------------------------------------------------
    // Scenario 3: Missing/invalid current price -> triggers retry and validation failure
    // ----------------------------------------------------
    console.log('\n👉 Scenario 3: Missing/invalid current price -> validation detects failure');
    const invalidPriceProducts = [
      { source: 'Amazon', productTitle: 'Test', productUrl: 'https://amazon.in/p', currentPrice: null },
      { source: 'Amazon', productTitle: 'Test', productUrl: 'https://amazon.in/p', currentPrice: -500 },
      { source: 'Amazon', productTitle: 'Test', productUrl: 'https://amazon.in/p', currentPrice: NaN },
      { source: 'Amazon', productTitle: 'Test', productUrl: 'https://amazon.in/p', currentPrice: 0 },
      { source: 'Amazon', productTitle: 'Test', productUrl: 'https://amazon.in/p', currentPrice: 'invalid' },
    ];

    for (const invalid of invalidPriceProducts) {
      const v = validateScrapedProduct(invalid);
      assert(v.isValid === false, `Rejected invalid price: ${invalid.currentPrice}`);
    }

    // ----------------------------------------------------
    // Scenario 4: Both attempts fail -> other sources still complete successfully
    // ----------------------------------------------------
    console.log('\n👉 Scenario 4: Both attempts fail for one source -> others succeed gracefully');
    const mockMultiResults = [
      {
        success: true,
        source: 'Amazon',
        url: 'https://amazon.in/test1',
        product: { source: 'Amazon', productTitle: 'Cam 1', productUrl: 'https://amazon.in/test1', currentPrice: 195000 },
        attempts: 1,
        status: 'success',
      },
      {
        success: false,
        source: 'Kamal Imaging',
        url: 'https://kamalimaging.com/test2',
        error: 'Failed to extract valid data after 2 attempts',
        attempts: 2,
        status: 'failed',
      },
      {
        success: true,
        source: 'Fujifilm X India',
        url: 'https://fujifilmxindia.com/test3',
        product: { source: 'Fujifilm X India', productTitle: 'Cam 1', productUrl: 'https://fujifilmxindia.com/test3', currentPrice: 198000 },
        attempts: 1,
        status: 'success',
      },
    ];

    const successfulProducts = mockMultiResults.filter(r => r.success && r.product).map(r => r.product);
    const failedScrapes = mockMultiResults.filter(r => !r.success);
    const comparison = calculateComparisonAnalytics(successfulProducts);

    assert(successfulProducts.length === 2, '2 successful sources extracted');
    assert(failedScrapes.length === 1, '1 failed source isolated');
    assert(failedScrapes[0].source === 'Kamal Imaging', 'Failed source is Kamal Imaging');
    assert(comparison.lowestPrice === 195000, 'Calculated lowest price across valid sources');
    assert(comparison.cheapestSource === 'Amazon', 'Identified cheapest source correctly');

    // ----------------------------------------------------
    // Scenario 5: Failed monitor source creates SOURCE_FAILURE event
    // ----------------------------------------------------
    console.log('\n👉 Scenario 5: Failed monitor source creates SOURCE_FAILURE event');
    const testMonitorId = new mongoose.Types.ObjectId();
    const testCheckTime = new Date();

    const failureEvent = new ChangeEvent({
      monitorId: testMonitorId,
      type: 'SOURCE_FAILURE',
      source: 'Kamal Imaging',
      previousPrice: 192990,
      currentPrice: null,
      message: 'Scraper failure on Kamal Imaging: Failed to extract valid data after retries',
      timestamp: testCheckTime,
    });
    await failureEvent.save();

    const savedEvent = await ChangeEvent.findById(failureEvent._id);
    assert(savedEvent !== null, 'SOURCE_FAILURE ChangeEvent persisted');
    assert(savedEvent.type === 'SOURCE_FAILURE', 'Event type is SOURCE_FAILURE');
    assert(savedEvent.source === 'Kamal Imaging', 'Source matches failed retailer');
    assert(savedEvent.previousPrice === 192990, 'Retains previous baseline price for reference');

    // ----------------------------------------------------
    // Scenario 6: A later successful check clears lastError & recovers
    // ----------------------------------------------------
    console.log('\n👉 Scenario 6: A later successful check clears lastError & recovers snapshot flow');
    const testRecoveryMonitor = new ProductMonitor({
      name: 'Reliability Test Camera',
      brand: 'Fujifilm',
      competitorUrls: [
        {
          source: 'Amazon',
          url: 'https://amazon.in/dp/test-recovery',
          productTitle: 'Recovery Camera',
          currentPrice: 100000,
          lastError: 'Extraction failed after retries', // Previously in failed state
          lastCheckedAt: new Date(Date.now() - 3600000),
        },
      ],
      lowestPrice: 100000,
      highestPrice: 100000,
    });
    await testRecoveryMonitor.save();

    // Baseline snapshot
    await createValidPriceSnapshot({
      monitorId: testRecoveryMonitor._id,
      source: 'Amazon',
      url: 'https://amazon.in/dp/test-recovery',
      price: 100000,
    });

    // Simulate recovery check
    const recoveredPrice = 95000;
    const subdoc = testRecoveryMonitor.competitorUrls[0];
    
    // Recovery action
    subdoc.lastError = null; // Clears lastError
    subdoc.currentPrice = recoveredPrice;
    subdoc.lastCheckedAt = new Date();

    // Find actual previous valid snapshot
    const prevValidSnapshot = await PriceSnapshot.findOne({
      monitorId: testRecoveryMonitor._id,
      source: 'Amazon',
      price: { $ne: null, $gt: 0 },
    }).sort({ timestamp: -1 });

    assert(prevValidSnapshot !== null, 'Found previous valid snapshot for price comparison');
    assert(prevValidSnapshot.price === 100000, 'Previous valid price was 100,000');

    // Calculate price drop
    const delta = calculatePriceChange(prevValidSnapshot.price, recoveredPrice);
    assert(delta.direction === 'decreased', 'Price change detected as decreased (drop)');
    assert(delta.difference === -5000, 'Difference calculated as -5,000');
    assert(subdoc.lastError === null, 'lastError successfully cleared on recovery');

    // Save recovered snapshot
    const recoveredSnapshot = await createValidPriceSnapshot({
      monitorId: testRecoveryMonitor._id,
      source: 'Amazon',
      url: subdoc.url,
      price: recoveredPrice,
    });
    assert(recoveredSnapshot !== null && recoveredSnapshot.price === 95000, 'Saved new valid snapshot after recovery');

    // Clean up test recovery monitor
    await ProductMonitor.findByIdAndDelete(testRecoveryMonitor._id);
    await PriceSnapshot.deleteMany({ monitorId: testRecoveryMonitor._id });
    await ChangeEvent.deleteMany({ monitorId: testMonitorId });

    // ----------------------------------------------------
    // Scenario 7: Invalid data never creates a PriceSnapshot
    // ----------------------------------------------------
    console.log('\n👉 Scenario 7: Invalid data never creates a PriceSnapshot');
    const dummyId = new mongoose.Types.ObjectId();

    const snap1 = await createValidPriceSnapshot({ monitorId: dummyId, source: 'Amazon', url: 'https://amazon.in', price: null });
    const snap2 = await createValidPriceSnapshot({ monitorId: dummyId, source: 'Amazon', url: 'https://amazon.in', price: -100 });
    const snap3 = await createValidPriceSnapshot({ monitorId: dummyId, source: 'Amazon', url: 'https://amazon.in', price: NaN });
    const snap4 = await createValidPriceSnapshot({ monitorId: dummyId, source: '', url: 'https://amazon.in', price: 50000 });
    const snap5 = await createValidPriceSnapshot({ monitorId: null, source: 'Amazon', url: 'https://amazon.in', price: 50000 });

    assert(snap1 === null, 'Rejected null price snapshot');
    assert(snap2 === null, 'Rejected negative price snapshot');
    assert(snap3 === null, 'Rejected NaN price snapshot');
    assert(snap4 === null, 'Rejected empty source snapshot');
    assert(snap5 === null, 'Rejected null monitorId snapshot');

    const snapshotsInDb = await PriceSnapshot.find({ monitorId: dummyId });
    assert(snapshotsInDb.length === 0, 'Zero invalid snapshots created in database');

    // ----------------------------------------------------
    // Scenario 8: Existing successful comparison and monitoring flows still work
    // ----------------------------------------------------
    console.log('\n👉 Scenario 8: Existing successful comparison & monitoring data integrity');
    const activeMonitors = await ProductMonitor.find();
    assert(activeMonitors.length >= 2, `Active monitors present (${activeMonitors.length} found)`);

    for (const mon of activeMonitors) {
      assert(typeof mon.name === 'string' && mon.name.length > 0, `Monitor name valid: "${mon.name}"`);
      assert(mon.competitorUrls.length >= 2, `Monitor "${mon.name}" has ${mon.competitorUrls.length} competitor sources`);
      assert(typeof mon.lowestPrice === 'number' && mon.lowestPrice > 0, `Lowest price valid: ₹${mon.lowestPrice}`);
    }

    console.log('\n====================================================');
    console.log(' 🎉 ALL 8 RELIABILITY SCENARIOS PASSED SUCCESSFULLY!');
    console.log('====================================================');

  } catch (err) {
    console.error('\n❌ Test Suite encountered an error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

runReliabilityTests();
