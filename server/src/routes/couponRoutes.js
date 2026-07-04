const express = require('express');
const router = express.Router();
const { createCoupon, updateCoupon, toggleCoupon, getVendorCoupons, deleteCoupon, validateCoupon, getCouponAnalytics } = require('../controllers/couponController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, vendor, createCoupon);

router.route('/vendor')
  .get(protect, vendor, getVendorCoupons);

router.route('/:id')
  .put(protect, vendor, updateCoupon)
  .delete(protect, vendor, deleteCoupon);

router.route('/:id/toggle')
  .put(protect, vendor, toggleCoupon);

router.route('/:id/analytics')
  .get(protect, vendor, getCouponAnalytics);

router.route('/validate/:code')
  .get(protect, validateCoupon); // Protected — need user ID for per-user limit check

module.exports = router;
