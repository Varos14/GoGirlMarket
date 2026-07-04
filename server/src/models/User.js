const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'vendor', 'admin'], 
    default: 'customer' 
  },
  // Vendor specific fields
  storeName: { type: String },
  storeSlug: { type: String, unique: true, sparse: true },
  storeDescription: { type: String },
  tagline: { type: String },
  phone: { type: String },
  location: { type: String },
    isVendor: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      }
    ],
  isApproved: { type: Boolean, default: false }, // For vendors
  isVerified: { type: Boolean, default: false },
  commissionRate: { type: Number, default: 7 },
  socialLinks: {
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
  },
  
  // Wallet System (Escrow)
  wallet: {
    pendingBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
  },
  
  // Payout information (Flutterwave Splits)
  payout: {
    bankCode: { type: String }, // e.g. 'MTN', 'AIRTEL'
    accountNumber: { type: String },
    accountName: { type: String },
    flutterwaveSubaccountId: { type: String }
  },
  
  // Password Reset fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

const slugify = require('slugify');

// Password hashing and slug generation middleware
userSchema.pre('save', async function(next) {
  // Generate store slug if storeName is provided and storeSlug is missing or storeName modified
  if (this.role === 'vendor' && this.storeName && (!this.storeSlug || this.isModified('storeName'))) {
    this.storeSlug = slugify(this.storeName, { lower: true, strict: true }) + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
