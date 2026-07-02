const express = require('express');
const router = express.Router();
const { getWalletDetails, requestWithdrawal } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWalletDetails);

router.route('/withdraw')
  .post(protect, requestWithdrawal);

module.exports = router;
