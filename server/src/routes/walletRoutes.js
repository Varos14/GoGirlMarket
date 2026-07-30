const express = require('express');
const router = express.Router();
const { getWalletDetails, topUpWallet, handleTopUpIPN, getPayableVendors, executeBulkPayout } = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWalletDetails);

router.route('/topup')
  .post(protect, topUpWallet);

router.route('/topup-ipn')
  .get(handleTopUpIPN)
  .post(handleTopUpIPN);

// Admin Routes for Bulk Payouts
router.route('/payable-vendors')
  .get(protect, admin, getPayableVendors);

router.route('/bulk-payout')
  .post(protect, admin, executeBulkPayout);

module.exports = router;
