const axios = require('axios');

/**
 * Initiates a transfer via Flutterwave Transfers API
 * @param {Object} payload 
 * @param {string} payload.account_bank - Bank code (e.g., 'MTN' for MTN Mobile Money, 'FCMB' for bank, etc.)
 * @param {string} payload.account_number - The mobile money number or bank account
 * @param {number} payload.amount - Amount to transfer
 * @param {string} payload.narration - Transfer description
 * @param {string} payload.currency - Currency, defaults to 'UGX'
 * @param {string} payload.reference - Unique transfer reference
 * @returns {Promise<Object>} The response data from Flutterwave
 */
const initiateTransfer = async ({
  account_bank,
  account_number,
  amount,
  narration = 'GoGirl Market Vendor Payout',
  currency = 'UGX',
  reference
}) => {
  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/transfers',
      {
        account_bank,
        account_number,
        amount,
        narration,
        currency,
        reference,
        // Using callback URL is best practice in prod for webhook verification
        // callback_url: "https://your-webhook-url.com/api/webhooks/flutterwave"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Flutterwave Transfer Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Transfer failed');
  }
};

module.exports = {
  initiateTransfer,
};
