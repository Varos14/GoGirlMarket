const express = require('express');
const router = express.Router();
const { getVendorAnalytics } = require('../controllers/analyticsController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, vendor, getVendorAnalytics);

module.exports = router;
