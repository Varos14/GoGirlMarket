import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import axios from 'axios';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi there! I am the GoGirl Market assistant. How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [sessionId, setSessionId] = useState('');

  // Generate a random session ID on mount
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axios.post('/api/chat', { 
        message: userMessage.text,
        sessionId 
      });
      
      setMessages((prev) => [
        ...prev, 
        { id: Date.now(), text: data.reply, sender: 'bot' }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev, 
        { id: Date.now(), text: "I'm having trouble connecting right now. Please try again later.", sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-pink-600 transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-[350px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-2xl flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">GoGirl Assistant</h3>
              <p className="text-[10px] text-white/80">Powered by AI</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-1 ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-pink-100 text-primary'}`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div 
                  className={`p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-gray-800 text-white rounded-tr-sm' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'}`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%] flex-row">
                <div className="shrink-0 h-7 w-7 rounded-full bg-pink-100 text-primary flex items-center justify-center mt-1">
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-2xl bg-white text-gray-500 border border-gray-100 rounded-tl-sm flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 border-t bg-white rounded-b-2xl">
          <form onSubmit={sendMessage} className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-100 text-sm rounded-full pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-1 top-1 bottom-1 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-pink-600 transition-colors"
            >
              <Send size={14} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;
