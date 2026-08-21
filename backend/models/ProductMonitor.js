const mongoose = require('mongoose');

const competitorUrlSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    productTitle: {
      type: String,
      trim: true,
      default: '',
    },
    currentPrice: {
      type: Number,
      default: null,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    discount: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      default: null,
    },
    reviewCount: {
      type: Number,
      default: null,
    },
    availability: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    jobId: {
      type: String,
      trim: true,
      default: '',
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
    lastError: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

const productMonitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Monitor name is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    competitorUrls: [competitorUrlSchema],
    lowestPrice: {
      type: Number,
      default: null,
    },
    highestPrice: {
      type: Number,
      default: null,
    },
    priceDifference: {
      type: Number,
      default: null,
    },
    cheapestSource: {
      type: String,
      trim: true,
      default: '',
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProductMonitor', productMonitorSchema);
