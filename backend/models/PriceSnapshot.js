const mongoose = require('mongoose');

const priceSnapshotSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductMonitor',
      required: true,
      index: true,
    },
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
    price: {
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
    availability: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find historical snapshots for a monitor's source in chronological order
priceSnapshotSchema.index({ monitorId: 1, source: 1, timestamp: -1 });

module.exports = mongoose.model('PriceSnapshot', priceSnapshotSchema);
