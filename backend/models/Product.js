const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    productUrl: {
      type: String,
      required: [true, 'Product URL is required'],
      unique: true,
      trim: true,
      index: true,
    },
    productTitle: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    currentPrice: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    originalPrice: {
      type: Number,
      default: null,
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
    priceHistory: [priceHistorySchema],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('Product', productSchema);
