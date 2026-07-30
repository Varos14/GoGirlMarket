const express = require('express');
const router = express.Router();
const {
  getMySubscription,
  updateSubscription,
  payForProSubscription,
  pesapalIPNWebhook,
} = require('../controllers/subscriptionController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.route('/my-subscription').get(protect, vendor, getMySubscription);
router.route('/update').put(protect, vendor, updateSubscription);
router.route('/pay-pro').post(protect, vendor, payForProSubscription);

// IPN is public so Pesapal can hit it without an auth token
router.route('/pesapal-ipn').get(pesapalIPNWebhook).post(pesapalIPNWebhook);

module.exports = router;
