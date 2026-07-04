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

    // If no API key is provided, fallback to a mocked response for local dev safety
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is missing. Using mock response.');
      return res.json({
        reply: "I am the GoGirl Market assistant! (Note: Gemini API key is missing, so I'm running in offline mock mode). How can I help you today?"
      });
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
