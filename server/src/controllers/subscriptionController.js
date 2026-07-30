const User = require('../models/User');
const pesapalUtils = require('../utils/pesapalUtils');

// @desc    Get vendor subscription status
// @route   GET /api/subscriptions/my-subscription
// @access  Private/Vendor
const getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        subscription: user.subscription || { status: 'trial', plan: 'free' },
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update vendor subscription
// @route   PUT /api/subscriptions/update
// @access  Private/Vendor
const updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      if (!['free', 'pro', 'premium'].includes(plan)) {
        return res.status(400).json({ message: 'Invalid subscription plan' });
      }

      if (!user.subscription) {
          user.subscription = {};
      }
      
      user.subscription.plan = plan;
      user.subscription.status = 'active';
      
      // Set expiry to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      user.subscription.expiresAt = expiresAt;

      const updatedUser = await user.save();

      res.json({
        subscription: updatedUser.subscription,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Initiate payment for Pro subscription via Pesapal
// @route   POST /api/subscriptions/pay-pro
// @access  Private/Vendor
const payForProSubscription = async (req, res) => {
  try {
    const { callbackUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Register IPN Webhook URL dynamically
    const host = req.get('host');
    const protocol = req.protocol;
    const ipnUrl = `${protocol}://${host}/api/subscriptions/pesapal-ipn`;
    
    let ipn_id = '';
    try {
      const ipnData = await pesapalUtils.registerPesapalIPN(ipnUrl);
      ipn_id = ipnData.ipn_id;
    } catch (err) {
      console.error('Failed to register IPN:', err.response?.data || err.message);
      return res.status(500).json({ message: 'Payment gateway configuration error (IPN)' });
    }

    // 2. Generate a unique merchant reference identifying the user and intent
    const merchantReference = `PRO_${user._id}_${Date.now()}`;
    const amount = 50000; // UGX 50,000 for Pro Tier

    // 3. Create the Pesapal Order
    const payload = {
      id: merchantReference,
      currency: 'UGX',
      amount: amount,
      description: 'GoGirlMarket Vendor Pro Subscription (30 Days)',
      callback_url: callbackUrl,
      notification_id: ipn_id,
      billing_address: {
        email_address: user.email,
        phone_number: user.phone || '',
        country_code: 'UG',
        first_name: user.name.split(' ')[0] || 'Vendor',
        middle_name: '',
        last_name: user.name.split(' ')[1] || '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    };

    const orderData = await pesapalUtils.createPesapalOrder(payload);
    res.json({
      redirect_url: orderData.redirect_url,
      order_tracking_id: orderData.order_tracking_id
    });
  } catch (err) {
    console.error('Pesapal order creation failed:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
};

// @desc    Pesapal IPN Webhook for Subscription Payments
// @route   GET/POST /api/subscriptions/pesapal-ipn
// @access  Public
const pesapalIPNWebhook = async (req, res) => {
  const OrderTrackingId = req.query.OrderTrackingId || req.body.OrderTrackingId;
  const OrderMerchantReference = req.query.OrderMerchantReference || req.body.OrderMerchantReference;

  if (!OrderTrackingId) {
    return res.status(400).send('Missing OrderTrackingId');
  }

  try {
    const statusData = await pesapalUtils.getPesapalTransactionStatus(OrderTrackingId);
    
    // Check if the transaction was completed (status_code === 1)
    if (statusData.status_code === 1 && OrderMerchantReference.startsWith('PRO_')) {
      // Extract userId from PRO_{userId}_{timestamp}
      const parts = OrderMerchantReference.split('_');
      const userId = parts[1];

      const user = await User.findById(userId);
      if (user) {
        if (!user.subscription) user.subscription = {};
        
        user.subscription.plan = 'pro';
        user.subscription.status = 'active';
        user.commissionRate = 5; // Downgrade commission to 5% as a perk
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        user.subscription.expiresAt = expiresAt;

        await user.save();
        console.log(`Successfully upgraded user ${userId} to Pro plan via Pesapal`);
      }
    }
    
    // Respond to Pesapal that we received the IPN
    res.status(200).json({
      orderNotificationType: req.query.OrderNotificationType || req.body.OrderNotificationType,
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: 200
    });
  } catch (error) {
    console.error('IPN processing error:', error.response?.data || error.message);
    res.status(500).send('IPN processing failed');
  }
};

module.exports = {
  getMySubscription,
  updateSubscription,
  payForProSubscription,
  pesapalIPNWebhook,
};
