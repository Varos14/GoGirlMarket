const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Coupon = require('../models/Coupon');
const { recordCouponUsage } = require('./couponController');
const sendEmail = require('../utils/sendEmail');
const { sendWhatsAppMessage } = require('../utils/twilioUtils');
const notifications = require('../utils/notifications');

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
      appliedCoupons = [], // Default to empty array if not passed
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400).json({ message: 'No order items' });
      return;
    } else {
      // 1. Fetch products to get vendor IDs
      const productIds = orderItems.map((item) => item.product);
      const productsFromDb = await Product.find({ _id: { $in: productIds } });

      // 2. Group items by vendor
      const vendorGroups = {};
      
      for (const item of orderItems) {
        const productFromDb = productsFromDb.find((p) => p._id.toString() === item.product.toString());
        if (!productFromDb) {
          return res.status(404).json({ message: `Product not found: ${item.product}` });
        }
        
        const vendorId = productFromDb.vendor.toString();
        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = {
            vendor: vendorId,
            items: [],
            shippingPrice: 0, // Shipping is paid off-platform on delivery
            discountAmount: 0,
            couponCode: null,
            isDelivered: false
          };
        }
        
        vendorGroups[vendorId].items.push({
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          product: item.product
        });
      }

      // 3. Apply Coupons to vendor groups (with server-side enforcement)
      const couponUsageRecords = []; // Track for post-save usage recording

      for (const coupon of appliedCoupons) {
        if (vendorGroups[coupon.vendor]) {
          const group = vendorGroups[coupon.vendor];
          
          // Look up the actual coupon from the database for server-side validation
          let couponDoc = null;
          if (coupon.couponId) {
            couponDoc = await Coupon.findById(coupon.couponId);
          }

          // Determine which items are eligible for this coupon
          let eligibleItems = group.items;
          if (couponDoc && couponDoc.applicableProducts && couponDoc.applicableProducts.length > 0) {
            const applicableIds = couponDoc.applicableProducts.map(p => p.toString());
            eligibleItems = group.items.filter(item => applicableIds.includes(item.product.toString()));
          }

          if (eligibleItems.length === 0) continue; // No eligible items, skip this coupon

          const eligibleTotal = eligibleItems.reduce((acc, item) => acc + item.price * item.qty, 0);

          // Enforce minimum order amount
          if (couponDoc && couponDoc.minOrderAmount > 0 && eligibleTotal < couponDoc.minOrderAmount) {
            continue; // Skip — doesn't meet minimum
          }

          let discountAmt = 0;
          if (coupon.discountType === 'percentage') {
            discountAmt = eligibleTotal * (coupon.discountValue / 100);
            // Enforce max discount cap for percentage coupons
            if (couponDoc && couponDoc.maxDiscountAmount > 0) {
              discountAmt = Math.min(discountAmt, couponDoc.maxDiscountAmount);
            }
          } else {
            discountAmt = coupon.discountValue;
          }
          
          // Make sure discount doesn't exceed eligible item total
          discountAmt = Math.min(discountAmt, eligibleTotal);
          
          group.discountAmount = Math.round(discountAmt);
          group.couponCode = coupon.code;

          // Queue for usage recording after order is saved
          if (coupon.couponId) {
            couponUsageRecords.push({
              couponId: coupon.couponId,
              userId: req.user._id,
              discountAmount: Math.round(discountAmt)
            });
          }
        }
      }

      const vendorOrders = Object.values(vendorGroups);

      // Verify the total shipping price passed from frontend matches the backend calculation
      // If frontend didn't calculate correctly, we should ideally fail, but let's just accept frontend's numbers for total
      // and override the vendor's shipping.
      
      const order = new Order({
        user: req.user._id,
        orderItems, // Still keeping global orderItems for easier legacy compatibility
        vendorOrders, // The new split orders
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createdOrder = await order.save();

      // Record coupon usage for analytics (async, non-blocking)
      for (const record of couponUsageRecords) {
        recordCouponUsage(record.couponId, record.userId, record.discountAmount);
      }
      
      // Async notifications via utility
      notifications.sendOrderPlaced(req.user, createdOrder);

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

// @desc    Process Flutterwave Split Payment (Now using Escrow - no splits)
// @route   POST /api/orders/:id/flutterwave
// @access  Private
const processFlutterwavePayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // In the Escrow model, 100% of the funds go directly into the platform's main Flutterwave account.
    // The funds are held in Escrow by the platform.
    // When the vendor marks the order as delivered, the platform will trigger a payout/transfer to the vendor.

    // Simulate API delay for generating the payment link
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
      success: true,
      message: 'Escrow payment initialized successfully',
      payment_url: `https://mock-flutterwave-checkout.com/pay/${order._id}`,
      escrow_enabled: true
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
    const vendorIdStr = req.user._id.toString();
    
    // Find all orders where vendorOrders contains this vendor
    const orders = await Order.find({ 'vendorOrders.vendor': req.user._id })
      .populate('user', 'id name email')
      .populate({
        path: 'vendorOrders.items.product',
        select: 'name price'
      })
      .sort({ createdAt: -1 });
    
    // We only want to return the specific vendorOrders portion for this vendor, not the entire cart for security.
    const vendorSpecificOrders = orders.map(order => {
      // Extract only the vendorOrders sub-document for THIS vendor
      const vendorOrderDetails = order.vendorOrders.find(vo => vo.vendor.toString() === vendorIdStr);
      
      // Return a reconstructed object so the frontend sees it as a cohesive order for them
      return {
        _id: order._id,
        user: order.user,
        shippingAddress: order.shippingAddress,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        vendorDetails: vendorOrderDetails // This contains the specific items, isDelivered, and shippingPrice
      };
    });

    res.json(vendorSpecificOrders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update vendor specific order to delivered and release escrow funds
// @route   PUT /api/orders/:id/deliver
// @access  Private/Vendor
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // Find the specific vendor order
      const vendorIdToDeliver = req.body.vendorId || req.user._id.toString();
      const vendorOrder = order.vendorOrders.find(vo => vo.vendor.toString() === vendorIdToDeliver);
      
      if (!vendorOrder) {
        return res.status(404).json({ message: 'Vendor sub-order not found in this order' });
      }
      
      if (vendorOrder.isDelivered) {
        return res.status(400).json({ message: 'This sub-order is already delivered' });
      }

      vendorOrder.isDelivered = true;
      vendorOrder.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      
      // Populate user to send notifications
      await updatedOrder.populate('user', 'email name phone');

      // Send Email Notification
      sendEmail({
        to: updatedOrder.user.email,
        subject: `Order Shipped / Delivered - ${updatedOrder._id}`,
        html: `<h1>Your items are on the way!</h1><p>Hi ${updatedOrder.user.name}, a vendor has successfully dispatched their items for your order. They should arrive shortly!</p>`
      });

      // Send WhatsApp Notification
      if (updatedOrder.user.phone) {
        sendWhatsAppMessage({
          to: updatedOrder.user.phone,
          message: `Hi ${updatedOrder.user.name}, part of your GoGirl Market order (${updatedOrder._id}) has been marked as shipped/delivered by the vendor!`
        });
      }

      // ----------------------------------------------------
      // WALLET ESCROW SYSTEM: Add to Pending Balance
      // ----------------------------------------------------
      const vendorDetails = await User.findById(vendorIdToDeliver);
      if (vendorDetails) {
        // Calculate amount to release based on items handled by this vendor
        let vendorItemsTotal = vendorOrder.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
        
        // Subtract coupon discount from vendor's items total (Vendor absorbs the discount)
        if (vendorOrder.discountAmount) {
          vendorItemsTotal -= vendorOrder.discountAmount;
        }
        
        vendorItemsTotal += vendorOrder.shippingPrice; // Add the vendor's shipping fee
        
        const commissionRate = vendorDetails.commissionRate ?? 10;
        
        // The vendor keeps (100 - commissionRate)% of the item total
        // Important: platform cut is calculated BEFORE shipping is added (which is now 0 anyway).
        const platformCut = vendorItemsTotal * (commissionRate / 100);
        const payoutAmount = vendorItemsTotal - platformCut;

        // Initialize wallet if it doesn't exist
        if (!vendorDetails.wallet) {
          vendorDetails.wallet = { pendingBalance: 0, availableBalance: 0 };
        }

        // Add to pending balance
        vendorDetails.wallet.pendingBalance += payoutAmount;
        await vendorDetails.save();

        // Create Ledger Transaction
        // Clearance date is 3 days from now
        const clearanceDate = new Date();
        clearanceDate.setDate(clearanceDate.getDate() + 3);

        await Transaction.create({
          vendor: vendorIdToDeliver,
          order: updatedOrder._id,
          type: 'credit_pending',
          amount: payoutAmount,
          status: 'pending',
          description: `Payout for Order #${updatedOrder._id} (Pending 3 Days)`,
          clearanceDate: clearanceDate
        });

        console.log(`[WALLET] Added UGX ${payoutAmount} to Pending Balance for Vendor ${vendorDetails.name}. Clears on ${clearanceDate}`);
      }
      // ----------------------------------------------------

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
    
    // Calculate total revenue and platform commission
    const paidOrders = await Order.find({ isPaid: true });
    let totalRevenue = 0;
    let platformCommission = 0;

    for (const order of paidOrders) {
      totalRevenue += order.totalPrice;
      
      for (const vendorOrder of order.vendorOrders) {
        let vendorItemsTotal = vendorOrder.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
        if (vendorOrder.discountAmount) {
          vendorItemsTotal -= vendorOrder.discountAmount;
        }
        
        // We use the default 10% here for aggregate stats. 
        // In a real production app, we would query the specific vendor's commissionRate or store it in the order.
        const cut = vendorItemsTotal * (10 / 100);
        platformCommission += cut;
      }
    }
    
    const totalUsers = await User.countDocuments({});
    const totalVendors = await User.countDocuments({ role: 'vendor' });

    // Aggregate Ad Revenue
    const vendors = await User.find({ role: 'vendor' });
    const adRevenue = vendors.reduce((acc, v) => acc + (v.wallet?.adSpend || 0), 0);

    res.json({
      totalOrders,
      totalRevenue,
      platformCommission,
      totalUsers,
      totalVendors,
      adRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update overall order status (Jumia-style)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (order) {
      const newStatus = req.body.status;
      order.status = newStatus;

      if (newStatus === 'Confirmed') {
        order.confirmedAt = Date.now();
      } else if (newStatus === 'Shipped') {
        order.shippedAt = Date.now();
      } else if (newStatus === 'Delivered') {
        order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();

      // Async send status update notifications
      notifications.sendOrderStatusUpdate(order.user, updatedOrder, newStatus);

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Process Pesapal v3 Payment Request
// @route   POST /api/orders/:id/pesapal
// @access  Private
const processPesapalPayment = async (req, res) => {
  try {
    const pesapalUtils = require('../utils/pesapalUtils');
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = `${frontendUrl}/order/${order._id}`;
    
    // IPN notification ID registered with Pesapal
    let ipnId = process.env.PESAPAL_IPN_ID;
    
    // If IPN ID is not set in env, auto-register IPN URL on the fly (for developer convenience)
    if (!ipnId) {
      try {
        const backendDomain = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const ipnUrl = `${backendDomain}/api/orders/pesapal-ipn`;
        const ipnRes = await pesapalUtils.registerPesapalIPN(ipnUrl);
        ipnId = ipnRes.ipn_id;
      } catch (ipnErr) {
        console.warn('Could not auto-register Pesapal IPN URL:', ipnErr.message);
      }
    }

    // Split name into first and last name for Pesapal billing requirements
    const nameParts = (order.user?.name || 'Customer Name').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const pesapalPayload = {
      id: `${order._id}_${Date.now()}`,
      currency: 'UGX', // Can be dynamically set or KES/UGX/TZS
      amount: order.totalPrice,
      description: `Payment for GoGirlMarket Order #${order._id}`,
      callback_url: callbackUrl,
      notification_id: ipnId || '',
      billing_address: {
        email_address: order.user?.email || 'customer@example.com',
        phone_number: order.user?.phone || order.shippingAddress?.phone || '',
        country_code: 'UG',
        first_name: firstName,
        middle_name: '',
        last_name: lastName,
        line_1: order.shippingAddress?.address || 'N/A',
        line_2: '',
        city: order.shippingAddress?.city || 'N/A',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    };

    const pesapalResponse = await pesapalUtils.createPesapalOrder(pesapalPayload);

    if (pesapalResponse && pesapalResponse.redirect_url) {
      res.json({
        success: true,
        redirect_url: pesapalResponse.redirect_url,
        order_tracking_id: pesapalResponse.order_tracking_id
      });
    } else {
      res.status(400).json({
        message: 'Failed to generate Pesapal payment link',
        details: pesapalResponse
      });
    }

  } catch (error) {
    console.error('Pesapal process error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Pesapal Payment Processing Error', error: error.message });
  }
};

// @desc    Handle Pesapal IPN (Instant Payment Notification Webhook)
// @route   GET /api/orders/pesapal-ipn or POST /api/orders/pesapal-ipn
// @access  Public
const handlePesapalIPN = async (req, res) => {
  try {
    const pesapalUtils = require('../utils/pesapalUtils');
    // Pesapal sends OrderTrackingId and OrderNotificationType in query parameters or body
    const orderTrackingId = req.query.OrderTrackingId || req.body.OrderTrackingId;
    const merchantReference = req.query.OrderMerchantReference || req.body.OrderMerchantReference;

    if (!orderTrackingId) {
      return res.status(400).json({ message: 'OrderTrackingId is required' });
    }

    // Verify actual payment status with Pesapal API
    const statusData = await pesapalUtils.getPesapalTransactionStatus(orderTrackingId);
    
    // Extract actual order ID from merchantReference (e.g. "orderId_timestamp")
    const orderId = merchantReference ? merchantReference.split('_')[0] : null;

    if (orderId) {
      const order = await Order.findById(orderId).populate('user', 'name email');

      // Status code 1 = COMPLETED in Pesapal v3
      if (order && statusData.status_code === 1 && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: orderTrackingId,
          status: 'COMPLETED',
          update_time: new Date().toISOString(),
          email_address: order.user?.email,
          payment_method: statusData.payment_method || 'Pesapal'
        };

        await order.save();

        // Send confirmation email
        sendEmail({
          to: order.user.email,
          subject: `Payment Confirmed - Order ${order._id}`,
          html: `<h1>Payment Successful!</h1><p>We received your Pesapal payment of ${statusData.currency || 'UGX'} ${order.totalPrice}. Your items will be shipped soon.</p>`
        });
      }
    }

    // Respond back to Pesapal to confirm receipt of IPN
    res.status(200).json({
      orderNotificationType: 'IPNCHANGE',
      orderTrackingId: orderTrackingId,
      status: '200'
    });

  } catch (error) {
    console.error('Pesapal IPN Error:', error.message);
    res.status(500).json({ message: 'IPN Handler Error', error: error.message });
  }
};

// @desc    Verify Pesapal Payment Status (Client-initiated fallback)
// @route   GET /api/orders/verify-pesapal/:orderTrackingId
// @access  Private
const verifyPesapalPayment = async (req, res) => {
  try {
    const pesapalUtils = require('../utils/pesapalUtils');
    const { orderTrackingId } = req.params;

    const statusData = await pesapalUtils.getPesapalTransactionStatus(orderTrackingId);
    res.json(statusData);

  } catch (error) {
    res.status(500).json({ message: 'Error checking transaction status', error: error.message });
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
  updateOrderStatus,
  processPesapalPayment,
  handlePesapalIPN,
  verifyPesapalPayment,
};

