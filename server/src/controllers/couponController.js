const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Vendor
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, isActive } = req.body;
    
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
      isActive
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all coupons for a vendor
// @route   GET /api/coupons/vendor
// @access  Private/Vendor
const getVendorCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ vendor: req.user._id }).sort({ createdAt: -1 });
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

// @desc    Validate a coupon code (Public / Customer facing)
// @route   GET /api/coupons/validate/:code
// @access  Public
const validateCoupon = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    res.json({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      vendor: coupon.vendor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createCoupon,
  getVendorCoupons,
  deleteCoupon,
  validateCoupon
};
