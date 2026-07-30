const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { initiateTransfer } = require('../utils/payoutService');

// @desc    Get vendor wallet details and transactions (Dynamically clears funds)
// @route   GET /api/wallet
// @access  Private/Vendor
const getWalletDetails = async (req, res) => {
  try {
    const vendorId = req.user._id;
    let vendor = await User.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!vendor.wallet) {
      vendor.wallet = { pendingBalance: 0, availableBalance: 0 };
    }

    // 1. DYNAMIC CLEARING
    // Find all 'credit_pending' transactions past their clearance date
    const matureTransactions = await Transaction.find({
      user: vendorId,
      type: 'credit_pending',
      status: 'pending',
      clearanceDate: { $lte: new Date() }
    });

    if (matureTransactions.length > 0) {
      let amountToClear = 0;

      for (const tx of matureTransactions) {
        amountToClear += tx.amount;
        // Mark the pending transaction as completed
        tx.status = 'completed';
        tx.description += ' (Cleared)';
        await tx.save();

        // Optionally, create a new 'cleared' transaction for the ledger to be explicit
        await Transaction.create({
          user: vendorId,
          order: tx.order,
          type: 'cleared',
          amount: tx.amount,
          status: 'completed',
          description: `Funds Cleared for Order #${tx.order}`
        });
      }

      // Update wallet balances
      vendor.wallet.pendingBalance -= amountToClear;
      if (vendor.wallet.pendingBalance < 0) vendor.wallet.pendingBalance = 0;
      
      vendor.wallet.availableBalance += amountToClear;
      await vendor.save();
      
      console.log(`[WALLET] Cleared UGX ${amountToClear} for vendor ${vendor.name}`);
    }

    // 2. Fetch all transactions for the ledger statement
    const transactions = await Transaction.find({ user: vendorId }).sort({ createdAt: -1 });

    res.json({
      wallet: vendor.wallet,
      transactions
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all vendors with a positive available balance (Admin)
// @route   GET /api/wallet/payable-vendors
// @access  Private/Admin
const getPayableVendors = async (req, res) => {
  try {
    const vendors = await User.find({ 'wallet.availableBalance': { $gt: 0 } })
      .select('name email phone storeName wallet payout');
    
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Execute Bulk Payout for all payable vendors (Admin)
// @route   POST /api/wallet/bulk-payout
// @access  Private/Admin
const executeBulkPayout = async (req, res) => {
  try {
    const vendors = await User.find({ 'wallet.availableBalance': { $gt: 0 } });
    
    if (vendors.length === 0) {
      return res.status(400).json({ message: 'No vendors have an available balance to pay out.' });
    }

    let payoutCount = 0;
    let totalPaid = 0;
    const sendEmail = require('../utils/sendEmail');

    for (const vendor of vendors) {
      const amount = vendor.wallet.availableBalance;
      
      // In a real production environment, you would call Pesapal/Flutterwave B2C API here.
      // e.g. await initiateTransfer({ ... })
      
      // 1. Deduct from available balance
      vendor.wallet.availableBalance = 0;
      await vendor.save();

      // 2. Create payout transaction
      await Transaction.create({
        user: vendor._id,
        type: 'payout_completed',
        amount: amount,
        status: 'completed',
        description: 'Automated Weekly Bulk Payout'
      });
      
      // 3. Notify vendor
      if (vendor.email) {
        sendEmail({
          to: vendor.email,
          subject: `Payout Processed - UGX ${amount.toLocaleString()}`,
          html: `<h1>You've been paid!</h1><p>Hi ${vendor.name}, we have successfully processed your weekly payout of UGX ${amount.toLocaleString()}. The funds should reflect in your registered account shortly.</p>`
        });
      }

      payoutCount++;
      totalPaid += amount;
    }

    res.status(200).json({ 
      message: `Successfully processed ${payoutCount} payouts totaling UGX ${totalPaid.toLocaleString()}`,
      payoutCount,
      totalPaid
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Initiate Wallet Top-Up via Pesapal
// @route   POST /api/wallet/topup
// @access  Private
const topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1000) return res.status(400).json({ message: 'Minimum top-up is UGX 1000' });

    const pesapalUtils = require('../utils/pesapalUtils');
    
    // Auto-register IPN for top-ups if needed
    let ipnId = process.env.PESAPAL_TOPUP_IPN_ID;
    if (!ipnId) {
      try {
        const backendDomain = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const ipnRes = await pesapalUtils.registerPesapalIPN(`${backendDomain}/api/wallet/topup-ipn`);
        ipnId = ipnRes?.ipn_id;
      } catch (e) {
        console.warn('IPN registration failed, proceeding anyway:', e.message);
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const callbackUrl = `${frontendUrl}/wallet`;

    const nameParts = (req.user.name || 'User').split(' ');
    
    // Create a pending transaction for the top-up
    const tx = await Transaction.create({
      user: req.user._id,
      type: 'wallet_topup',
      amount: amount,
      status: 'pending',
      description: 'Wallet Top-Up via Pesapal'
    });

    const pesapalPayload = {
      id: `${tx._id}`, // Using Transaction ID as reference
      currency: 'UGX',
      amount: amount,
      description: `Wallet Top-Up for ${req.user.name}`,
      callback_url: callbackUrl,
      notification_id: ipnId || '',
      billing_address: {
        email_address: req.user.email || 'user@example.com',
        phone_number: req.user.phone || '',
        country_code: 'UG',
        first_name: nameParts[0] || 'User',
        middle_name: '',
        last_name: nameParts.slice(1).join(' ') || 'User',
        line_1: '', line_2: '', city: '', state: '', postal_code: '', zip_code: ''
      }
    };

    const pesapalResponse = await pesapalUtils.createPesapalOrder(pesapalPayload);

    if (pesapalResponse && pesapalResponse.redirect_url) {
      res.json({ redirect_url: pesapalResponse.redirect_url });
    } else {
      res.status(400).json({ message: 'Failed to generate Pesapal payment link' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Handle Pesapal IPN for Top-Up
// @route   GET /api/wallet/topup-ipn or POST /api/wallet/topup-ipn
// @access  Public
const handleTopUpIPN = async (req, res) => {
  try {
    const pesapalUtils = require('../utils/pesapalUtils');
    const orderTrackingId = req.query.OrderTrackingId || req.body.OrderTrackingId;
    const merchantReference = req.query.OrderMerchantReference || req.body.OrderMerchantReference; // Transaction ID

    if (!orderTrackingId || !merchantReference) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const statusData = await pesapalUtils.getPesapalTransactionStatus(orderTrackingId);
    
    if (statusData.payment_status_description === 'Completed') {
      const tx = await Transaction.findById(merchantReference);
      
      if (tx && tx.status !== 'completed') {
        tx.status = 'completed';
        await tx.save();

        const user = await User.findById(tx.user);
        if (user) {
          if (!user.wallet) user.wallet = { pendingBalance: 0, availableBalance: 0 };
          user.wallet.availableBalance += tx.amount;
          await user.save();
          console.log(`[WALLET TOPUP] Added UGX ${tx.amount} to ${user.name}`);
        }
      }
    }
    
    res.json({ status: 200, message: "IPN Received" });
  } catch (error) {
    console.error('Pesapal IPN Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getWalletDetails,
  topUpWallet,
  handleTopUpIPN,
  getPayableVendors,
  executeBulkPayout
};
