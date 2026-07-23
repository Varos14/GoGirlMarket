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
  processFlutterwavePayment,
  updateOrderStatus,
  processPesapalPayment,
  handlePesapalIPN,
  verifyPesapalPayment
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
router.route('/:id/flutterwave').post(protect, processFlutterwavePayment);
router.route('/:id/pesapal').post(protect, processPesapalPayment);
router.route('/verify-pesapal/:orderTrackingId').get(protect, verifyPesapalPayment);
router.put('/:id/deliver', protect, updateOrderToDelivered);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;

