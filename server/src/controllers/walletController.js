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
      vendor: vendorId,
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
          vendor: vendorId,
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
    const transactions = await Transaction.find({ vendor: vendorId }).sort({ createdAt: -1 });

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
      vendor: vendorId,
      type: 'withdrawal',
      amount: amount,
      status: 'completed', // Transfer initiated successfully
      description: `Withdrawal via Flutterwave to ${bankToUse} (${numberToUse})`
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

module.exports = {
  getWalletDetails,
  requestWithdrawal
};
