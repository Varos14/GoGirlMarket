const express = require('express');
const router = express.Router();
const { createCoupon, getVendorCoupons, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, vendor, createCoupon);

router.route('/vendor')
  .get(protect, vendor, getVendorCoupons);

router.route('/:id')
  .delete(protect, vendor, deleteCoupon);

router.route('/validate/:code')
  .get(validateCoupon); // Public

module.exports = router;
