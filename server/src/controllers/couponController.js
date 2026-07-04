const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Vendor
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, isActive, usageLimit, minOrderAmount, maxDiscountAmount, applicableProducts } = req.body;
    
    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      vendor: req.user._id,
      discountType,
      discountValue,
      expiryDate,
      isActive,
      usageLimit: usageLimit || 1,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || 0,
      applicableProducts: applicableProducts || []
    });

    const createdCoupon = await coupon.save();
    
    // Populate applicableProducts for the response
    await createdCoupon.populate('applicableProducts', 'name price');
    
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update an existing coupon (code is immutable)
// @route   PUT /api/coupons/:id
// @access  Private/Vendor
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Ensure the vendor owns the coupon
    if (coupon.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this coupon' });
    }

    const { discountType, discountValue, expiryDate, usageLimit, minOrderAmount, maxDiscountAmount, applicableProducts } = req.body;

    // Update fields (code is immutable)
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (applicableProducts !== undefined) coupon.applicableProducts = applicableProducts;

    const updatedCoupon = await coupon.save();
    await updatedCoupon.populate('applicableProducts', 'name price');

    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Toggle coupon active status
// @route   PUT /api/coupons/:id/toggle
// @access  Private/Vendor
const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Ensure the vendor owns the coupon
    if (coupon.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    coupon.isActive = !coupon.isActive;
    const updatedCoupon = await coupon.save();

    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all coupons for a vendor
// @route   GET /api/coupons/vendor
// @access  Private/Vendor
const getVendorCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ vendor: req.user._id })
      .populate('applicableProducts', 'name price')
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Vendor
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    // Ensure the vendor owns the coupon
    if (coupon.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this coupon' });
    }

    await Coupon.deleteOne({ _id: coupon._id });
    res.json({ message: 'Coupon removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Validate a coupon code (Protected - need user ID for per-user limit check)
// @route   GET /api/coupons/validate/:code
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const coupon = await Coupon.findOne({ code }).populate('applicableProducts', 'name price');

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Check per-user usage limit
    const userId = req.user._id.toString();
    const userUsage = coupon.usedBy.find(u => u.user.toString() === userId);
    if (userUsage && userUsage.count >= coupon.usageLimit) {
      return res.status(400).json({ message: `You have already used this coupon ${coupon.usageLimit} time(s)` });
    }

    res.json({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      vendor: coupon.vendor,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      applicableProducts: coupon.applicableProducts.map(p => p._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Record coupon usage after order is placed
// @param   couponId - The coupon's ObjectId
// @param   userId - The user's ObjectId
// @param   discountAmount - The UGX discount applied
const recordCouponUsage = async (couponId, userId, discountAmount) => {
  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return;

    // Update or add user in usedBy array
    const userIdStr = userId.toString();
    const existingUsage = coupon.usedBy.find(u => u.user.toString() === userIdStr);
    if (existingUsage) {
      existingUsage.count += 1;
    } else {
      coupon.usedBy.push({ user: userId, count: 1 });
    }

    // Update aggregate analytics
    coupon.totalTimesUsed += 1;
    coupon.totalDiscountGiven += discountAmount;

    await coupon.save();
  } catch (error) {
    console.error('Error recording coupon usage:', error);
  }
};

// @desc    Get coupon analytics (usage stats + orders that used this code)
// @route   GET /api/coupons/:id/analytics
// @access  Private/Vendor
const getCouponAnalytics = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Ensure the vendor owns the coupon
    if (coupon.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find orders that used this coupon code for this vendor
    const orders = await Order.find({
      'vendorOrders.couponCode': coupon.code,
      'vendorOrders.vendor': req.user._id
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Extract relevant order data
    const orderDetails = orders.map(order => {
      const vendorOrder = order.vendorOrders.find(
        vo => vo.vendor.toString() === req.user._id.toString() && vo.couponCode === coupon.code
      );
      return {
        orderId: order._id,
        customerName: order.user?.name || 'Unknown',
        customerEmail: order.user?.email || '',
        date: order.createdAt,
        discountAmount: vendorOrder?.discountAmount || 0,
        isPaid: order.isPaid
      };
    });

    res.json({
      couponId: coupon._id,
      code: coupon.code,
      totalTimesUsed: coupon.totalTimesUsed,
      totalDiscountGiven: coupon.totalDiscountGiven,
      orders: orderDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createCoupon,
  updateCoupon,
  toggleCoupon,
  getVendorCoupons,
  deleteCoupon,
  validateCoupon,
  recordCouponUsage,
  getCouponAnalytics
};
