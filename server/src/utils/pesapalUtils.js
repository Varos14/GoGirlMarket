const axios = require('axios');

/**
 * Get Pesapal Base URL depending on environment
 */
const getPesapalBaseUrl = () => {
  return 'https://pay.pesapal.com/v3';
};

/**
 * Request OAuth 2.0 Bearer Token from Pesapal v3
 */
const getPesapalToken = async () => {
  const baseUrl = getPesapalBaseUrl();
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('Pesapal consumer key or secret is missing in environment variables');
  }

  const response = await axios.post(
    `${baseUrl}/api/Auth/RequestToken`,
    {
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  if (response.data && response.data.token) {
    return response.data.token;
  } else {
    throw new Error('Failed to retrieve authentication token from Pesapal');
  }
};

/**
 * Register IPN Webhook URL with Pesapal v3
 * @param {string} ipnUrl - Full URL to receive IPNs (e.g. https://yourdomain.com/api/orders/pesapal-ipn)
 */
const registerPesapalIPN = async (ipnUrl) => {
  const token = await getPesapalToken();
  const baseUrl = getPesapalBaseUrl();

  const response = await axios.post(
    `${baseUrl}/api/URLSetup/RegisterIPN`,
    {
      url: ipnUrl,
      ipn_notification_type: 'GET' // Pesapal v3 supports GET or POST for IPN callbacks
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  return response.data; // Contains ipn_id
};

/**
 * Submit Order Request to Pesapal v3 to generate payment link
 * @param {Object} payload - Order parameters required by Pesapal v3
 */
const createPesapalOrder = async (payload) => {
  const token = await getPesapalToken();
  const baseUrl = getPesapalBaseUrl();

  const response = await axios.post(
    `${baseUrl}/api/Transactions/SubmitOrderRequest`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  return response.data; // Contains order_tracking_id and redirect_url
};

/**
 * Get Transaction Status from Pesapal v3
 * @param {string} orderTrackingId - Pesapal Order Tracking ID
 */
const getPesapalTransactionStatus = async (orderTrackingId) => {
  const token = await getPesapalToken();
  const baseUrl = getPesapalBaseUrl();

  const response = await axios.get(
    `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );

  return response.data; // Contains status_code, payment_method, amount, etc.
};

module.exports = {
  getPesapalBaseUrl,
  getPesapalToken,
  registerPesapalIPN,
  createPesapalOrder,
  getPesapalTransactionStatus
};
