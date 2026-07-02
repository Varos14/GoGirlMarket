const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    // Required only if type is 'credit_pending' or 'refund'
  },
  type: {
    type: String,
    enum: ['credit_pending', 'cleared', 'withdrawal', 'refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  description: {
    type: String,
    required: true,
  },
  clearanceDate: {
    type: Date,
    // E.g. Date.now() + 3 days for credit_pending
  }
}, {
  timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
