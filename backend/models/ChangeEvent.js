const mongoose = require('mongoose');

const changeEventSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductMonitor',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PRICE_DROP', 'PRICE_INCREASE', 'AVAILABILITY_CHANGE', 'NEW_LOWEST_PRICE', 'SOURCE_FAILURE'],
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    previousPrice: {
      type: Number,
      default: null,
    },
    currentPrice: {
      type: Number,
      default: null,
    },
    difference: {
      type: Number,
      default: null,
    },
    percentageChange: {
      type: Number,
      default: null,
    },
    previousAvailability: {
      type: String,
      default: null,
    },
    currentAvailability: {
      type: String,
      default: null,
    },
    message: {
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

changeEventSchema.index({ monitorId: 1, timestamp: -1 });

module.exports = mongoose.model('ChangeEvent', changeEventSchema);
