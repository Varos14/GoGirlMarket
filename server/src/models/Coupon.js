const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  discountType: { 
    type: String, 
    required: true, 
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: { 
    type: Number, 
    required: true 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Per-user usage limit (e.g., 1 = each customer can use this code once)
  usageLimit: {
    type: Number,
    default: 1
  },
  // Tracks which users used the coupon and how many times
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number, default: 1 }
  }],
  // Aggregate analytics counters
  totalTimesUsed: {
    type: Number,
    default: 0
  },
  totalDiscountGiven: {
    type: Number,
    default: 0
  },
  // Optional minimum order threshold in UGX (0 = no minimum)
  minOrderAmount: {
    type: Number,
    default: 0
  },
  // Optional max discount cap for percentage coupons in UGX (0 = no cap)
  maxDiscountAmount: {
    type: Number,
    default: 0
  },
  // Optional product-level scoping (empty = applies to all vendor products)
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Coupon', couponSchema);
