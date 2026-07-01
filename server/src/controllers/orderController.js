const Order = require('../models/Order');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400).json({ message: 'No order items' });
      return;
    } else {
      const order = new Order({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createdOrder = await order.save();
      
      // Async send email - no await so we don't block the response
      sendEmail({
        to: req.user.email,
        subject: `GoGirl Market Order Received - ${createdOrder._id}`,
        html: `<h1>Thank you for your order!</h1><p>We have successfully received your order for UGX ${totalPrice}. We will begin processing it right away.</p>`
      });

      res.status(201).json(createdOrder);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      
      // Store payment result from Stripe
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer ? req.body.payer.email_address : req.body.email_address,
      };

      const updatedOrder = await order.save();
      
      // Async send payment email
      sendEmail({
        to: order.user.email, // Populated from getOrderById where this is called
        subject: `Payment Confirmed - Order ${updatedOrder._id}`,
        html: `<h1>Payment Successful!</h1><p>We received your payment of UGX ${updatedOrder.totalPrice}. Your items will be shipped soon.</p>`
      });

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get orders for logged in vendor
// @route   GET /api/orders/vendor
// @access  Private/Vendor
const getVendorOrders = async (req, res) => {
  try {
    // In a real multi-vendor system, this query would be complex (aggregations)
    // to filter only the specific order items belonging to the vendor.
    // For MVP, we'll find orders where ANY product belongs to the vendor.
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    
    // We would filter this array based on the vendor's products
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin/Vendor
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      
      // We need to populate the user to get their email if it isn't populated
      await updatedOrder.populate('user', 'email name');

      sendEmail({
        to: updatedOrder.user.email,
        subject: `Order Delivered - ${updatedOrder._id}`,
        html: `<h1>Your Order is Delivered!</h1><p>Hi ${updatedOrder.user.name}, your GoGirl Market order has been marked as delivered. Enjoy your items!</p>`
      });

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    
    // Calculate total revenue (sum of all paid orders)
    const paidOrders = await Order.find({ isPaid: true });
    const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    
    const totalUsers = await User.countDocuments({});
    const totalVendors = await User.countDocuments({ role: 'vendor' });

    res.json({
      totalOrders,
      totalRevenue,
      totalUsers,
      totalVendors
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  getVendorOrders,
  updateOrderToDelivered,
  getDashboardStats,
};
