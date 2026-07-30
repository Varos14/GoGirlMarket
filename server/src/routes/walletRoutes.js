const express = require('express');
const router = express.Router();
const { getWalletDetails, requestWithdrawal, topUpWallet, handleTopUpIPN, getPendingWithdrawals, approveWithdrawal } = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWalletDetails);

router.route('/withdraw')
  .post(protect, requestWithdrawal);

router.route('/topup')
  .post(protect, topUpWallet);

router.route('/topup-ipn')
  .get(handleTopUpIPN)
  .post(handleTopUpIPN);

// Admin Routes
router.route('/withdrawals')
  .get(protect, admin, getPendingWithdrawals);

router.route('/withdrawals/:id/approve')
  .put(protect, admin, approveWithdrawal);

module.exports = router;
