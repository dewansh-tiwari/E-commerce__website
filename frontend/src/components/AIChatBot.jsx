import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bot, X, Send, Sparkles, Truck, Phone, AlertCircle, 
  CheckCircle2, RefreshCw, Volume2, VolumeX, Mic, MicOff,
  ShoppingBag, ArrowRight, CornerDownLeft, ShieldCheck, ChevronRight
} from 'lucide-react';
import { aiChatService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const AIChatBot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I'm **Big Market AI**, your personal 24/7 shopping and delivery assistant.\n\nI can solve your product and delivery questions instantly!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '📦 Track My Order',
        '⚡ 10-Min Delivery ETA',
        '🍎 Recommend Fresh Groceries',
        '💔 Damaged / Missing Item Refund',
        '🎁 Welcome Offer (₹100 OFF)'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Load context-aware quick actions
  useEffect(() => {
    const loadActions = async () => {
      try {
        const res = await aiChatService.getQuickActions();
        if (res.data?.actions) {
          setQuickActions(res.data.actions);
        }
      } catch (err) {
        console.error('Failed to load quick actions:', err);
      }
    };
    loadActions();
  }, [user]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          handleSend(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Text-to-Speech
  const speakText = (text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown bold / links / symbols for speech
      const clean = text
        .replace(/[*#`_~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[•\n]/g, ' ')
        .slice(0, 180);

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (manualText) => {
    const textToSend = manualText || inputValue;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await aiChatService.sendMessage({
        message: textToSend.trim(),
        context: {
          pageUrl: location.pathname
        }
      });

      const botReply = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data?.reply || "I'm here to assist with all your grocery orders and delivery needs.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: res.data?.intent,
        orderData: res.data?.orderData,
        products: res.data?.products,
        refundData: res.data?.refundData,
        suggestions: res.data?.suggestions || ['Track My Order 🚚', 'Recommend Groceries 🥦', 'Help with Items 💔']
      };

      setMessages(prev => [...prev, botReply]);
      speakText(botReply.text);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: "I am having a brief moment of latency. You can track your order directly or call our priority support line at **+91 1800 200 8899**.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Track My Order 🚚', 'Browse Groceries 🛒', 'Call Support 📞']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedItemIds(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product._id]: false }));
    }, 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: "Conversation reset. What can I help you solve today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          '📦 Track My Order',
          '⚡ 10-Min Delivery ETA',
          '🍎 Recommend Fresh Groceries',
          '💔 Damaged / Missing Item Refund'
        ]
      }
    ]);
  };

  // Helper to format bot markdown text
  const renderFormattedText = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;
      // Bold **text**
      const boldParts = formatted.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={idx} className={line.trim().startsWith('•') ? 'pl-2 text-xs sm:text-sm my-0.5' : 'text-xs sm:text-sm my-1'}>
          {boldParts.map((part, pIdx) => (
            pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-gray-900">{part}</strong> : part
          ))}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
        {/* Subtle Tooltip Balloon on First Load */}
        {!isOpen && !hasPrompted && (
          <div className="mb-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2 animate-bounce cursor-pointer"
               onClick={() => { setIsOpen(true); setHasPrompted(true); }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-900">Need help with order or delivery? Ask AI</span>
            <button onClick={(e) => { e.stopPropagation(); setHasPrompted(true); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasPrompted(true);
          }}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isOpen 
              ? 'bg-gray-900 text-white hover:bg-gray-800' 
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:shadow-emerald-500/25 hover:scale-105'
          }`}
          aria-label="Open AI Customer Assistant"
          title="Big Market AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black tracking-wide leading-none">Big Market AI</span>
            <span className="text-[10px] text-emerald-100 font-medium leading-tight">Instant Help & Orders</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Expanded AI Chat Modal / Window */}
      {isOpen && (
        <div className="fixed bottom-24 sm:bottom-24 right-2 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-w-lg h-[560px] sm:h-[620px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white relative">
                <Bot className="w-6 h-6 text-emerald-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-emerald-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Big Market AI</h3>
                  <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    24/7 Online
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100">Product & Delivery Problem Solver</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition ${soundEnabled ? 'bg-white/20 text-amber-300' : 'text-emerald-200 hover:bg-white/10'}`}
                title={soundEnabled ? 'Sound Enabled' : 'Muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={clearChat}
                className="p-2 rounded-xl text-emerald-200 hover:bg-white/10 transition"
                title="Reset Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-emerald-200 hover:bg-white/10 transition"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              Express Delivery: 10-20 mins
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Freshness Guarantee
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                  }`}
                >
                  <div className="leading-relaxed">
                    {msg.sender === 'user' ? (
                      <p className="text-xs sm:text-sm font-medium">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {/* ─────────────────────────────────────────────────── */}
                  {/* INTERACTIVE ORDER TRACKING CARD */}
                  {/* ─────────────────────────────────────────────────── */}
                  {msg.orderData && (
                    <div className="mt-3 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-3.5 space-y-2.5 shadow-md border border-emerald-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-300 animate-pulse" />
                          <span className="text-xs font-extrabold tracking-wide">#{msg.orderData.orderId}</span>
                        </div>
                        <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {msg.orderData.orderStatus || 'On the way'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/10">
                        <div>
                          <p className="text-emerald-300 font-medium">Est. Arrival</p>
                          <p className="font-bold text-white">{msg.orderData.estimatedDeliveryTime || '15-20 Mins'}</p>
                        </div>
                        <div>
                          <p className="text-emerald-300 font-medium">Driver</p>
                          <p className="font-bold text-white truncate">{msg.orderData.driverInfo?.name || 'Ramesh Kumar'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/orders/track?orderId=${msg.orderData.orderId}`);
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          <span>Live GPS Map</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {msg.orderData.driverInfo?.phone && (
                          <a
                            href={`tel:${msg.orderData.driverInfo.phone}`}
                            className="bg-white/15 hover:bg-white/25 text-white p-2 rounded-xl flex items-center justify-center transition"
                            title="Call Driver"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────── */}
                  {/* INTERACTIVE INSTANT REFUND CARD */}
                  {/* ─────────────────────────────────────────────────── */}
                  {msg.refundData && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-3.5 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Instant Refund Credited</span>
                      </div>
                      <div className="text-[11px] space-y-1 text-gray-700">
                        <p><strong>Item:</strong> {msg.refundData.itemName}</p>
                        <p><strong>Amount Credited:</strong> <span className="font-extrabold text-emerald-800 text-xs">₹{msg.refundData.refundAmount}</span></p>
                        <p><strong>Ref Code:</strong> <code className="bg-emerald-100 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-900">{msg.refundData.refundReference}</code></p>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        ✨ Credited to your SuperCoins & Wallet. Ready to use immediately!
                      </p>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────── */}
                  {/* INTERACTIVE PRODUCT RECOMMENDATION CARDS */}
                  {/* ─────────────────────────────────────────────────── */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.products.map((prod) => (
                        <div
                          key={prod._id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/products/${prod._id}`);
                          }}
                          className="bg-white rounded-xl p-2 border border-gray-200 hover:border-emerald-300 transition shadow-xs flex flex-col justify-between cursor-pointer group"
                        >
                          <div className="flex gap-2">
                            <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/100x100/f0fdf4/059669?text=Product';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-extrabold text-emerald-700 uppercase truncate">{prod.brand}</p>
                              <h4 className="text-[11px] font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-gray-500">{prod.weight}</p>
                            </div>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-gray-900">₹{prod.price}</span>
                              {prod.originalPrice > prod.price && (
                                <span className="text-[10px] text-gray-400 line-through ml-1">₹{prod.originalPrice}</span>
                              )}
                            </div>

                            <button
                              onClick={(e) => handleAddProduct(prod, e)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 ${
                                addedItemIds[prod._id]
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                              }`}
                            >
                              {addedItemIds[prod._id] ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Added!</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>+ Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sug)}
                          className="text-[10px] sm:text-[11px] font-bold bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 px-2.5 py-1 rounded-full border border-gray-200 hover:border-emerald-200 transition active:scale-95"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 w-28 shadow-xs">
                <Bot className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-xs text-gray-500 font-semibold animate-pulse">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Bar (Context-Aware) */}
          {quickActions.length > 0 && (
            <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.message)}
                  className="whitespace-nowrap text-[11px] font-extrabold bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 transition shrink-0 active:scale-95"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-2xl transition ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
                title={isListening ? 'Listening... Speak now' : 'Speak to AI'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about orders, delivery, refunds, or items..."
                className="flex-1 bg-gray-100/80 text-xs sm:text-sm text-gray-900 px-3.5 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl transition shadow-sm active:scale-95"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};
