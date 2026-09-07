import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  User, 
  MapPin, 
  ChevronDown, 
  Coins, 
  Heart, 
  Sparkles, 
  Mic, 
  MicOff,
  X,
  Menu,
  ShieldCheck,
  TrendingUp,
  Navigation,
  Loader2,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Check,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSuperCoins } from '../context/SuperCoinsContext';
import { useNetwork } from '../context/NetworkContext';
import { productService } from '../services/api';
import { detectCurrentLocation } from '../utils/locationHelper';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, setIsAuthModalOpen, setAuthMode, selectedLocation, setSelectedLocation } = useAuth();
  const { totalItemCount, setIsCartOpen, subtotal, welcomeOffer, addToCart } = useCart();
  const { setIsCoinsModalOpen } = useSuperCoins();
  const { isOffline } = useNetwork();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], brands: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Voice Search & Assistant State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceRelevantProducts, setVoiceRelevantProducts] = useState([]);
  const [voiceRelevantCategories, setVoiceRelevantCategories] = useState([]);
  const [isLoadingRelevant, setIsLoadingRelevant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState({});
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const searchRef = useRef(null);
  const recognitionRef = useRef(null);
  const debounceVoiceTimer = useRef(null);

  const handleDetectGpsLocation = async () => {
    setIsGpsLocating(true);
    try {
      const loc = await detectCurrentLocation();
      setSelectedLocation(loc);
      setIsLocationModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGpsLocating(false);
    }
  };

  // Debounced Search Suggestions
  useEffect(() => {
    if (!searchQuery.trim() || isVoiceListening) {
      setSuggestions({ products: [], categories: [], brands: [] });
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getSearchSuggestions(searchQuery);
        setSuggestions(res.data);
        setIsSearchOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search drawer
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (isOffline) return;
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const speakAssistant = (text) => {
    if (isVoiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India')) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0];
      if (voice) utterance.voice = voice;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice speech synthesis warning:', err);
    }
  };

  // Indian Grocery Hinglish / Hindi to English Map (Blinkit & BigBasket style)
  const HINGLISH_GROCERY_MAP = {
    'doodh': 'milk',
    'dud': 'milk',
    'dahi': 'curd',
    'daahi': 'curd',
    'pyaaz': 'onion',
    'pyaz': 'onion',
    'kanda': 'onion',
    'tamatar': 'tomato',
    'aaloo': 'potato',
    'aalu': 'potato',
    'batata': 'potato',
    'aata': 'atta',
    'chawal': 'rice',
    'biscuit': 'biscuit',
    'biskoot': 'biscuit',
    'namkeen': 'namkeen',
    'bhujia': 'namkeen',
    'cheeni': 'sugar',
    'chini': 'sugar',
    'shakkar': 'sugar',
    'tel': 'oil',
    'nimbu': 'lemon',
    'neebu': 'lemon',
    'paneer': 'paneer',
    'makhan': 'butter',
    'makkhan': 'butter',
    'chai': 'tea',
    'chay': 'tea',
    'patti': 'tea',
    'haldi': 'turmeric',
    'mirch': 'chilli',
    'anda': 'eggs',
    'ande': 'eggs',
    'sabzi': 'vegetables',
    'sabji': 'vegetables',
    'phal': 'fruits',
    'kela': 'banana',
    'seb': 'apple'
  };

  const processVoiceInstruction = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    const lower = rawText.toLowerCase().trim();

    // 1. Navigation Instruction: Open Basket / Cart
    if (
      lower.includes('open cart') || 
      lower.includes('show cart') || 
      lower.includes('open basket') || 
      lower.includes('show basket') ||
      lower.includes('my basket') ||
      lower.includes('go to cart') ||
      lower.includes('cart kholo') ||
      lower.includes('mera cart') ||
      lower === 'cart' ||
      lower === 'basket'
    ) {
      speakAssistant("Opening your basket!");
      setAssistantMessage("🛒 Opening your basket...");
      setTimeout(() => {
        stopVoiceSearch();
        setIsCartOpen(true);
      }, 700);
      return;
    }

    // 2. Navigation Instruction: Go to Homepage
    if (
      lower.includes('go home') || 
      lower.includes('home page') || 
      lower.includes('homepage') || 
      lower.includes('ghar jao') ||
      lower === 'home'
    ) {
      speakAssistant("Taking you to homepage");
      setAssistantMessage("🏠 Going to homepage...");
      setTimeout(() => {
        stopVoiceSearch();
        navigate('/');
      }, 700);
      return;
    }

    // 3. Navigation Instruction: Checkout
    if (
      lower.includes('checkout') || 
      lower.includes('proceed to checkout') || 
      lower.includes('buy now') || 
      lower.includes('order now')
    ) {
      speakAssistant("Taking you to checkout");
      setAssistantMessage("💳 Opening checkout...");
      setTimeout(() => {
        stopVoiceSearch();
        navigate('/checkout');
      }, 700);
      return;
    }

    // 4. Navigation Instruction: Deals & Offers
    if (
      lower.includes('deals') || 
      lower.includes('offers') || 
      lower.includes('discounts') || 
      lower.includes('happy hour') ||
      lower.includes('offer dikhao')
    ) {
      speakAssistant("Showing today's best deals and offers!");
      setAssistantMessage("⚡ Showing deals and offers...");
      setTimeout(() => {
        stopVoiceSearch();
        navigate('/products?isDeal=true');
      }, 700);
      return;
    }

    // 5. Navigation Instruction: Track Orders
    if (
      lower.includes('track order') || 
      lower.includes('track my order') || 
      lower.includes('order status') || 
      lower.includes('where is my order') ||
      lower.includes('order kahan hai')
    ) {
      speakAssistant("Opening live order tracking!");
      setAssistantMessage("🚚 Tracking your order...");
      setTimeout(() => {
        stopVoiceSearch();
        navigate('/orders/track');
      }, 700);
      return;
    }

    // 6. Action Instruction: "Add [item] to cart"
    const addMatch = lower.match(/(?:add|daalo|dalo)\s+(.+?)(?:\s+(?:to cart|in cart|to basket|cart me|me add karo))?$/i);
    if (addMatch && addMatch[1]) {
      let itemToSearch = addMatch[1].trim();
      itemToSearch = itemToSearch.replace(/to cart|in cart|to basket|cart me/gi, '').trim();

      for (const [hi, en] of Object.entries(HINGLISH_GROCERY_MAP)) {
        if (itemToSearch.includes(hi)) {
          itemToSearch = itemToSearch.replace(hi, en);
        }
      }

      setAssistantMessage(`Finding and adding "${itemToSearch}" to your basket...`);
      setIsLoadingRelevant(true);
      try {
        const res = await productService.getSearchSuggestions(itemToSearch);
        const prods = res.data?.products || [];
        if (prods.length > 0) {
          const target = prods[0];
          addToCart(target, 1);
          setVoiceRelevantProducts(prods);
          setAddedItemMap(prev => ({ ...prev, [target._id]: true }));
          speakAssistant(`Added ${target.name} to your basket!`);
          setAssistantMessage(`✓ Added "${target.name}" to your basket!`);
        } else {
          speakAssistant(`Could not find ${itemToSearch} to add.`);
          setAssistantMessage(`Could not find exact item for "${itemToSearch}".`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingRelevant(false);
      }
      return;
    }

    // 7. General Search Query (with Hinglish mapping)
    let mappedQuery = lower;
    for (const [hi, en] of Object.entries(HINGLISH_GROCERY_MAP)) {
      if (mappedQuery.includes(hi)) {
        mappedQuery = mappedQuery.replace(new RegExp(`\\b${hi}\\b`, 'g'), en);
      }
    }

    fetchVoiceSuggestions(mappedQuery);
  };

  const fetchVoiceSuggestions = async (term) => {
    if (!term || !term.trim()) {
      setVoiceRelevantProducts([]);
      setVoiceRelevantCategories([]);
      return;
    }
    setIsLoadingRelevant(true);
    try {
      const res = await productService.getSearchSuggestions(term.trim());
      const prods = res.data?.products || [];
      const cats = res.data?.categories || [];
      setVoiceRelevantProducts(prods);
      setVoiceRelevantCategories(cats);

      let msg = '';
      if (prods.length > 0) {
        msg = `Found ${prods.length} items for "${term}". Tap any item or add to cart!`;
        speakAssistant(`Found ${prods.length} items for ${term}`);
      } else {
        msg = `Searching for "${term}". No exact match found, but you can explore our full catalog.`;
        speakAssistant(`Searching for ${term}`);
      }
      setAssistantMessage(msg);
    } catch (err) {
      console.error('Error fetching voice suggestions:', err);
    } finally {
      setIsLoadingRelevant(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (debounceVoiceTimer.current) clearTimeout(debounceVoiceTimer.current);
    setIsRecording(false);
    setIsVoiceListening(false);
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser. You can type or tap the quick items below.');
      setIsRecording(false);
      setAssistantMessage('Speech recognition is not supported in this browser. You can tap items below.');
      return;
    }

    setVoiceError('');
    setIsRecording(true);
    setAssistantMessage("Listening to your voice... Speak product name or instructions 🎙️");
    speakAssistant("I'm listening. Speak product name or instruction like open cart or show deals!");

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceError('');
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        setSearchQuery(transcript);

        if (debounceVoiceTimer.current) clearTimeout(debounceVoiceTimer.current);
        debounceVoiceTimer.current = setTimeout(() => {
          processVoiceInstruction(transcript);
        }, 350);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone access blocked. Please allow mic permissions in your browser or tap items below to search.');
          setAssistantMessage('Microphone access blocked. Please tap items below.');
          speakAssistant('Microphone access blocked. Please tap items below.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Tap the mic button to speak again.');
          setAssistantMessage('No speech detected. Tap mic to speak again.');
        } else {
          setVoiceError(`Voice notice: ${event.error}. You can also type or choose an item below.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting voice recognition:', err);
      setIsRecording(false);
      setVoiceError('Could not activate microphone.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleVoiceSearch = () => {
    if (isOffline) {
      speakAssistant("You are currently offline. Please connect to the internet to search fresh groceries.");
      return;
    }
    setIsSearchOpen(false);
    setIsVoiceListening(true);
    setVoiceError('');
    setVoiceTranscript('');
    setVoiceRelevantProducts([]);
    setVoiceRelevantCategories([]);
    setAssistantMessage("Listening to your voice... Speak product name 🎙️");
    startRecording();
  };

  const applyQuickVoiceTerm = (term) => {
    setVoiceTranscript(term);
    setSearchQuery(term);
    fetchVoiceSuggestions(term);
  };

  const submitVoiceSearch = () => {
    const query = (voiceTranscript || searchQuery).trim();
    stopVoiceSearch();
    if (query) {
      setSearchQuery(query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-header border-b border-emerald-100 shadow-sm transition-all">
      {/* Top Banner Notice: First 3 Orders Welcome Offer */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-emerald-800/40">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        <span className="truncate">
          <strong className="text-amber-300 font-extrabold uppercase tracking-wide">🎉 First 3 Orders Special:</strong> Flat <strong className="text-white font-black">₹100 OFF</strong> above ₹199 + <strong className="text-white font-black">FREE Delivery</strong> + <strong className="text-white font-black">FREE Handling</strong> {welcomeOffer?.isEligible && `(Order ${welcomeOffer.currentOrderNumber} of 3)`}
        </span>
        <button 
          onClick={() => {
            navigator.clipboard.writeText('WELCOME100');
            setIsCartOpen(true);
          }}
          className="ml-2 bg-amber-400 hover:bg-amber-300 text-gray-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          title="Click to view in cart"
        >
          Use WELCOME100
        </button>
        <button 
          onClick={() => setIsCoinsModalOpen(true)}
          className="hidden md:inline-flex ml-2 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-200 transition"
        >
          🪙 SuperCoins
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent flex items-center gap-1">
                  Big Market 👌
                </span>
                <span className="text-[10px] font-bold text-amber-600 tracking-wider -mt-1 uppercase">
                  10-Min Groceries
                </span>
              </div>
            </Link>

            {/* Delivery Location Picker */}
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden lg:flex flex-col text-left px-3 py-1.5 rounded-xl hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200 transition"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deliver to</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-gray-800 truncate max-w-[150px]">
                {selectedLocation.area}
              </span>
            </button>
          </div>

          {/* Large Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder={isOffline ? "Offline • Internet connection required to browse groceries..." : "Search 'milk', 'avocado', 'organic atta', 'spices'..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => !isOffline && searchQuery.trim() && setIsSearchOpen(true)}
                disabled={isOffline}
                className={`w-full text-gray-900 placeholder-gray-400 text-sm font-medium rounded-full py-2.5 pl-10 pr-20 border outline-none transition-all shadow-inner ${
                  isOffline
                    ? 'bg-gray-100/70 border-gray-200 cursor-not-allowed text-gray-400'
                    : 'bg-gray-100/80 hover:bg-gray-100 focus:bg-white border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                }`}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title="Voice Search"
                  className={`p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition ${isVoiceListening ? 'text-emerald-600 animate-pulse bg-emerald-100' : ''}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Auto-complete Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.products.length > 0 ? (
                  <div className="p-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                      <span>Matching Products</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>

                    <div className="divide-y divide-gray-100">
                      {suggestions.products.map(prod => (
                        <div
                          key={prod._id}
                          onClick={() => {
                            navigate(`/products/${prod._id}`);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-emerald-50/60 rounded-xl cursor-pointer transition group"
                        >
                          <img src={prod.images?.[0]} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 truncate">{prod.name}</p>
                            <p className="text-xs text-gray-400">{prod.brand} • {prod.weight}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-700">₹{prod.price}</span>
                            {prod.originalPrice > prod.price && (
                              <span className="text-xs text-gray-400 line-through ml-1">₹{prod.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Category tags matching search */}
                    {suggestions.categories.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">Categories</span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.categories.map((cat, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                navigate(`/products?category=${encodeURIComponent(cat)}`);
                                setIsSearchOpen(false);
                              }}
                              className="text-xs font-medium bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 px-2.5 py-1 rounded-full transition"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brand tags matching search */}
                    {suggestions.brands && suggestions.brands.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">Official Brands</span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.brands.map((b, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                navigate(`/products?brand=${encodeURIComponent(b)}`);
                                setIsSearchOpen(false);
                              }}
                              className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full transition flex items-center gap-1"
                            >
                              <span>🏷️</span>
                              <span>{b}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No matching products found for "<span className="font-semibold text-gray-800">{searchQuery}</span>"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons: SuperCoins, Wishlist, Account, Cart */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* SuperCoins Badge Pill */}
            <button
              onClick={() => setIsCoinsModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300/80 hover:border-amber-400 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm hover:scale-105"
            >
              <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{user ? user.coins : 250}</span>
              <span className="text-[10px] text-amber-700">Coins</span>
            </button>

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition relative hidden md:block"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* User Account / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-gray-800 hidden lg:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {user.role} Account
                      </span>
                    </div>

                    <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700">
                      My Orders & Profile
                    </Link>
                    <Link to="/wishlist" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700">
                      Wishlist
                    </Link>

                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100">
                        ⚡ Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            {/* Cart Button (My Basket) */}
            <button
              onClick={() => {
                if (isOffline) {
                  alert("You are currently offline. Big Market live cart and delivery checkout require an active internet connection.");
                  return;
                }
                setIsCartOpen(true);
              }}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition hover:scale-105 active:scale-95 cursor-pointer ${
                isOffline
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30'
              }`}
              title={isOffline ? 'Cart locked while offline' : 'Open My Basket'}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItemCount > 0 && !isOffline && (
                  <span className="absolute -top-2 -right-2.5 bg-amber-400 text-gray-950 font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs border border-white">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">My Basket</span>
                <span className="text-xs font-black mt-0.5">{isOffline ? 'Locked' : `₹${subtotal}`}</span>
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* Delivery Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Select Delivery Location</h3>
                <p className="text-xs text-gray-500">Fast 15-minute delivery available in these areas</p>
              </div>
            </div>

            {/* Use Current GPS Location Button */}
            <button
              onClick={handleDetectGpsLocation}
              disabled={isGpsLocating}
              className="w-full mb-3 p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-md shadow-emerald-600/30 transition hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2">
                {isGpsLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span>{isGpsLocating ? 'Detecting Live GPS Location...' : 'Auto-Detect My Current GPS Location 📍'}</span>
              </div>
              <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-black">GPS</span>
            </button>

            <div className="space-y-2 mt-2">
              {[
                { city: 'Mumbai', area: 'Bandra West, 400050', deliveryTime: '15 Mins' },
                { city: 'Mumbai', area: 'Andheri East, 400069', deliveryTime: '18 Mins' },
                { city: 'Mumbai', area: 'Powai, Hiranandani, 400076', deliveryTime: '20 Mins' },
                { city: 'Delhi NCR', area: 'Gurugram Phase 5, 122002', deliveryTime: '15 Mins' },
                { city: 'Bengaluru', area: 'Indiranagar 100ft Rd, 560038', deliveryTime: '12 Mins' }
              ].map((loc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setIsLocationModalOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                    selectedLocation.area === loc.area ? 'border-emerald-500 bg-emerald-50/70 font-semibold' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-gray-800">{loc.area}</p>
                    <p className="text-[11px] text-gray-400">{loc.city}</p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    ⚡ {loc.deliveryTime}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Search Modal - Fully User Controlled */}
      {isVoiceListening && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={stopVoiceSearch}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200 text-center border border-gray-100 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar: Close button & Audio Mute Toggle */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isVoiceMuted;
                  setIsVoiceMuted(nextMuted);
                  if (nextMuted && typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 cursor-pointer ${
                  isVoiceMuted 
                    ? 'bg-gray-100 text-gray-500 border-gray-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title={isVoiceMuted ? "Unmute Voice Assistant" : "Mute Voice Assistant"}
              >
                {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />}
                <span>{isVoiceMuted ? 'Voice Muted' : 'Voice Reply ON'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Blinkit & BigBasket Style Voice</span>
                </span>
                <span className="hidden sm:inline text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                  🇮🇳 EN + हिन्दी
                </span>
              </div>

              <button 
                onClick={stopVoiceSearch}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                title="Close Voice Search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Microphone Button (User Controlled) */}
            <div className="my-2 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={toggleRecording}
                className="relative group p-2 rounded-full transition cursor-pointer"
                title={isRecording ? "Click to Pause / Stop Speaking" : "Click to Start Speaking"}
              >
                {isRecording && (
                  <>
                    <span className="animate-ping absolute inset-1 rounded-full bg-emerald-400 opacity-40"></span>
                    <span className="animate-pulse absolute inset-0 rounded-full bg-emerald-500 opacity-20"></span>
                  </>
                )}
                <div className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white transition-transform duration-300 shadow-xl group-hover:scale-105 active:scale-95 ${
                  isRecording
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/40 ring-4 ring-emerald-300'
                    : 'bg-gradient-to-tr from-gray-700 to-slate-800 shadow-gray-500/30 ring-4 ring-gray-200'
                }`}>
                  {isRecording ? (
                    <Mic className="w-8 h-8 sm:w-9 sm:h-9 animate-bounce" />
                  ) : (
                    <MicOff className="w-8 h-8 sm:w-9 sm:h-9 opacity-90" />
                  )}
                </div>
              </button>

              {/* Status indicator under mic */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`mt-1 text-xs font-black tracking-wide px-3 py-1 rounded-full border transition cursor-pointer ${
                  isRecording 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {isRecording ? '🔴 Listening... Tap to Stop' : '🎙️ Mic Paused • Tap to Speak'}
              </button>
            </div>

            {/* Automatic Assistant Response Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 px-3.5 my-2.5 text-left flex items-start gap-2.5 shadow-xs">
              <span className="flex h-7 w-7 rounded-xl bg-emerald-600 text-white items-center justify-center shrink-0 shadow-xs text-sm mt-0.5">
                🤖
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    Assistant Response
                    {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                  </span>
                  {isLoadingRelevant && (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-800 mt-0.5 line-clamp-2">
                  {assistantMessage || (isRecording ? "I am listening. Tell me what product you want!" : "Say an item or select a popular suggestion below.")}
                </p>
              </div>
            </div>

            {/* Editable Voice Transcript Input */}
            <div className="relative my-2.5">
              <input
                type="text"
                value={voiceTranscript}
                onChange={(e) => {
                  const val = e.target.value;
                  setVoiceTranscript(val);
                  setSearchQuery(val);
                  fetchVoiceSuggestions(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitVoiceSearch();
                }}
                placeholder={isRecording ? "Listening to your voice..." : "Speak or type product to search..."}
                className="w-full bg-gray-50 focus:bg-white text-gray-900 font-extrabold text-center text-sm sm:text-base rounded-2xl py-2.5 px-9 border-2 border-emerald-300 focus:border-emerald-600 outline-none transition shadow-xs"
              />
              {voiceTranscript && (
                <button
                  type="button"
                  onClick={() => {
                    setVoiceTranscript('');
                    setSearchQuery('');
                    setVoiceRelevantProducts([]);
                    setVoiceRelevantCategories([]);
                    setAssistantMessage("Ready for next item. Tap mic or say something!");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Waveform graphic when recording & waiting */}
            {isRecording && !voiceTranscript && (
              <div className="flex items-center justify-center gap-1.5 py-1 text-emerald-600">
                <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-6 bg-emerald-600 rounded-full animate-pulse delay-75"></span>
                <span className="w-1.5 h-8 bg-teal-500 rounded-full animate-pulse delay-150"></span>
                <span className="w-1.5 h-5 bg-emerald-500 rounded-full animate-pulse delay-100"></span>
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-emerald-800 ml-1.5">Waiting for your voice...</span>
              </div>
            )}

            {/* Error banner if any */}
            {voiceError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded-xl my-2 text-left">
                {voiceError}
              </div>
            )}

            {/* Relevant Items Section (Displayed automatically on voice detection) */}
            {voiceRelevantProducts.length > 0 && (
              <div className="mt-3 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                    <span>🎯 Relevant Items ({voiceRelevantProducts.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Instant Add Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {voiceRelevantProducts.map((prod) => (
                    <div
                      key={prod._id}
                      onClick={() => {
                        stopVoiceSearch();
                        navigate(`/product/${prod._id}`);
                      }}
                      className="group flex items-center justify-between p-2 rounded-xl border border-gray-200/80 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 transition cursor-pointer shadow-2xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                          alt={prod.name}
                          className="w-11 h-11 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700 transition">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-gray-900">
                              ₹{prod.price}
                            </span>
                            {prod.originalPrice > prod.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{prod.originalPrice}
                              </span>
                            )}
                            {prod.weight && (
                              <span className="text-[10px] text-gray-500 truncate">
                                • {prod.weight}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod, 1);
                          setAddedItemMap(prev => ({ ...prev, [prod._id]: true }));
                          setTimeout(() => {
                            setAddedItemMap(prev => ({ ...prev, [prod._id]: false }));
                          }, 1500);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer active:scale-95 ${
                          addedItemMap[prod._id]
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200'
                        }`}
                        title="Add to Cart"
                      >
                        {addedItemMap[prod._id] ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Categories Pills */}
            {voiceRelevantCategories.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-left">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">
                  Related:
                </span>
                {voiceRelevantCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyQuickVoiceTerm(cat)}
                    className="text-[11px] font-bold bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 px-2 py-0.5 rounded-full border border-gray-200 transition cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 mt-3.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={stopVoiceSearch}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={toggleRecording}
                className="py-2.5 px-3.5 rounded-xl text-xs font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Pause Mic' : 'Speak Again'}</span>
              </button>

              <button
                type="button"
                onClick={() => submitVoiceSearch()}
                disabled={!voiceTranscript.trim() && !searchQuery.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>View All Results 🚀</span>
              </button>
            </div>

            {/* Blinkit & BigBasket Style Voice Instructions & Preset Chips */}
            <div className="mt-3.5 pt-2.5 border-t border-gray-100 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  🎙️ Voice Commands & Indian Grocery Items (Tap to Test):
                </span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Action
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {[
                  { label: 'Open Basket', icon: '🛒', cmd: 'open basket', isAction: true },
                  { label: "Today's Deals", icon: '⚡', cmd: 'show deals', isAction: true },
                  { label: 'Track Order', icon: '🚚', cmd: 'track order', isAction: true },
                  { label: 'Add Milk to Cart', icon: '➕', cmd: 'add milk to cart', isAction: true },
                  { label: 'Doodh / Milk', icon: '🥛', cmd: 'doodh' },
                  { label: 'Aashirvaad Atta', icon: '🌾', cmd: 'aata' },
                  { label: 'Tamatar / Tomato', icon: '🍅', cmd: 'tamatar' },
                  { label: 'Pyaaz / Onion', icon: '🧅', cmd: 'pyaaz' },
                  { label: 'Amul Paneer', icon: '🧀', cmd: 'paneer' },
                  { label: 'Lay\'s Chips', icon: '🍿', cmd: "Lay's Chips" },
                  { label: 'Bourbon Biscuit', icon: '🍪', cmd: 'bourbon' },
                  { label: 'Curd / Dahi', icon: '🥣', cmd: 'dahi' }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setVoiceTranscript(item.cmd);
                      setSearchQuery(item.cmd);
                      processVoiceInstruction(item.cmd);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs ${
                      item.isAction
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-900 border-gray-200'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
