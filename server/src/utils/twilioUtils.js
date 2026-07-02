const twilio = require('twilio');

// Mock credentials for MVP unless explicitly provided in env
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC_mock_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'mock_token';
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number

const client = twilio(accountSid, authToken);

const sendWhatsAppMessage = async ({ to, message }) => {
  try {
    // Format the number to ensure it has whatsapp: prefix and international format
    let formattedTo = to;
    if (!formattedTo.startsWith('whatsapp:')) {
      // In a real app, you'd want to validate phone formats.
      // Assuming 'to' comes with a +country_code
      formattedTo = `whatsapp:${formattedTo}`;
    }

    if (accountSid === 'AC_mock_sid') {
      console.log(`[Mock Twilio WhatsApp] Message to ${formattedTo}: ${message}`);
      return { sid: 'mock_sid', status: 'mock_delivered' };
    }

    const response = await client.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: formattedTo
    });
    
    console.log(`WhatsApp message sent to ${formattedTo}. SID: ${response.sid}`);
    return response;
  } catch (error) {
    console.error('Error sending WhatsApp message via Twilio:', error);
    // We don't throw error to prevent breaking the main flow
  }
};

module.exports = { sendWhatsAppMessage };
