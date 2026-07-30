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

// @desc    Request a withdrawal (Automated via Flutterwave)
// @route   POST /api/wallet/withdraw
// @access  Private/Vendor
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, account_bank, account_number } = req.body;
    const vendorId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    const vendor = await User.findById(vendorId);

    if (!vendor.wallet || vendor.wallet.availableBalance < amount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    // Optional: Update the vendor's saved payout details if provided
    if (account_bank && account_number) {
      vendor.payout = {
        ...vendor.payout,
        bankCode: account_bank,
        accountNumber: account_number
      };
    }

    const bankToUse = account_bank || vendor.payout?.bankCode;
    const numberToUse = account_number || vendor.payout?.accountNumber;

    if (!bankToUse || !numberToUse) {
      return res.status(400).json({ message: 'Payout account details missing. Please provide bank and account number.' });
    }

    // 1. Call Flutterwave to initiate transfer
    const reference = `WD_${Date.now()}_${vendorId.toString().substring(0,6)}`;
    
    // If FLUTTERWAVE_SECRET_KEY is missing, we'll just mock success for local dev, 
    // but in prod initiateTransfer handles it.
    if (process.env.FLUTTERWAVE_SECRET_KEY) {
      await initiateTransfer({
        account_bank: bankToUse,
        account_number: numberToUse,
        amount,
        reference
      });
    } else {
      console.warn("FLUTTERWAVE_SECRET_KEY missing. Mocking transfer success.");
    }

    // 2. Deduct from available balance
    vendor.wallet.availableBalance -= amount;
    await vendor.save();

    // 3. Create withdrawal transaction
    const withdrawalTx = await Transaction.create({
      user: vendorId,
      type: 'withdrawal_request',
      amount: amount,
      status: 'pending', // Pending Admin Approval
      description: `Withdrawal Request to ${bankToUse} (${numberToUse})`
    });

    console.log(`[WALLET] Withdrawal processed for UGX ${amount} by ${vendor.name}`);

    res.status(201).json({
      message: 'Withdrawal processed successfully',
      wallet: vendor.wallet,
      transaction: withdrawalTx
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
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

// @desc    Get all pending withdrawal requests (Admin)
// @route   GET /api/wallet/withdrawals
// @access  Private/Admin
const getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal_request', status: 'pending' })
      .populate('user', 'name email phone payout')
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Approve a manual withdrawal request (Admin)
// @route   PUT /api/wallet/withdrawals/:id/approve
// @access  Private/Admin
const approveWithdrawal = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate('user', 'name email');
    
    if (!tx || tx.type !== 'withdrawal_request') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (tx.status === 'completed') {
      return res.status(400).json({ message: 'Already marked as paid' });
    }

    tx.status = 'completed';
    tx.description += ' (Admin Approved & Paid)';
    await tx.save();

    // Send email to user
    const sendEmail = require('../utils/sendEmail');
    if (tx.user && tx.user.email) {
      sendEmail({
        to: tx.user.email,
        subject: `Withdrawal Approved - UGX ${tx.amount}`,
        html: `<h1>Withdrawal Successful!</h1><p>Hi ${tx.user.name}, your withdrawal request for UGX ${tx.amount} has been processed and sent to your account.</p>`
      });
    }

    res.json(tx);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getWalletDetails,
  requestWithdrawal,
  topUpWallet,
  handleTopUpIPN,
  getPendingWithdrawals,
  approveWithdrawal
};
