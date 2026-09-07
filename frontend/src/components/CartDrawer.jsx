import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  X, ShoppingBag, Trash2, ArrowRight, Tag, Sparkles, Plus, Minus, 
  ShieldCheck, Zap, Gift, CheckCircle2, Clock, MapPin, Check, 
  ChevronRight, AlertCircle, Sparkle, Percent
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/api';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { user, setIsAuthModalOpen, selectedLocation } = useAuth();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
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
    standardHandling,
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

  // Fallback curated quick essentials (BigBasket signature add-ons)
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

  // Fetch quick impulse essentials
  useEffect(() => {
    if (isCartOpen) {
      const fetchEssentials = async () => {
        try {
          const res = await productService.getProducts({ limit: 6, isDeal: true });
          if (res.data && res.data.products && res.data.products.length > 0) {
            // Filter out items already in cart
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
    }
  }, [isCartOpen, cartItems.length]);

  if (!isCartOpen) return null;

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
    setIsCartOpen(false);
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

  const handleClearAll = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#f8fafc] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* BigBasket Header */}
          <div className="bg-white border-b border-gray-100 shadow-2xs">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                      My Basket
                    </h2>
                    <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {selectedLocation ? selectedLocation.area : 'Indiranagar, Bengaluru'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Empty Basket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  title="Close Cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Delivery Slot Indicator (BigBasket style: 10-15 Min Instant Delivery) */}
            <div className="bg-emerald-50/80 px-4 py-2 border-t border-emerald-100/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Delivery in <strong className="text-emerald-950 font-black">10-15 mins</strong></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                ⚡ bb express
              </span>
            </div>
          </div>

          {/* Confirm Empty Basket Modal */}
          {showClearConfirm && (
            <div className="bg-red-50 border-b border-red-200 p-3.5 px-4 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Empty all {totalItemCount} items from your basket?</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold px-3 py-1 rounded-lg transition"
                >
                  Yes, Empty
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="bg-white border border-gray-300 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Milestone Free Delivery & Welcome Offer Bar */}
          {cartItems.length > 0 && (
            welcomeOffer.isEligible ? (
              welcomeOffer.isApplied ? (
                <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-3 px-4 flex items-center justify-between gap-2 shadow-xs border-b border-emerald-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-sm shadow-sm">
                      🎁
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>Welcome Offer Applied! (Order {welcomeOffer.currentOrderNumber}/3)</span>
                      </div>
                      <p className="text-[11px] text-emerald-100 font-medium">
                        Flat ₹100 OFF + FREE Delivery + FREE Handling unlocked
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                    SAVED ₹140
                  </span>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-200 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>First 3 Orders Welcome Offer</span>
                    </span>
                    <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300">
                      Order {welcomeOffer.currentOrderNumber} of 3
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium">
                    Add items worth <strong className="text-emerald-800 font-black">₹{welcomeOffer.amountNeeded}</strong> more to unlock <strong className="text-gray-950 font-extrabold">Flat ₹100 OFF + FREE Delivery</strong>!
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
              <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    {amountToFreeDelivery === 0 ? '🎉 You unlocked FREE Express Delivery!' : `Add ₹${amountToFreeDelivery} more for FREE Delivery`}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold">₹{subtotal} / ₹{FREE_DELIVERY_THRESHOLD}</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )
          )}

          {/* BigBasket Signature Savings Highlight Strip */}
          {cartItems.length > 0 && totalSavings > 0 && (
            <div className="bg-emerald-100/90 text-emerald-950 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs font-extrabold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Your Total Basket Savings:</span>
              </span>
              <span className="text-emerald-800 font-black text-sm bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                ₹{totalSavings}
              </span>
            </div>
          )}

          {/* Scrollable Cart Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            
            {/* Empty State */}
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="w-24 h-24 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 shadow-inner">
                  <ShoppingBag className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Your basket is empty</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                  Stock up on fresh vegetables, milk, groceries & snacks delivered in 10-15 mins!
                </p>
                <button
                  onClick={() => { setIsCartOpen(false); navigate('/products'); }}
                  className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-3 rounded-2xl transition shadow-md shadow-emerald-600/30 active:scale-95"
                >
                  Browse Fresh Groceries
                </button>
              </div>
            ) : (
              <>
                {/* Items List (BigBasket Card Style) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-gray-700 px-1">
                    <span>Items in Basket ({totalItemCount})</span>
                    <span className="text-[11px] font-bold text-gray-400">Subtotal: ₹{subtotal}</span>
                  </div>

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
                      <div 
                        key={itemId} 
                        className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition flex gap-3 items-center group"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="max-w-full max-h-full object-contain" 
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Grocery';
                            }}
                          />
                        </div>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                            {item.brand || 'Big Market'}
                          </span>
                          <h4 className="text-xs font-bold text-gray-900 truncate leading-snug" title={item.name}>
                            {item.name}
                          </h4>

                          {/* Pack Size Badge */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {displaySize && (
                              <span className="bg-gray-100 text-gray-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-gray-200/80">
                                📏 {displaySize}
                              </span>
                            )}
                            {discountPercent > 0 && (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200/60">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>

                          {/* Pricing & Savings */}
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xs font-black text-gray-950">
                              ₹{item.price * item.quantity}
                            </span>
                            {item.originalPrice > item.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{item.originalPrice * item.quantity}
                              </span>
                            )}
                            {itemSavings > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700">
                                Save ₹{itemSavings}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* BigBasket Stepper (+ / - / Trash) */}
                        <div className="flex items-center bg-emerald-50/80 border border-emerald-200 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="p-1.5 px-2 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                            title={item.quantity === 1 ? 'Remove from basket' : 'Decrease quantity'}
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="px-2 text-xs font-black text-emerald-950 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="p-1.5 px-2 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BigBasket Signature "Missed Something?" Daily Essentials Carousel */}
                {missedItems.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">✨</span>
                        <h4 className="text-xs font-black text-gray-900 tracking-tight">
                          Missed Something? Daily Essentials
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        1-Tap Add
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                      {missedItems.map((item) => (
                        <div 
                          key={item._id}
                          className="w-28 shrink-0 bg-gray-50/80 p-2 rounded-xl border border-gray-100 flex flex-col justify-between hover:border-emerald-300 transition"
                        >
                          <div className="w-full h-16 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1 mb-1">
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
                            <h5 className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight" title={item.name}>
                              {item.name}
                            </h5>
                            <span className="text-[9px] text-gray-500 font-semibold block mt-0.5">
                              {item.weight || 'Standard'}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between pt-1 border-t border-gray-200/60">
                            <span className="text-[11px] font-black text-gray-900">
                              ₹{item.price}
                            </span>
                            <button
                              onClick={() => handleQuickAdd(item)}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition shadow-2xs ${
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

                {/* Delivery Instructions & No-Contact Toggle */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
                  <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Delivery Instructions</span>
                  </h4>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={noContactDelivery}
                      onChange={(e) => setNoContactDelivery(e.target.checked)}
                      className="mt-0.5 accent-emerald-600 rounded"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-800 block">No-Contact Doorstep Delivery</span>
                      <span className="text-gray-500 font-medium">Partner will ring the bell and leave the parcel safely at your door.</span>
                    </div>
                  </label>
                </div>

                {/* BigBasket Quality & On-Time Guarantee Badges */}
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-[11px]">
                    <span className="font-black text-emerald-950 block">100% Quality & Freshness Guarantee</span>
                    <span className="text-emerald-800 font-medium">Not satisfied with freshness? Return at doorstep, zero questions asked!</span>
                  </div>
                </div>

                {/* Apply Coupon & Promo Vouchers */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>Apply Coupon / Vouchers</span>
                    </div>
                  </div>

                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            className="w-full bg-gray-50 text-xs font-bold text-gray-800 placeholder-gray-400 px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 focus:bg-white transition"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isApplyingCoupon || !couponCodeInput.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-sm"
                        >
                          Apply
                        </button>
                      </form>

                      {/* 1-Tap Coupon Chips */}
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
                            className={`text-[10px] font-black px-2 py-1 rounded-lg transition flex items-center gap-1 active:scale-95 border ${
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
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-emerald-900 font-extrabold">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Code '{appliedCoupon.code}' applied (-₹{appliedCoupon.discountAmount})</span>
                      </div>
                      <button 
                        onClick={removeCoupon} 
                        className="text-xs font-black text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && <p className="text-[11px] font-bold text-red-600">{couponError}</p>}
                </div>

                {/* BigBasket Bill Details Breakdown */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2 text-xs">
                  <h4 className="font-black text-gray-900 tracking-tight text-xs uppercase text-gray-400">
                    Bill Details
                  </h4>

                  {/* MRP Item Total */}
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total (MRP)</span>
                    <span className="font-bold text-gray-800">₹{originalSubtotal}</span>
                  </div>

                  {/* Product Discount */}
                  {itemDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Product Savings on MRP</span>
                      <span>-₹{itemDiscount}</span>
                    </div>
                  )}

                  {/* First 3 Orders Welcome Discount */}
                  {welcomeOffer.isApplied && (
                    <div className="flex justify-between text-emerald-800 font-black bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Welcome Discount (Order {welcomeOffer.currentOrderNumber}/3)</span>
                      </span>
                      <span>-₹{welcomeOffer.discountValue}</span>
                    </div>
                  )}

                  {/* Coupon Discount */}
                  {appliedCoupon && appliedCoupon.code !== 'WELCOME100' && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-₹{appliedCoupon.discountAmount}</span>
                    </div>
                  )}

                  {/* Delivery Charge */}
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center gap-1">
                      <span>Delivery Charge</span>
                      {deliveryFee === 0 && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded">
                          FREE
                        </span>
                      )}
                    </span>
                    <div>
                      {deliveryFee === 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="line-through text-gray-400 text-[10px]">₹25</span>
                          <span className="text-emerald-700 font-black">FREE</span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-800">₹{deliveryFee}</span>
                      )}
                    </div>
                  </div>

                  {/* Handling & Packaging */}
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center gap-1">
                      <span>Handling & Packaging</span>
                      {taxesAndHandling === 0 && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded">
                          FREE
                        </span>
                      )}
                    </span>
                    <div>
                      {taxesAndHandling === 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="line-through text-gray-400 text-[10px]">₹15</span>
                          <span className="text-emerald-700 font-black">FREE</span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-800">₹{taxesAndHandling}</span>
                      )}
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="pt-2.5 mt-2 border-t border-gray-100 flex justify-between items-center text-sm font-black text-gray-900">
                    <div>
                      <span>To Pay</span>
                      <span className="block text-[10px] font-bold text-emerald-700">
                        Inclusive of all taxes
                      </span>
                    </div>
                    <span className="text-lg font-black text-emerald-700">
                      ₹{finalTotal}
                    </span>
                  </div>

                  {/* Total Savings Note */}
                  {totalSavings > 0 && (
                    <div className="bg-emerald-50 text-emerald-900 font-black text-[11px] p-2 rounded-xl text-center border border-emerald-200">
                      🎉 You saved a total of ₹{totalSavings} on this order!
                    </div>
                  )}
                </div>

                {/* View Full Cart Page Link */}
                <div className="text-center pt-1">
                  <button
                    onClick={() => { setIsCartOpen(false); navigate('/cart'); }}
                    className="text-xs font-bold text-gray-500 hover:text-emerald-700 underline transition cursor-pointer"
                  >
                    View detailed basket page →
                  </button>
                </div>
              </>
            )}

          </div>

          {/* Sticky Bottom BigBasket Checkout Action Bar */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200 shadow-xl space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-5 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-between transition hover:scale-[1.01] active:scale-98 cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="text-base font-black">₹{finalTotal}</span>
                  <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} • TOTAL
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-black">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
