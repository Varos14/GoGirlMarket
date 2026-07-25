const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
// NOTE: Make sure GEMINI_API_KEY is in your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key-for-local-dev');

// Store chat history in memory (in production, use Redis or MongoDB for user sessions)
// For simplicity in this demo, we'll just keep a basic map
const userSessions = new Map();

// @desc    Handle chatbot message
// @route   POST /api/chat
// @access  Public
const handleChatMessage = async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // If no API key is provided, use smart offline knowledge base
    if (!process.env.GEMINI_API_KEY) {
      const msg = message.toLowerCase();
      let reply = "";

      if (msg.includes('shipping') || msg.includes('deliver') || msg.includes('fee') || msg.includes('location')) {
        reply = "🚚 **GoGirl Shipping & Delivery**: Delivery fees are negotiated directly with vendors on WhatsApp after checkout! Free platform shipping applies on qualifying orders over UGX 300,000 across Uganda.";
      } else if (msg.includes('pay') || msg.includes('pesapal') || msg.includes('flutterwave') || msg.includes('mobile money') || msg.includes('mtn') || msg.includes('airtel')) {
        reply = "💳 **Payments**: GoGirl Market accepts Mobile Money (MTN & Airtel), Visa/Mastercard via Pesapal & Flutterwave. All funds are held safely in Escrow until item delivery is confirmed!";
      } else if (msg.includes('dispute') || msg.includes('refund') || msg.includes('return') || msg.includes('damaged')) {
        reply = "🛡️ **Customer Protection**: If your package is damaged or not delivered, open your Order page and click 'Claim Refund'. Our Admin team will review and refund your payment safely!";
      } else if (msg.includes('vendor') || msg.includes('sell') || msg.includes('store') || msg.includes('boutique')) {
        reply = "🛍️ **Selling on GoGirl Market**: Women entrepreneurs & creators can register store accounts on the Vendor Hub to publish items, boost sponsored ads, and track payouts!";
      } else if (msg.includes('contact') || msg.includes('help') || msg.includes('support') || msg.includes('phone')) {
        reply = "📞 **Support Team**: Email support@gogirlmarket.com or call +256 123 456 789. You can also chat directly with sellers via their WhatsApp buttons on paid orders!";
      } else {
        reply = "Hello! 👋 I am the GoGirl Market AI Assistant. I can help you with **Order Tracking**, **WhatsApp Delivery**, **Mobile Money Payments**, **Customer Dispute Refunds**, or **Vendor Stores**. What would you like to know?";
      }

      return res.json({ reply });
    }

    // Get or initialize the chat session
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: "You are the GoGirl Market AI Assistant, a helpful customer service bot for a modern multi-vendor marketplace in Uganda. You help users find products, understand shipping policies, and track orders. Be friendly, concise, and helpful. Use emojis occasionally."
    });

    let chat = userSessions.get(sessionId);

    if (!chat) {
      chat = model.startChat({
        history: [],
      });
      userSessions.set(sessionId, chat);
    }

    // Send the message to Gemini
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Failed to process chat', 
      reply: "I'm having trouble connecting right now. Please try again later!"
    });
  }
};

module.exports = {
  handleChatMessage
};
