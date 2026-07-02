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
      
      // Async send payment email to customer
      sendEmail({
        to: order.user.email, // Populated from getOrderById where this is called
        subject: `Payment Confirmed - Order ${updatedOrder._id}`,
        html: `<h1>Payment Successful!</h1><p>We received your payment of UGX ${updatedOrder.totalPrice}. The vendor(s) have been notified and your items will be shipped soon.</p>`
      });

      // Async send notification emails to all unique vendors
      try {
        const vendorIds = [...new Set(updatedOrder.orderItems.map(item => item.product?.vendor?.toString()).filter(Boolean))];
        const vendors = await User.find({ _id: { $in: vendorIds } });
        
        vendors.forEach(vendor => {
          sendEmail({
            to: vendor.email,
            subject: `🎉 New Order Received! Action Required - ${updatedOrder._id}`,
            html: `
              <h1>You have a new paid order!</h1>
              <p>Great news! A customer just placed and paid for an order containing your products.</p>
              <h3>Customer Details:</h3>
              <p><strong>Name:</strong> ${order.user.name}</p>
              <p><strong>Email:</strong> ${order.user.email}</p>
              <p><strong>Delivery Address:</strong> ${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
              <br/>
              <p>Please log into your Vendor Dashboard to prepare this order for dispatch!</p>
            `
          });
        });
      } catch (err) {
        console.error("Error sending vendor emails:", err);
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Process Flutterwave Split Payment
// @route   POST /api/orders/:id/flutterwave
// @access  Private
const processFlutterwavePayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'vendor name price'
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 1. Find all unique vendors in this order
    const vendorIds = [...new Set(order.orderItems.map(item => item.product?.vendor?.toString()).filter(Boolean))];

    // 2. Fetch those vendors to get their Flutterwave Subaccount IDs
    const vendors = await User.find({ _id: { $in: vendorIds } });

    // 3. Construct the subaccounts array for Flutterwave
    const subaccounts = vendors.map(vendor => {
      // If vendor has a payout subaccount, use it. Otherwise, funds just go to main account.
      if (vendor.payout?.flutterwaveSubaccountId) {
        const platformCut = vendor.commissionRate !== undefined ? vendor.commissionRate : 7;
        const vendorCut = 100 - platformCut;
        
        return {
          id: vendor.payout.flutterwaveSubaccountId,
          transaction_split_ratio: vendorCut,
          transaction_charge_type: 'percentage',
          transaction_charge: platformCut // Platform takes dynamic cut
        };
      }
      return null;
    }).filter(Boolean);

    // 4. In a real app, we would make an axios call to Flutterwave API here to initialize the payment
    // and return the payment link to the frontend.
    // For this MVP, we will mock the successful creation of the payment link.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
      success: true,
      message: 'Payment initialized successfully',
      payment_url: `https://mock-flutterwave-checkout.com/pay/${order._id}`,
      subaccounts_applied: subaccounts.length,
      split_details: subaccounts
    });

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
    // Populate the user AND the products in the orderItems
    const orders = await Order.find({})
      .populate('user', 'id name email')
      .populate({
        path: 'orderItems.product',
        select: 'vendor name price'
      })
      .sort({ createdAt: -1 });
    
    const vendorIdStr = req.user._id.toString();
    
    // Filter orders to only those containing products belonging to this vendor
    const vendorOrders = orders.filter(order => {
      // Check if any item in the order has a populated product with the correct vendor ID
      return order.orderItems.some(item => 
        item.product && item.product.vendor && item.product.vendor.toString() === vendorIdStr
      );
    });

    res.json(vendorOrders);
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
        subject: `Order Shipped / Delivered - ${updatedOrder._id}`,
        html: `<h1>Your Order is on the way!</h1><p>Hi ${updatedOrder.user.name}, the vendor has successfully dispatched your items. They should arrive shortly!</p>`
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
  processFlutterwavePayment,
};
