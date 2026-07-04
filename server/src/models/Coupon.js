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
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Coupon', couponSchema);
