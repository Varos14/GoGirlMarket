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

module.exports = {
  getWalletDetails,
  topUpWallet,
  handleTopUpIPN,
  getPayableVendors,
  executeBulkPayout
};
