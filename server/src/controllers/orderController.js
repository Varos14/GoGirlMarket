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
        deliveryType = 'Standard',
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
        // 1. Fetch products and populate vendor details to resolve exact vendor email & phone
        const productIds = orderItems.map((item) => item.product);
        const productsFromDb = await Product.find({ _id: { $in: productIds } }).populate('vendor', 'name storeName email phone commissionRate');

        // 2. Group items by vendor
        const vendorGroups = {};
        
        for (const item of orderItems) {
          const productFromDb = productsFromDb.find((p) => p._id.toString() === item.product.toString());
          if (!productFromDb) {
            return res.status(404).json({ message: `Product not found: ${item.product}` });
          }
          
          const vendorDoc = productFromDb.vendor;
          const vendorId = vendorDoc?._id ? vendorDoc._id.toString() : productFromDb.vendor.toString();
          
          if (!vendorGroups[vendorId]) {
            vendorGroups[vendorId] = {
              vendor: vendorId,
              vendorEmail: vendorDoc?.email || '',
              vendorStoreName: vendorDoc?.storeName || vendorDoc?.name || 'Vendor Store',
              vendorPhone: vendorDoc?.phone || '',
              items: [],
              shippingPrice: 0, // Shipping is paid off-platform on delivery
              discountAmount: 0,
              platformFee: 0,
              vendorPayout: 0,
              vendorCommissionRate: vendorDoc?.commissionRate || 10,
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

        // 4. Calculate Platform Fee and Vendor Payout for each vendor group
        const vendorOrders = Object.values(vendorGroups).map(group => {
          const groupTotal = group.items.reduce((acc, item) => acc + item.price * item.qty, 0);
          const afterDiscount = groupTotal - group.discountAmount;
          // Calculate platform fee based on the after-discount price
          const fee = Math.round(afterDiscount * (group.vendorCommissionRate / 100));
          const payout = afterDiscount - fee;
          
          return {
            ...group,
            platformFee: fee,
            vendorPayout: payout,
          };
        });
        const initialStatus = paymentMethod === 'Cash on Delivery' ? 'Confirmed' : 'Pending';

        const order = new Order({
          user: req.user._id,
          orderItems,
          vendorOrders,
          shippingAddress,
          deliveryType,
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
          status: initialStatus,
          confirmedAt: initialStatus === 'Confirmed' ? Date.now() : undefined,
        });

      const createdOrder = await order.save();

      // Record coupon usage for analytics (async, non-blocking)
      for (const record of couponUsageRecords) {
        recordCouponUsage(record.couponId, record.userId, record.discountAmount);
      }
      
      // Async notifications via utility for customer
      notifications.sendOrderPlaced(req.user, createdOrder);

      // Async immediate email notification sent to each vendor's respective email address
      try {
        Object.values(vendorGroups).forEach(async (vGroup) => {
          let targetEmail = vGroup.vendorEmail;

          // If vendorEmail wasn't populated on product, fetch user
          if (!targetEmail && vGroup.vendor) {
            const vendorUser = await User.findById(vGroup.vendor);
            targetEmail = vendorUser?.email;
          }

          if (targetEmail) {
            const itemsList = vGroup.items.map(i => `• ${i.qty}x ${i.name} — UGX ${(i.price * i.qty).toLocaleString()}`).join('<br/>');

            console.log(`[Order Placed Email] Dispatching receipt email to vendor address: ${targetEmail}`);

            sendEmail({
              to: targetEmail,
              subject: `🛒 New Order Received! Action Required - #${createdOrder._id.toString().substring(18)}`,
              html: `
                <h1>New Order Notification</h1>
                <p>Hi <strong>${vGroup.vendorStoreName}</strong>,</p>
                <p>A customer has just placed a new order containing your products on GoGirl Market!</p>
                
                <h3>Order Summary:</h3>
                <p><strong>Order ID:</strong> #${createdOrder._id}</p>
                <p><strong>Customer Name:</strong> ${req.user.name}</p>
                <p><strong>Customer Email:</strong> ${req.user.email}</p>
                <p><strong>Payment Method:</strong> ${createdOrder.paymentMethod}</p>
                <p><strong>Delivery Address:</strong> ${createdOrder.shippingAddress?.address || ''}, ${createdOrder.shippingAddress?.city || ''}</p>
                
                <h3>Items Ordered From Your Store:</h3>
                <p>${itemsList}</p>
                
                <br/>
                <p>Please log into your Vendor Dashboard to monitor payment status and coordinate delivery.</p>
              `
            });
          } else {
            console.warn(`[Order Placed Email] Could not find vendor email for vendor ID: ${vGroup.vendor}`);
          }
        });
      } catch (vendorErr) {
        console.error("Error sending immediate vendor order placed emails:", vendorErr.message);
      }

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
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'vendorOrders.vendor',
        select: 'name storeName phone location email'
      });

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Helper to dispatch multi-channel vendor notifications (Email + WhatsApp)
 */
const notifyVendorsForPaidOrder = async (order) => {
  try {
    // Populate user if not populated
    if (!order.user || !order.user.name) {
      await order.populate('user', 'name email phone');
    }

    const vendorIds = [...new Set([
      ...(order.orderItems || []).map(i => i.vendor?.toString() || i.product?.vendor?.toString()),
      ...(order.vendorOrders || []).map(vo => vo.vendor?._id ? vo.vendor._id.toString() : vo.vendor?.toString())
    ].filter(Boolean))];

    if (vendorIds.length === 0) return;
    
    const vendors = await User.find({ _id: { $in: vendorIds } });

    for (const vendor of vendors) {
      if (!vendor.email) {
        console.warn(`[Vendor Notification] Vendor ${vendor.storeName || vendor.name} has no email address configured.`);
        continue;
      }

      // Find items for this vendor
      const vendorPackage = (order.vendorOrders || []).find(vo => 
        vo.vendor?._id ? vo.vendor._id.toString() === vendor._id.toString() : vo.vendor?.toString() === vendor._id.toString()
      );
      const vendorItems = vendorPackage ? vendorPackage.items : (order.orderItems || []).filter(i => 
        (i.vendor?.toString() || i.product?.vendor?.toString()) === vendor._id.toString()
      );

      const itemsListHtml = (vendorItems || []).map(i => `• ${i.qty}x ${i.name} — UGX ${(i.price * i.qty).toLocaleString()}`).join('<br/>') || 'Your order items';

      console.log(`[Order Paid Email] Dispatching paid receipt to vendor email: ${vendor.email}`);

      // 1. Email Notification
      sendEmail({
        to: vendor.email,
        subject: `🎉 Payment Confirmed - Order #${order._id.toString().substring(18)}`,
        html: `
          <h1>Payment Confirmed!</h1>
          <p>Hi <strong>${vendor.storeName || vendor.name}</strong>,</p>
          <p>Great news! A customer's payment has been confirmed for an order containing your products.</p>
          
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${order.user?.name || 'Customer'}</p>
          <p><strong>Email:</strong> ${order.user?.email || 'N/A'}</p>
          <p><strong>Delivery Address:</strong> ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}</p>
          
          <h3>Paid Items From Your Store:</h3>
          <p>${itemsListHtml}</p>
          <br/>
          <p>Please log into your Vendor Dashboard to prepare this order for dispatch and coordinate delivery!</p>
        `
      });

      // 2. Automated WhatsApp Notification
      if (vendor.phone && typeof sendWhatsAppMessage === 'function') {
        let phone = vendor.phone.replace(/[^\d+]/g, '');
        if (phone.startsWith('0')) {
          phone = '+256' + phone.substring(1);
        } else if (!phone.startsWith('+')) {
          phone = '+' + phone;
        }

        const customerName = order.user?.name || 'Customer';
        const shortId = order._id.toString().substring(18);
        const addressStr = order.shippingAddress?.address ? `${order.shippingAddress.address}, ${order.shippingAddress.city || ''}` : 'Customer Address';

        sendWhatsAppMessage({
          to: phone,
          message: `🎉 New Paid Order Received!\nCustomer: ${customerName}\nOrder ID: #${shortId}\nDelivery Address: ${addressStr}\nPlease check your Vendor Dashboard to prepare this order and arrange delivery!`
        }).catch(err => console.error("WhatsApp send error:", err.message));
      }
    }
  } catch (err) {
    console.error("Error sending vendor notifications:", err.message);
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
      
      // Store payment result from Stripe / Pesapal
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer ? req.body.payer.email_address : req.body.email_address,
      };

      const updatedOrder = await order.save();
      
      // Async send payment email to customer
      if (order.user?.email) {
        sendEmail({
          to: order.user.email,
          subject: `Payment Confirmed - Order ${updatedOrder._id}`,
          html: `<h1>Payment Successful!</h1><p>We received your payment of UGX ${updatedOrder.totalPrice}. The vendor(s) have been notified and your items will be shipped soon.</p>`
        });
      }

      // Async send notification emails and WhatsApp alerts to all unique vendors
      notifyVendorsForPaidOrder(updatedOrder);

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
          user: vendorIdToDeliver,
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

    const vendorList = await User.find({ role: 'vendor' });
    const vendorMap = {};
    vendorList.forEach(v => {
      vendorMap[v._id.toString()] = v.commissionRate || 10;
    });

    for (const order of paidOrders) {
      totalRevenue += order.totalPrice;
      
      for (const vendorOrder of order.vendorOrders) {
        let vendorItemsTotal = vendorOrder.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
        if (vendorOrder.discountAmount) {
          vendorItemsTotal -= vendorOrder.discountAmount;
        }
        
        const rate = vendorMap[vendorOrder.vendor.toString()] || 10;
        const cut = vendorItemsTotal * (rate / 100);
        platformCommission += cut;
      }
    }
    
    const totalUsers = await User.countDocuments({});
    const totalVendors = vendorList.length;

    // Aggregate Ad Revenue
    const adRevenue = vendorList.reduce((acc, v) => acc + (v.wallet?.adSpend || 0), 0);

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
// @access  Private/Admin or Vendor
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (order) {
      const newStatus = req.body.status;
      
      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Cancelled orders cannot change status.' });
      }

      order.status = newStatus;

      if (newStatus === 'Confirmed' && !order.confirmedAt) {
        order.confirmedAt = Date.now();
      } else if (newStatus === 'Processing' && !order.processingAt) {
        order.processingAt = Date.now();
      } else if (newStatus === 'Shipped' && !order.shippedAt) {
        order.shippedAt = Date.now();
      } else if (newStatus === 'Out for Delivery' && !order.outForDeliveryAt) {
        order.outForDeliveryAt = Date.now();
      } else if (newStatus === 'Delivered' && !order.deliveredAt) {
        order.deliveredAt = Date.now();
      } else if (newStatus === 'Cancelled' && !order.cancelledAt) {
        order.cancelledAt = Date.now();
        order.cancellationReason = req.body.reason || 'Cancelled by Admin';
        
        // Restore stock quantities
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: item.qty }
          });
        }
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

// @desc    Cancel order (Customer pre-shipment cancellation)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Security check: ensure order belongs to current user or user is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Cancellation policy check: allowed only BEFORE Shipped status
    const restrictedStatuses = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (restrictedStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel order at '${order.status}' stage. Orders can only be cancelled before dispatch.` 
      });
    }

    order.status = 'Cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = req.body.reason || 'Cancelled by Customer';

    // Restore item inventory counts
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.qty }
      });
    }

    const updatedOrder = await order.save();

    // Send notifications
    notifications.sendOrderStatusUpdate(order.user, updatedOrder, 'Cancelled');

    res.json({ message: 'Order cancelled successfully', order: updatedOrder });
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
    
    // If IPN ID is not set or invalid, auto-register IPN URL
    if (!ipnId) {
      try {
        const backendDomain = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const ipnUrl = `${backendDomain}/api/orders/pesapal-ipn`;
        const ipnRes = await pesapalUtils.registerPesapalIPN(ipnUrl);
        if (ipnRes && ipnRes.ipn_id) {
          ipnId = ipnRes.ipn_id;
        }
      } catch (ipnErr) {
        console.warn('Could not auto-register Pesapal IPN URL:', ipnErr.message);
      }
    }

    if (!ipnId) {
      // Fallback IPN registration attempt if env IPN ID is empty
      try {
        const ipnRes = await pesapalUtils.registerPesapalIPN('https://gogirlmarket.com/api/orders/pesapal-ipn');
        ipnId = ipnRes?.ipn_id;
      } catch (e) {
        console.error('Fallback IPN registration error:', e.message);
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
    const errorDetails = error.response?.data || error.message;
    console.error('Pesapal process error:', errorDetails);
    res.status(500).json({ 
      message: error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Pesapal Payment Processing Error', 
      details: errorDetails 
    });
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

        // Send confirmation email to customer
        if (order.user?.email) {
          sendEmail({
            to: order.user.email,
            subject: `Payment Confirmed - Order ${order._id}`,
            html: `<h1>Payment Successful!</h1><p>We received your Pesapal payment of ${statusData.currency || 'UGX'} ${order.totalPrice}. Your items will be shipped soon.</p>`
          });
        }

        // Send Email & WhatsApp notifications to vendors
        notifyVendorsForPaidOrder(order);
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

// @desc    Raise a dispute on an order package (Buyer)
// @route   POST /api/orders/:id/dispute
// @access  Private
const raiseOrderDispute = async (req, res) => {
  try {
    const { vendorId, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to dispute this order' });
    }

    const vOrder = order.vendorOrders.find(vo => vo.vendor.toString() === vendorId);
    if (!vOrder) {
      return res.status(404).json({ message: 'Vendor package not found in this order' });
    }

    vOrder.disputeStatus = 'Open';
    vOrder.disputeReason = reason;
    vOrder.disputedAt = Date.now();

    await order.save();
    res.json({ message: 'Dispute submitted. Admin will review your claim.', order });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Resolve a package dispute (Admin)
// @route   PUT /api/orders/:id/dispute/resolve
// @access  Private/Admin
const resolveOrderDispute = async (req, res) => {
  try {
    const { vendorId, action } = req.body; // action: 'approve_refund' or 'release'
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const vOrder = order.vendorOrders.find(vo => vo.vendor.toString() === vendorId);
    if (!vOrder) {
      return res.status(404).json({ message: 'Vendor package not found in this order' });
    }

    if (vOrder.disputeStatus !== 'Open') {
      return res.status(400).json({ message: 'Dispute is not open' });
    }

    const vendor = await require('../models/User').findById(vendorId);
    const buyer = await require('../models/User').findById(order.user);
    const Transaction = require('../models/Transaction');
    
    // Find the pending credit transaction for this vendor/order
    const pendingTx = await Transaction.findOne({
      user: vendorId,
      order: order._id,
      type: 'credit_pending',
      status: 'pending'
    });

    if (action === 'approve_refund') {
      vOrder.disputeStatus = 'Resolved_Refunded';
      
      if (pendingTx) {
        pendingTx.status = 'failed';
        pendingTx.description += ' (Refunded due to Dispute)';
        await pendingTx.save();
        
        // Deduct from vendor pending balance
        if (vendor.wallet) {
          vendor.wallet.pendingBalance -= pendingTx.amount;
          if (vendor.wallet.pendingBalance < 0) vendor.wallet.pendingBalance = 0;
          await vendor.save();
        }

        // Add to buyer available balance
        if (buyer) {
          if (!buyer.wallet) buyer.wallet = { pendingBalance: 0, availableBalance: 0 };
          buyer.wallet.availableBalance += pendingTx.amount; // Give them back the amount
          await buyer.save();
          
          await Transaction.create({
            user: buyer._id,
            order: order._id,
            type: 'refund',
            amount: pendingTx.amount,
            status: 'completed',
            description: `Dispute Refund for Order #${order._id}`
          });
        }
      }
    } else if (action === 'release') {
      vOrder.disputeStatus = 'Resolved_Released';
      
      // Fast-track release to vendor
      if (pendingTx) {
        pendingTx.status = 'completed';
        pendingTx.description += ' (Dispute Resolved - Funds Cleared)';
        await pendingTx.save();
        
        if (vendor.wallet) {
          vendor.wallet.pendingBalance -= pendingTx.amount;
          if (vendor.wallet.pendingBalance < 0) vendor.wallet.pendingBalance = 0;
          vendor.wallet.availableBalance += pendingTx.amount;
          await vendor.save();
        }

        await Transaction.create({
          user: vendorId,
          order: order._id,
          type: 'cleared',
          amount: pendingTx.amount,
          status: 'completed',
          description: `Dispute Won - Funds Cleared for Order #${order._id}`
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await order.save();
    res.json({ message: `Dispute ${action === 'approve_refund' ? 'refund approved' : 'funds released to vendor'}`, order });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all disputed orders (Admin)
// @route   GET /api/orders/disputes
// @access  Private/Admin
const getDisputedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'vendorOrders.disputeStatus': 'Open' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
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
  updateOrderStatus,
  processPesapalPayment,
  handlePesapalIPN,
  verifyPesapalPayment,
  raiseOrderDispute,
  resolveOrderDispute,
  getDisputedOrders,
  cancelOrder,
};
