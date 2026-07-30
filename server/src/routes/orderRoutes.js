const express = require('express');
const router = express.Router();
const { 
  addOrderItems, 
  getOrderById,
  updateOrderToPaid,
  getMyOrders, 
  getOrders, 
  getVendorOrders, 
  updateOrderToDelivered,
  getDashboardStats,
  updateOrderStatus,
  processPesapalPayment,
  handlePesapalIPN,
  verifyPesapalPayment,
  cancelOrder,
  raiseOrderDispute,
  resolveOrderDispute,
  getDisputedOrders,
} = require('../controllers/orderController');
const { protect, admin, vendor } = require('../middleware/authMiddleware');

// Pesapal IPN Webhook Endpoint (Public, supports GET & POST)
router.route('/pesapal-ipn')
  .get(handlePesapalIPN)
  .post(handlePesapalIPN);

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);
  
router.get('/stats', protect, admin, getDashboardStats);
router.get('/myorders', protect, getMyOrders);
router.get('/vendor', protect, vendor, getVendorOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/pesapal').post(protect, processPesapalPayment);
router.route('/verify-pesapal/:orderTrackingId').get(protect, verifyPesapalPayment);
router.put('/:id/deliver', protect, updateOrderToDelivered);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/dispute', protect, raiseOrderDispute);
router.put('/:id/dispute/resolve', protect, admin, resolveOrderDispute);
router.get('/disputes/all', protect, admin, getDisputedOrders);

module.exports = router;

