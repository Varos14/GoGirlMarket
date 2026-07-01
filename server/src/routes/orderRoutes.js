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
  processFlutterwavePayment
} = require('../controllers/orderController');
const { protect, admin, vendor } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);
  
router.get('/stats', protect, admin, getDashboardStats);
router.get('/myorders', protect, getMyOrders);
router.get('/vendor', protect, vendor, getVendorOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/flutterwave').post(protect, processFlutterwavePayment);
router.put('/:id/deliver', protect, updateOrderToDelivered);

module.exports = router;
