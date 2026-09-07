import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, Trash2, ArrowRight, Tag, Sparkles, Plus, Minus, 
  ShieldCheck, Zap, Gift, CheckCircle2, Clock, MapPin, Check, 
  ChevronRight, AlertCircle, Home, Truck, RefreshCw
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/api';

export const CartPage = () => {
  const navigate = useNavigate();
  const { user, setIsAuthModalOpen, selectedLocation } = useAuth();
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    originalSubtotal,
    itemDiscount,
    deliveryFee,
    standardDeliveryFee,
    amountToFreeDelivery,
    FREE_DELIVERY_THRESHOLD,
    taxesAndHandling,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    finalTotal,
    totalItemCount,
    welcomeOffer,
    totalSavings
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [noContactDelivery, setNoContactDelivery] = useState(false);
  const [missedItems, setMissedItems] = useState([]);
  const [addedItemIds, setAddedItemIds] = useState({});

  const fallbackMissedItems = [
    {
      _id: 'essential_milk_toned',
      name: 'Amul Taaza Toned Fresh Milk',
      brand: 'Amul',
      price: 27,
      originalPrice: 28,
      weight: '500 ml',
      images: ['https://www.bigbasket.com/media/uploads/p/l/306926_4-amul-taaza-homogenised-toned-milk.jpg']
    },
    {
      _id: 'essential_curd_masti',
      name: 'Amul Masti Fresh Dahi / Curd',
      brand: 'Amul',
      price: 35,
      originalPrice: 38,
      weight: '400 g',
      images: ['https://www.bigbasket.com/media/uploads/p/l/40087532_3-amul-masti-dahi.jpg']
    },
    {
      _id: 'essential_lemon_pack',
      name: 'Fresh Nimbu / Lemons - Farm Fresh',
      brand: 'Fresh Produce',
      price: 20,
      originalPrice: 28,
      weight: '4 pcs',
      images: ['https://www.bigbasket.com/media/uploads/p/l/10000127_17-fresho-lemon.jpg']
    },
    {
      _id: 'essential_coriander',
      name: 'Farm Fresh Green Coriander Leaves',
      brand: 'Fresho',
      price: 15,
      originalPrice: 22,
      weight: '100 g',
      images: ['https://www.bigbasket.com/media/uploads/p/l/10000098_9-fresho-coriander-leaves.jpg']
    },
    {
      _id: 'essential_bread_wheat',
      name: 'English Oven 100% Whole Wheat Bread',
      brand: 'English Oven',
      price: 45,
      originalPrice: 50,
      weight: '400 g',
      images: ['https://www.bigbasket.com/media/uploads/p/l/40009472_4-english-oven-brown-bread.jpg']
    },
    {
      _id: 'essential_maggi_noodles',
      name: 'Maggi 2-Minute Masala Instant Noodles',
      brand: 'Nestle',
      price: 14,
      originalPrice: 15,
      weight: '70 g',
      images: ['https://www.bigbasket.com/media/uploads/p/l/266109_15-maggi-2-minute-instant-noodles-masala.jpg']
    }
  ];

  useEffect(() => {
    const fetchEssentials = async () => {
      try {
        const res = await productService.getProducts({ limit: 6, isDeal: true });
        if (res.data && res.data.products && res.data.products.length > 0) {
          const inCartIds = new Set(cartItems.map(i => i.product));
          const available = res.data.products.filter(p => !inCartIds.has(p._id));
          setMissedItems(available.length >= 3 ? available.slice(0, 6) : fallbackMissedItems);
        } else {
          setMissedItems(fallbackMissedItems);
        }
      } catch (_) {
        setMissedItems(fallbackMissedItems);
      }
    };
    fetchEssentials();
  }, [cartItems.length]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCodeInput.trim());
      setCouponCodeInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      navigate('/checkout');
    }
  };

  const handleQuickAdd = (item) => {
    addToCart(item, 1, item.weight || 'Standard');
    setAddedItemIds(prev => ({ ...prev, [item._id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [item._id]: false }));
    }, 1800);
  };

  return (
    <div className="py-6 space-y-6">
      {/* Breadcrumb Navigation with Home Button */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-gray-500 overflow-x-auto py-1">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition shadow-2xs shrink-0"
          title="Return to Homepage"
        >
          <Home className="w-3.5 h-3.5 text-emerald-600" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-gray-900 font-black">My Basket ({totalItemCount} Items)</span>
      </nav>

      {/* Main Container */}
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Your basket is empty</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Your shopping basket is currently empty. Explore fresh groceries, dairy, vegetables, and daily essentials delivered in 10-15 minutes!
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/products')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              Start Shopping Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Items, Delivery Slot, Add-ons) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Delivery Slot Header */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900">
                      Express 10-15 Min Delivery
                    </h2>
                    <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                      ⚡ bb express
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivering to: <strong className="text-gray-800">{selectedLocation?.area || 'Indiranagar, Bengaluru'}</strong></span>
                  </p>
                </div>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 transition self-start sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Empty Basket</span>
                </button>
              )}
            </div>

            {/* Clear Basket Confirmation */}
            {showClearConfirm && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Are you sure you want to remove all items from your basket?</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { clearCart(); setShowClearConfirm(false); }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition"
                  >
                    Yes, Empty
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-white border border-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Basket Items List */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Basket Items ({totalItemCount})
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  Subtotal: ₹{subtotal}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const itemId = item.cartItemId || item.product;
                  const displaySize = item.selectedSize || item.weight;
                  const itemSavings = (item.originalPrice && item.originalPrice > item.price)
                    ? (item.originalPrice - item.price) * item.quantity
                    : 0;
                  const discountPercent = (item.originalPrice && item.originalPrice > item.price)
                    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                    : 0;

                  return (
                    <div key={itemId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Grocery';
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                            {item.brand || 'Big Market'}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 truncate" title={item.name}>
                            {item.name}
                          </h4>

                          <div className="flex items-center gap-2 mt-1">
                            {displaySize && (
                              <span className="bg-gray-100 text-gray-700 text-xs font-extrabold px-2.5 py-0.5 rounded-lg border border-gray-200">
                                📏 {displaySize}
                              </span>
                            )}
                            {discountPercent > 0 && (
                              <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2 py-0.5 rounded-lg border border-emerald-200">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Stepper Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-24 sm:pl-0">
                        {/* Stepper */}
                        <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="p-2 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                            title={item.quantity === 1 ? 'Remove from basket' : 'Decrease quantity'}
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>
                          <span className="px-3 text-xs font-black text-emerald-950 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="p-2 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-right min-w-[80px]">
                          <div className="text-sm font-black text-gray-900">
                            ₹{item.price * item.quantity}
                          </div>
                          {item.originalPrice > item.price && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{item.originalPrice * item.quantity}
                            </div>
                          )}
                          {itemSavings > 0 && (
                            <div className="text-[10px] font-bold text-emerald-700">
                              Save ₹{itemSavings}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* BigBasket Signature "Missed Something?" Section */}
            {missedItems.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <h3 className="text-sm font-black text-gray-900 tracking-tight">
                      Before You Checkout — Daily Essentials
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase">
                    1-Tap Add
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {missedItems.map((item) => (
                    <div 
                      key={item._id}
                      className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 flex flex-col justify-between hover:border-emerald-300 transition shadow-2xs"
                    >
                      <div className="w-full h-20 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 mb-1.5">
                        <img 
                          src={item.images?.[0] || 'https://via.placeholder.com/100'} 
                          alt={item.name} 
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=Item';
                          }}
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-emerald-800 block truncate">
                          {item.brand}
                        </span>
                        <h5 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight" title={item.name}>
                          {item.name}
                        </h5>
                        <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                          {item.weight || 'Standard'}
                        </span>
                      </div>
                      
                      <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-gray-200">
                        <span className="text-xs font-black text-gray-900">
                          ₹{item.price}
                        </span>
                        <button
                          onClick={() => handleQuickAdd(item)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition shadow-2xs ${
                            addedItemIds[item._id]
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400'
                          }`}
                        >
                          {addedItemIds[item._id] ? '✓ Added' : '+ ADD'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Instructions */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>📦</span>
                <span>Delivery Instructions</span>
              </h4>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={noContactDelivery}
                  onChange={(e) => setNoContactDelivery(e.target.checked)}
                  className="mt-1 accent-emerald-600 rounded"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-gray-800 block">No-Contact Doorstep Delivery</span>
                  <span className="text-gray-500 font-medium">Delivery partner will ring bell & safely place parcel at doorstep.</span>
                </div>
              </label>
            </div>

          </div>

          {/* Right Column (Coupons, Bill Details, Checkout Action) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-24">
            
            {/* Free Delivery & Welcome Offer Milestones */}
            {welcomeOffer.isEligible ? (
              welcomeOffer.isApplied ? (
                <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 rounded-3xl border border-emerald-700 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-lg">
                      🎁
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-300">
                        First 3 Orders Welcome Offer Applied!
                      </h4>
                      <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                        Order {welcomeOffer.currentOrderNumber} of 3: Flat ₹100 OFF + FREE Delivery
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black bg-amber-400 text-gray-950 px-2.5 py-1 rounded-full shrink-0">
                    SAVED ₹140
                  </span>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-3xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>Welcome Offer Available</span>
                    </span>
                    <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full">
                      Order {welcomeOffer.currentOrderNumber}/3
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    Add items worth <strong className="text-emerald-800 font-black">₹{welcomeOffer.amountNeeded}</strong> more to unlock <strong className="text-gray-950">Flat ₹100 OFF + FREE Delivery + FREE Handling</strong>!
                  </p>
                  <div className="w-full h-2 bg-amber-200/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / 200) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    {amountToFreeDelivery === 0 ? '🎉 You unlocked FREE Delivery!' : `Add ₹${amountToFreeDelivery} more for FREE Delivery`}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">₹{subtotal}/₹{FREE_DELIVERY_THRESHOLD}</span>
                </div>
                <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Coupons & Promo Vouchers */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-gray-900">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Apply Coupons / Offers</span>
              </div>

              {!appliedCoupon ? (
                <div className="space-y-2.5">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-gray-50 text-xs font-bold text-gray-800 placeholder-gray-400 px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponCodeInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[
                      { code: 'WELCOME100', label: 'Flat ₹100', highlight: true },
                      { code: 'HAPPYHOURS', label: '25% OFF', highlight: false },
                      { code: 'SAVE50', label: 'Flat ₹50', highlight: false }
                    ].map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => applyCoupon(c.code)}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition flex items-center gap-1 active:scale-95 border cursor-pointer ${
                          c.highlight
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300 ring-1 ring-emerald-400/30'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                        }`}
                      >
                        <span>🏷️ {c.code}</span>
                        <span className="text-emerald-700">({c.label})</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-3 rounded-2xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-black">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Coupon '{appliedCoupon.code}' applied (-₹{appliedCoupon.discountAmount})</span>
                  </div>
                  <button 
                    onClick={removeCoupon} 
                    className="text-xs font-black text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && <p className="text-xs font-bold text-red-600">{couponError}</p>}
            </div>

            {/* BigBasket Bill Details Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-3 text-xs">
              <h4 className="font-black text-gray-900 uppercase tracking-wider text-xs border-b border-gray-100 pb-2">
                Bill Details
              </h4>

              <div className="flex justify-between text-gray-600">
                <span>Item Total (MRP)</span>
                <span className="font-bold text-gray-800">₹{originalSubtotal}</span>
              </div>

              {itemDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Product Savings on MRP</span>
                  <span>-₹{itemDiscount}</span>
                </div>
              )}

              {welcomeOffer.isApplied && (
                <div className="flex justify-between text-emerald-800 font-black bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span>Welcome Discount (Order {welcomeOffer.currentOrderNumber}/3)</span>
                  </span>
                  <span>-₹{welcomeOffer.discountValue}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.code !== 'WELCOME100' && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Delivery Charge</span>
                  {deliveryFee === 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">
                      FREE
                    </span>
                  )}
                </span>
                <div>
                  {deliveryFee === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-gray-400 text-xs">₹25</span>
                      <span className="text-emerald-700 font-black">FREE</span>
                    </div>
                  ) : (
                    <span className="font-bold text-gray-800">₹{deliveryFee}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Handling & Packaging</span>
                  {taxesAndHandling === 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">
                      FREE
                    </span>
                  )}
                </span>
                <div>
                  {taxesAndHandling === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-gray-400 text-xs">₹15</span>
                      <span className="text-emerald-700 font-black">FREE</span>
                    </div>
                  ) : (
                    <span className="font-bold text-gray-800">₹{taxesAndHandling}</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-black text-gray-900">
                <div>
                  <span className="text-base">To Pay</span>
                  <span className="block text-[11px] font-bold text-emerald-700">
                    Inclusive of all taxes
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-700">
                  ₹{finalTotal}
                </span>
              </div>

              {totalSavings > 0 && (
                <div className="bg-emerald-50 text-emerald-900 font-black text-xs p-3 rounded-2xl text-center border border-emerald-200">
                  🎉 Total Savings: You saved ₹{totalSavings} on this order!
                </div>
              )}

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-between transition hover:scale-[1.01] active:scale-98 cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-base font-black">₹{finalTotal}</span>
                    <span className="block text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                      {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-black">
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>

            {/* Doorstep Return & Quality Guarantee */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <span className="font-black text-gray-900 block">100% Quality & Freshness Guarantee</span>
                <span className="text-gray-500 font-medium">Return any item at the doorstep with zero hassle if you are not satisfied.</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
