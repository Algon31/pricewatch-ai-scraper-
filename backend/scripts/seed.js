/**
 * Database Seed & Cleanup Script for WebPulse / PriceWatch AI
 * 
 * Cleans duplicate test monitors and seeds a clean, intentional
 * portfolio of monitored Fujifilm cameras with complete price history,
 * snapshot timelines, and delta change events.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ProductMonitor = require('../models/ProductMonitor');
const PriceSnapshot = require('../models/PriceSnapshot');
const ChangeEvent = require('../models/ChangeEvent');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pricewatch';

async function seedDatabase() {
  console.log(`[SEED] Connecting to MongoDB: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('[SEED] Connected to MongoDB successfully.');

  // 1. Remove duplicate/test monitors & non-camera test products
  console.log('[SEED] Cleaning existing monitors, snapshots, change events, and test data...');
  
  // Wipe all old test monitors, snapshots, and events for a fresh, clean, intentional dataset
  await ProductMonitor.deleteMany({});
  await PriceSnapshot.deleteMany({});
  await ChangeEvent.deleteMany({});
  await Product.deleteMany({});

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  // Timestamps for realistic history progression
  const t0 = new Date(now.getTime() - 4 * dayMs); // 4 days ago
  const t1 = new Date(now.getTime() - 2 * dayMs); // 2 days ago
  const t2 = new Date(now.getTime() - 1 * dayMs); // 1 day ago
  const t3 = new Date(now.getTime() - 4 * hourMs); // 4 hours ago
  const tCurrent = now; // current

  // ==========================================
  // 2. SEED MONITOR 1: Fujifilm X-H2S (Flagship Speed)
  // ==========================================
  console.log('[SEED] Seeding Monitor 1: Fujifilm X-H2S...');

  const xh2sCompetitors = [
    {
      source: 'Amazon',
      url: 'https://www.amazon.in/Fujifilm-16756924-FUJIFILM-Mirrorless-Camera/dp/B0B2F5VHLM/ref=sr_1_2_sspa?sr=8-2-spons&aref=zL8zerqRtq&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1',
      productTitle: 'Fujifilm X-H2S Mirrorless Camera Body - Black',
      currentPrice: 197892,
      originalPrice: 239999,
      currency: 'INR',
      discount: '18% off',
      rating: 4.6,
      reviewCount: 58,
      availability: 'In stock',
      image: 'https://m.media-amazon.com/images/I/81dG2t6oT8L._SL1500_.jpg',
      sku: '16756924',
      jobId: 'bd_job_xh2s_amz_01',
      lastCheckedAt: tCurrent,
      lastError: null,
    },
    {
      source: 'Kamal Imaging',
      url: 'https://kamalimaging.com/products/fujifilm-x-h2s-mirrorless-camera?utm_pdp_clicked=9cd6b872-d863-4b82-867f-7a4048992bf6',
      productTitle: 'FUJIFILM X-H2S Mirrorless Camera',
      currentPrice: 192990,
      originalPrice: 239999,
      currency: 'INR',
      discount: '₹47,009 off',
      rating: 4.8,
      reviewCount: 24,
      availability: 'Special Offer: BC W-235 | Carry Case',
      image: 'https://kamalimaging.com/cdn/shop/files/FujifilmX-H2S_1.jpg',
      sku: 'KAM-XH2S-BLK',
      jobId: 'bd_job_xh2s_kam_01',
      lastCheckedAt: tCurrent,
      lastError: null,
    },
    {
      source: 'Fujifilm X India',
      url: 'https://fujifilmxindia.com/products/fujifilm-x-h2s-mirrorless?_pos=1&_psq=Fujifilm+X-H2S&_psid=f9700e959&_ss=e',
      productTitle: 'FUJIFILM X-H2s MIRRORLESS',
      currentPrice: 197999,
      originalPrice: 239999,
      currency: 'INR',
      discount: '₹42,000 off',
      rating: 5.0,
      reviewCount: 16,
      availability: 'In stock',
      image: 'https://fujifilmxindia.com/cdn/shop/files/XH2S_Front_1.png',
      sku: 'FXI-XH2S-BODY',
      jobId: 'bd_job_xh2s_fxi_01',
      lastCheckedAt: tCurrent,
      lastError: null,
    },
  ];

  const monitor1 = new ProductMonitor({
    name: 'Fujifilm X-H2S',
    brand: 'Fujifilm',
    competitorUrls: xh2sCompetitors,
    lowestPrice: 192990,
    highestPrice: 197999,
    priceDifference: 5009,
    cheapestSource: 'Kamal Imaging',
    lastCheckedAt: tCurrent,
  });
  await monitor1.save();

  // Historical price snapshots for Monitor 1
  const xh2sSnapshots = [
    // Baseline (4 days ago)
    { monitorId: monitor1._id, source: 'Amazon', url: xh2sCompetitors[0].url, price: 199990, originalPrice: 239999, availability: 'In stock', timestamp: t0 },
    { monitorId: monitor1._id, source: 'Kamal Imaging', url: xh2sCompetitors[1].url, price: 195990, originalPrice: 239999, availability: 'In stock', timestamp: t0 },
    { monitorId: monitor1._id, source: 'Fujifilm X India', url: xh2sCompetitors[2].url, price: 197999, originalPrice: 239999, availability: 'In stock', timestamp: t0 },

    // Shift 1 (2 days ago) - Amazon temporary promo
    { monitorId: monitor1._id, source: 'Amazon', url: xh2sCompetitors[0].url, price: 190000, originalPrice: 239999, availability: 'In stock', timestamp: t1 },
    { monitorId: monitor1._id, source: 'Kamal Imaging', url: xh2sCompetitors[1].url, price: 195990, originalPrice: 239999, availability: 'In stock', timestamp: t1 },
    { monitorId: monitor1._id, source: 'Fujifilm X India', url: xh2sCompetitors[2].url, price: 197999, originalPrice: 239999, availability: 'In stock', timestamp: t1 },

    // Shift 2 (1 day ago) - Kamal Imaging undercuts to ₹192,990
    { monitorId: monitor1._id, source: 'Amazon', url: xh2sCompetitors[0].url, price: 197892, originalPrice: 239999, availability: 'In stock', timestamp: t2 },
    { monitorId: monitor1._id, source: 'Kamal Imaging', url: xh2sCompetitors[1].url, price: 192990, originalPrice: 239999, availability: 'Special Offer: BC W-235 | Carry Case', timestamp: t2 },
    { monitorId: monitor1._id, source: 'Fujifilm X India', url: xh2sCompetitors[2].url, price: 197999, originalPrice: 239999, availability: 'In stock', timestamp: t2 },

    // Current check
    { monitorId: monitor1._id, source: 'Amazon', url: xh2sCompetitors[0].url, price: 197892, originalPrice: 239999, availability: 'In stock', timestamp: tCurrent },
    { monitorId: monitor1._id, source: 'Kamal Imaging', url: xh2sCompetitors[1].url, price: 192990, originalPrice: 239999, availability: 'Special Offer: BC W-235 | Carry Case', timestamp: tCurrent },
    { monitorId: monitor1._id, source: 'Fujifilm X India', url: xh2sCompetitors[2].url, price: 197999, originalPrice: 239999, availability: 'In stock', timestamp: tCurrent },
  ];
  await PriceSnapshot.insertMany(xh2sSnapshots);

  // Change events for Monitor 1
  const xh2sChangeEvents = [
    {
      monitorId: monitor1._id,
      type: 'NEW_LOWEST_PRICE',
      source: 'Kamal Imaging',
      previousPrice: 195990,
      currentPrice: 192990,
      difference: -3000,
      percentageChange: -1.53,
      previousAvailability: 'In stock',
      currentAvailability: 'Special Offer: BC W-235 | Carry Case',
      message: 'New lowest market price discovered at Kamal Imaging: ₹1,92,990',
      timestamp: t2,
    },
    {
      monitorId: monitor1._id,
      type: 'PRICE_DROP',
      source: 'Kamal Imaging',
      previousPrice: 195990,
      currentPrice: 192990,
      difference: -3000,
      percentageChange: -1.53,
      previousAvailability: 'In stock',
      currentAvailability: 'Special Offer: BC W-235 | Carry Case',
      message: 'Price dropped on Kamal Imaging by ₹3,000 (-1.53%)',
      timestamp: t2,
    },
    {
      monitorId: monitor1._id,
      type: 'PRICE_INCREASE',
      source: 'Amazon',
      previousPrice: 190000,
      currentPrice: 197892,
      difference: 7892,
      percentageChange: 4.15,
      previousAvailability: 'In stock',
      currentAvailability: 'In stock',
      message: 'Price increased on Amazon by ₹7,892 (+4.15%)',
      timestamp: t2,
    },
  ];
  await ChangeEvent.insertMany(xh2sChangeEvents);

  // ==========================================
  // 3. SEED MONITOR 2: Fujifilm X-M5 (Compact Hybrid)
  // ==========================================
  console.log('[SEED] Seeding Monitor 2: Fujifilm X-M5...');

  const xm5Competitors = [
    {
      source: 'Amazon',
      url: 'https://amzn.in/d/05nY9mcD',
      productTitle: 'Fujifilm X-M5 26.1MP APS-C X-Trans CMOS 4 with 15-45 f/3.5-5.6 Lens|Retro Style mirrorless Compact Travel Camera - Silver',
      currentPrice: 88000,
      originalPrice: 94999,
      currency: 'INR',
      discount: '7% off',
      rating: 4.8,
      reviewCount: 42,
      availability: 'In stock',
      image: 'https://m.media-amazon.com/images/I/71YyP9uK6YL._SL1500_.jpg',
      sku: 'B0DJFSGM6T',
      jobId: 'bd_job_xm5_amz_01',
      lastCheckedAt: tCurrent,
      lastError: null,
    },
    {
      source: 'Kamal Imaging',
      url: 'https://kamalimaging.com/products/fujifilm-x-m5-mirrorless-camera-with-xc-15-45mm-lens-silver',
      productTitle: 'FUJIFILM X-M5 Mirrorless Camera with XC 15-45mm Lens Silver',
      currentPrice: 89990,
      originalPrice: 94990,
      currency: 'INR',
      discount: '5% off',
      rating: 4.9,
      reviewCount: 18,
      availability: 'In stock',
      image: 'https://kamalimaging.com/cdn/shop/files/xm5_silver.jpg',
      sku: 'KAM-XM5-1545',
      jobId: 'bd_job_xm5_kam_01',
      lastCheckedAt: tCurrent,
      lastError: null,
    },
    {
      source: 'Fujifilm X India',
      url: 'https://fujifilmxindia.com/products/fujifilm-x-m5',
      productTitle: 'FUJIFILM X-M5 Mirrorless Digital Camera with XC 15-45mm Lens',
      currentPrice: 78000,
      originalPrice: 88000,
      currency: 'INR',
      discount: '11% off',
      rating: 5.0,
      reviewCount: 12,
      availability: 'In stock',
      image: 'https://fujifilmxindia.com/cdn/shop/files/XM5_Hero.png',
      sku: 'FXI-XM5-KIT',
      jobId: 'bd_job_xm5_fxi_01',
      lastCheckedAt: tCurrent,
      lastError: null,
    },
  ];

  const monitor2 = new ProductMonitor({
    name: 'Fujifilm X-M5',
    brand: 'Fujifilm',
    competitorUrls: xm5Competitors,
    lowestPrice: 78000,
    highestPrice: 89990,
    priceDifference: 11990,
    cheapestSource: 'Fujifilm X India',
    lastCheckedAt: tCurrent,
  });
  await monitor2.save();

  // Historical price snapshots for Monitor 2
  const xm5Snapshots = [
    // Baseline (4 days ago)
    { monitorId: monitor2._id, source: 'Amazon', url: xm5Competitors[0].url, price: 94999, originalPrice: 94999, availability: 'In stock', timestamp: t0 },
    { monitorId: monitor2._id, source: 'Kamal Imaging', url: xm5Competitors[1].url, price: 92990, originalPrice: 94990, availability: 'In stock', timestamp: t0 },
    { monitorId: monitor2._id, source: 'Fujifilm X India', url: xm5Competitors[2].url, price: 88000, originalPrice: 88000, availability: 'In stock', timestamp: t0 },

    // Shift 1 (2 days ago)
    { monitorId: monitor2._id, source: 'Amazon', url: xm5Competitors[0].url, price: 89999, originalPrice: 94999, availability: 'In stock', timestamp: t1 },
    { monitorId: monitor2._id, source: 'Kamal Imaging', url: xm5Competitors[1].url, price: 89990, originalPrice: 94990, availability: 'In stock', timestamp: t1 },
    { monitorId: monitor2._id, source: 'Fujifilm X India', url: xm5Competitors[2].url, price: 88000, originalPrice: 88000, availability: 'In stock', timestamp: t1 },

    // Shift 2 (1 day ago) - Official store direct discount to ₹78,000
    { monitorId: monitor2._id, source: 'Amazon', url: xm5Competitors[0].url, price: 88000, originalPrice: 94999, availability: 'In stock', timestamp: t2 },
    { monitorId: monitor2._id, source: 'Kamal Imaging', url: xm5Competitors[1].url, price: 89990, originalPrice: 94990, availability: 'In stock', timestamp: t2 },
    { monitorId: monitor2._id, source: 'Fujifilm X India', url: xm5Competitors[2].url, price: 78000, originalPrice: 88000, availability: 'In stock', timestamp: t2 },

    // Current check
    { monitorId: monitor2._id, source: 'Amazon', url: xm5Competitors[0].url, price: 88000, originalPrice: 94999, availability: 'In stock', timestamp: tCurrent },
    { monitorId: monitor2._id, source: 'Kamal Imaging', url: xm5Competitors[1].url, price: 89990, originalPrice: 94990, availability: 'In stock', timestamp: tCurrent },
    { monitorId: monitor2._id, source: 'Fujifilm X India', url: xm5Competitors[2].url, price: 78000, originalPrice: 88000, availability: 'In stock', timestamp: tCurrent },
  ];
  await PriceSnapshot.insertMany(xm5Snapshots);

  // Change events for Monitor 2
  const xm5ChangeEvents = [
    {
      monitorId: monitor2._id,
      type: 'NEW_LOWEST_PRICE',
      source: 'Fujifilm X India',
      previousPrice: 88000,
      currentPrice: 78000,
      difference: -10000,
      percentageChange: -11.36,
      previousAvailability: 'In stock',
      currentAvailability: 'In stock',
      message: 'New lowest market price discovered at Fujifilm X India: ₹78,000',
      timestamp: t2,
    },
    {
      monitorId: monitor2._id,
      type: 'PRICE_DROP',
      source: 'Fujifilm X India',
      previousPrice: 88000,
      currentPrice: 78000,
      difference: -10000,
      percentageChange: -11.36,
      previousAvailability: 'In stock',
      currentAvailability: 'In stock',
      message: 'Price dropped on Fujifilm X India by ₹10,000 (-11.36%)',
      timestamp: t2,
    },
    {
      monitorId: monitor2._id,
      type: 'PRICE_DROP',
      source: 'Amazon',
      previousPrice: 89999,
      currentPrice: 88000,
      difference: -1999,
      percentageChange: -2.22,
      previousAvailability: 'In stock',
      currentAvailability: 'In stock',
      message: 'Price dropped on Amazon by ₹1,999 (-2.22%)',
      timestamp: t2,
    },
  ];
  await ChangeEvent.insertMany(xm5ChangeEvents);

  // ==========================================
  // 4. SEED CLEAN PRODUCT CATALOG
  // ==========================================
  console.log('[SEED] Seeding clean Product catalog entries...');
  const productsToSeed = [
    ...xh2sCompetitors.map(c => ({
      ...c,
      brand: 'Fujifilm',
      productUrl: c.url,
      priceHistory: [
        { price: c.originalPrice, currency: 'INR', timestamp: t0 },
        { price: c.currentPrice, currency: 'INR', timestamp: tCurrent },
      ],
    })),
    ...xm5Competitors.map(c => ({
      ...c,
      brand: 'Fujifilm',
      productUrl: c.url,
      priceHistory: [
        { price: c.originalPrice, currency: 'INR', timestamp: t0 },
        { price: c.currentPrice, currency: 'INR', timestamp: tCurrent },
      ],
    })),
  ];
  await Product.insertMany(productsToSeed);

  console.log('====================================================');
  console.log('[SEED SUCCESS] Portfolio Cleaned and Initialized:');
  console.log(` - Monitors seeded: 2 (Fujifilm X-H2S & Fujifilm X-M5)`);
  console.log(` - Snapshots seeded: ${xh2sSnapshots.length + xm5Snapshots.length}`);
  console.log(` - Change Events seeded: ${xh2sChangeEvents.length + xm5ChangeEvents.length}`);
  console.log(` - Product catalog items seeded: ${productsToSeed.length}`);
  console.log('====================================================');

  await mongoose.disconnect();
  console.log('[SEED] Database connection closed.');
}

seedDatabase().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
