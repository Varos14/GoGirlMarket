const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, {
  timestamps: true,
});

const productSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  countInStock: { type: Number, required: true, default: 0 },
  images: [{ type: String, required: true }],
  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isSponsored: { type: Boolean, default: false },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
