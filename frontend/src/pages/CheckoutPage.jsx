import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Coins, Plus, Sparkles, Building, Home, Briefcase, X, Loader2, Navigation, RefreshCw, Phone, User as UserIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService, userService } from '../services/api';
import { detectCurrentLocation } from '../utils/locationHelper';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const {
    cartItems,
    subtotal,
    deliveryFee,
    taxesAndHandling,
    appliedCoupon,
    clearCart,
    redeemCoins,
    setRedeemCoins,
    coinsDiscount,
    finalTotal,
    welcomeOffer,
    refreshOrderCount
  } = useCart();

  const [activeStep, setActiveStep] = useState(1); // 1: Address, 2: Slot, 3: Payment

  // Step 1: Address
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [newAddr, setNewAddr] = useState({ 
    title: 'Home', 
    name: user?.name || '', 
    phone: user?.phone || '', 
    street: '', 
    apartment: '', 
    city: 'Mumbai', 
    state: 'Maharashtra', 
    zipCode: '400050' 
  });

  // Auto-detect current location when user enters Name & Phone
  useEffect(() => {
    if (!isAddAddressOpen) return;
    const cleanPhone = (newAddr.phone || '').replace(/\D/g, '');
    if (newAddr.name.trim().length >= 2 && cleanPhone.length >= 10 && !newAddr.street && !isLocating) {
      handleAutoFetchLocation();
    }
  }, [newAddr.name, newAddr.phone, isAddAddressOpen]);

  const handleAutoFetchLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Locating your GPS coordinates...');
    try {
      const loc = await detectCurrentLocation();
      setNewAddr(prev => ({
        ...prev,
        street: loc.street || loc.locality || prev.street,
        apartment: loc.area || prev.apartment,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        zipCode: loc.zipCode || prev.zipCode
      }));
      setLocationStatus(`Auto-detected: ${loc.area}`);
    } catch (err) {
      setLocationStatus('Could not detect GPS. Please enter manually.');
    } finally {
      setIsLocating(false);
    }
  };

  // Step 2: Slot
  const [deliverySlot, setDeliverySlot] = useState({ type: 'express', timeSlot: '15-25 Minutes' });

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, netbanking, cod
  const [upiId, setUpiId] = useState('rahul@okicici');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (cartItems.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl">
          Shop Products
        </button>
      </div>
    );
  }

  const addresses = user?.addresses?.length ? user.addresses : [
    {
      _id: 'default-1',
      title: 'Home',
      name: user?.name || 'Rahul Sharma',
      phone: user?.phone || '+91 98123 45678',
      street: 'Flat 402, Green Meadows, Link Road',
      apartment: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050'
    }
  ];

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.addAddress(newAddr);
      setUser({ ...user, addresses: res.data });
      setIsAddAddressOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);
      setError('');

      const selectedAddress = addresses[selectedAddressIndex] || addresses[0];

      const discountAmount = (appliedCoupon && appliedCoupon.code !== 'WELCOME100' ? appliedCoupon.discountAmount : 0) + (welcomeOffer?.isApplied ? welcomeOffer.discountValue : 0);

      const orderPayload = {
        items: cartItems,
        shippingAddress: selectedAddress,
        deliverySlot,
        paymentMethod,
        subtotal,
        discountAmount,
        deliveryFee,
        taxes: taxesAndHandling,
        coinsRedeemed: redeemCoins,
        coinsDiscount,
        totalAmount: finalTotal
      };

      const res = await orderService.createOrder(orderPayload);
      clearCart();
      if (refreshOrderCount) refreshOrderCount();
      navigate(`/order-success?orderId=${res.data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-8 space-y-8 max-w-5xl mx-auto">
      
      {/* Checkout Stepper Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        {[
          { step: 1, title: 'Delivery Address', icon: MapPin },
          { step: 2, title: 'Delivery Slot', icon: Clock },
          { step: 3, title: 'Payment Method', icon: CreditCard }
        ].map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.step;
          const isDone = activeStep > s.step;

          return (
            <div key={s.step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
                isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.step}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Steps Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: Address Selection */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>1. Select Delivery Address</span>
              </h2>
              <button
                onClick={() => setIsAddAddressOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAddressIndex(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    selectedAddressIndex === idx ? 'border-emerald-600 bg-emerald-50/70 shadow-xs' : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-1">
                        {addr.title === 'Home' ? <Home className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                        {addr.title}
                      </span>
                      {selectedAddressIndex === idx && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs font-bold text-gray-900">{addr.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{addr.street}, {addr.apartment}</p>
                    <p className="text-xs text-gray-500">{addr.city}, {addr.state} - {addr.zipCode}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 mt-2 block">📞 {addr.phone}</span>
                </div>
              ))}
            </div>

            {activeStep === 1 && (
              <button
                onClick={() => setActiveStep(2)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition"
              >
                Deliver Here & Continue ➔
              </button>
            )}
          </div>

          {/* STEP 2: Delivery Slot */}
          <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 ${activeStep < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>2. Choose Delivery Slot</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: 'express', timeSlot: '15-25 Minutes', title: '⚡ Express Delivery', desc: 'Instant fulfillment' },
                { type: 'standard', timeSlot: 'Today, 6 - 8 PM', title: '🌆 Today Evening', desc: 'Standard slot' },
                { type: 'scheduled', timeSlot: 'Tomorrow, Morning', title: '📅 Tomorrow Morning', desc: 'Scheduled delivery' }
              ].map((slot, i) => (
                <div
                  key={i}
                  onClick={() => setDeliverySlot(slot)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    deliverySlot.type === slot.type ? 'border-emerald-600 bg-emerald-50/70 font-bold' : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <p className="text-xs font-extrabold text-gray-900">{slot.title}</p>
                  <p className="text-xs text-emerald-700 font-bold mt-1">{slot.timeSlot}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{slot.desc}</p>
                </div>
              ))}
            </div>

            {activeStep === 2 && (
              <button
                onClick={() => setActiveStep(3)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition"
              >
                Proceed to Payment ➔
              </button>
            )}
          </div>

          {/* STEP 3: Payment Method & SuperCoins */}
          <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 ${activeStep < 3 ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>3. Select Payment Method</span>
            </h2>

            {/* Redeem SuperCoins Gamification Bar */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-3.5 rounded-2xl border border-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500 fill-amber-400" />
                <div>
                  <span className="text-xs font-bold text-amber-900">Use SuperCoins 🪙</span>
                  <p className="text-[11px] text-amber-700">Balance: {user?.coins || 250} Coins (100 Coins = ₹10 Discount)</p>
                </div>
              </div>
              <button
                onClick={() => setRedeemCoins(redeemCoins === 0 ? Math.min(user?.coins || 250, 200) : 0)}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition ${
                  redeemCoins > 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-amber-900 border-amber-300'
                }`}
              >
                {redeemCoins > 0 ? `Applied (-₹${coinsDiscount})` : 'Redeem Coins'}
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              {[
                { id: 'upi', name: 'Instant UPI (GPay, PhonePe, Paytm)', desc: 'Fast & Secure instant payment' },
                { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay' },
                { id: 'netbanking', name: 'Net Banking', desc: 'All major Indian banks' },
                { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Pay cash/UPI to delivery agent' }
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === m.id ? 'border-emerald-600 bg-emerald-50/60 font-bold' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)}
                      className="accent-emerald-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{m.name}</p>
                      <p className="text-[10px] text-gray-500">{m.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transition hover:scale-[1.01] active:scale-98"
            >
              {isProcessing ? 'Processing Order...' : `Pay & Complete Order (₹${finalTotal})`}
            </button>
          </div>

        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 pb-2 border-b border-gray-100">Order Summary ({cartItems.length} items)</h3>
            
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={item.cartItemId || item.product} className="flex items-center gap-3 text-xs">
                  <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span>{item.quantity} x ₹{item.price}</span>
                      {(item.selectedSize || item.weight) && (
                        <span className="bg-emerald-50 text-emerald-800 font-black px-1.5 py-0.2 rounded text-[9px] border border-emerald-200/80 shrink-0">
                          📏 {item.selectedSize || item.weight}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">₹{item.quantity * item.price}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-gray-900">₹{subtotal}</span></div>

              {welcomeOffer?.isApplied && (
                <div className="flex justify-between text-emerald-800 font-extrabold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <span>First 3 Orders Welcome Discount (Order {welcomeOffer.currentOrderNumber}/3)</span>
                  <span>-₹{welcomeOffer.discountValue}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.code !== 'WELCOME100' && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
              )}

              {coinsDiscount > 0 && <div className="flex justify-between text-amber-700 font-semibold"><span>Coins Discount</span><span>-₹{coinsDiscount}</span></div>}

              <div className="flex justify-between items-center">
                <span>Delivery Charge</span>
                <div className="flex items-center gap-1.5">
                  {welcomeOffer?.isApplied ? (
                    <>
                      <span className="line-through text-gray-400 text-[11px]">₹25</span>
                      <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">FREE (Welcome Offer)</span>
                    </>
                  ) : deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-900">₹{deliveryFee}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Handling & Taxes</span>
                <div className="flex items-center gap-1.5">
                  {welcomeOffer?.isApplied ? (
                    <>
                      <span className="line-through text-gray-400 text-[11px]">₹15</span>
                      <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">FREE (Welcome Offer)</span>
                    </>
                  ) : (
                    <span className="font-semibold text-gray-900">₹{taxesAndHandling}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-black text-gray-900">
                <div>
                  <span>Total Amount</span>
                  {welcomeOffer?.isApplied && (
                    <span className="block text-[10px] text-emerald-700 font-bold">
                      🎉 First 3 Orders Mega Savings: ₹{welcomeOffer.savings} saved!
                    </span>
                  )}
                </div>
                <span className="text-emerald-700">₹{finalTotal}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add New Address Modal with GPS Auto-Detection */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddAddressOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Add Delivery Address</h3>
                <p className="text-xs text-gray-500">Auto-fetches your GPS location when name & phone are entered</p>
              </div>
            </div>

            {/* GPS Auto-Detection Banner */}
            <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  Live GPS Auto-Location
                </span>
                <button
                  type="button"
                  onClick={handleAutoFetchLocation}
                  disabled={isLocating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-xs"
                >
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>{isLocating ? 'Detecting...' : 'Detect GPS Now'}</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {locationStatus || 'Enter your Name and Mobile Number below to automatically detect your location.'}
              </p>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 pl-8 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                    />
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 pl-8 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                    />
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Street / House / Building</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Green Meadows"
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Area / Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bandra West"
                    value={newAddr.apartment}
                    onChange={(e) => setNewAddr({ ...newAddr, apartment: e.target.value })}
                    className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    placeholder="400050"
                    maxLength={6}
                    value={newAddr.zipCode}
                    onChange={(e) => setNewAddr({ ...newAddr, zipCode: e.target.value })}
                    className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition"
                >
                  Save & Deliver Here ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
