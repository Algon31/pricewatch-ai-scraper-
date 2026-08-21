const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ProductMonitor = require('../models/ProductMonitor');
const PriceSnapshot = require('../models/PriceSnapshot');
const ChangeEvent = require('../models/ChangeEvent');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pricewatch';

async function testDatabase() {
  console.log('[TEST] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  const monitors = await ProductMonitor.find();
  console.log(`[TEST] Found ${monitors.length} active monitors:`);
  for (const m of monitors) {
    const snapshots = await PriceSnapshot.find({ monitorId: m._id });
    const events = await ChangeEvent.find({ monitorId: m._id });
    console.log(`  - Monitor: "${m.name}" | Brand: "${m.brand}" | Lowest: ₹${m.lowestPrice?.toLocaleString('en-IN')} (${m.cheapestSource}) | Competitors: ${m.competitorUrls.length} | Snapshots: ${snapshots.length} | ChangeEvents: ${events.length}`);
  }

  const products = await Product.find();
  console.log(`[TEST] Total tracked product catalog entries: ${products.length}`);
  for (const p of products) {
    console.log(`  - Product: [${p.source}] "${p.productTitle}" -> ₹${p.currentPrice?.toLocaleString('en-IN')}`);
  }

  await mongoose.disconnect();
  console.log('[TEST] All database checks passed successfully!');
}

testDatabase().catch((err) => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
