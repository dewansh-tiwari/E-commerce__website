import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShoppingBag, ShieldCheck, MapPin, Navigation, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { detectCurrentLocation } from '../utils/locationHelper';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login, register, setSelectedLocation } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountRole, setAccountRole] = useState('customer'); // 'customer' or 'shopkeeper'
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  // Auto-fetch location as soon as user enters Name and Phone
  useEffect(() => {
    if (authMode !== 'register') return;

    const cleanPhone = phone.replace(/\D/g, '');
    if (name.trim().length >= 2 && cleanPhone.length >= 10 && !detectedLocation && !isLocating) {
      handleFetchLocation();
    }
  }, [name, phone, authMode]);

  const handleFetchLocation = async () => {
    setIsLocating(true);
    setLocationMessage('Detecting your GPS location...');
    try {
      const loc = await detectCurrentLocation();
      setDetectedLocation(loc);
      if (setSelectedLocation) {
        setSelectedLocation(loc);
      }
      setLocationMessage(`Location detected: ${loc.area}`);
    } catch (err) {
      setLocationMessage('Could not detect GPS. Using default store location.');
    } finally {
      setIsLocating(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (authMode === 'register' && !/^\d{9}$/.test(password)) {
      setError('Password must be exactly 9 digits (e.g. 123456789)');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone, detectedLocation, accountRole, storeName);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerDemo = () => {
    setEmail('customer@bigmarket.com');
    setPassword('123456789');
    setAuthMode('login');
  };

  const fillShopkeeperDemo = () => {
    setEmail('shopkeeper@bigmarket.com');
    setPassword('123456789');
    setAuthMode('login');
  };

  const fillAdminDemo = () => {
    setEmail('admin@bigmarket.com');
    setPassword('987654321');
    setAuthMode('login');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">
            {authMode === 'login' ? 'Welcome Back to Big Market 👌' : 'Create Big Market 👌 Account'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {authMode === 'login' ? 'Sign in to access your cart, rewards & orders' : 'Get +250 Welcome SuperCoins on signup!'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        {/* Quick Demo Pre-fill Bar */}
        <div className="mb-4 p-2 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-amber-900 text-[11px]">Quick Demo Logins:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={fillCustomerDemo}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition"
            >
              Customer
            </button>
            <button
              onClick={fillShopkeeperDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition"
            >
              🏪 Shopkeeper
            </button>
            <button
              onClick={fillAdminDemo}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition"
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'register' && (
            <>
              {/* Account Type Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Select Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountRole('customer')}
                    className={`p-2 rounded-xl border text-xs font-extrabold text-left transition ${
                      accountRole === 'customer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-black">🛒 Retail Customer</p>
                    <p className="text-[10px] text-gray-500 font-normal">250 SuperCoins bonus</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountRole('shopkeeper')}
                    className={`p-2 rounded-xl border text-xs font-extrabold text-left transition ${
                      accountRole === 'shopkeeper'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-black text-indigo-900">🏪 Shopkeeper / B2B</p>
                    <p className="text-[10px] text-indigo-700 font-semibold">Auto ₹500 & ₹1599 OFF</p>
                  </button>
                </div>
              </div>

              {accountRole === 'shopkeeper' && (
                <div>
                  <label className="text-xs font-bold text-indigo-900 block mb-1">Store / Kirana Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gupta Kirana & General Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-indigo-50/50 text-xs font-semibold text-gray-900 px-3.5 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                  />
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Real-time Location Detection Card */}
              <div className="pt-0.5">
                {isLocating ? (
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-pulse">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                    <div>
                      <p className="font-bold">Fetching Live GPS Coordinates...</p>
                      <p className="text-[10px] text-emerald-600">Auto-detecting your delivery address for 10-min delivery</p>
                    </div>
                  </div>
                ) : detectedLocation ? (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-300 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Location Auto-Detected! 📍</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFetchLocation}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-detect
                      </button>
                    </div>
                    <p className="font-semibold text-gray-800 mt-1.5 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{detectedLocation.fullAddress || detectedLocation.area}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ⚡ 10-Minute Express Delivery Active
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={isLocating}
                    className="w-full py-2 px-3 bg-emerald-50/50 hover:bg-emerald-50 border border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-2 transition"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-Detect My Current Location 📍</span>
                  </button>
                )}
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">9-Digit Password</label>
            <div className="relative">
              <input
                type="password"
                required
                maxLength={9}
                pattern="\d{9}"
                placeholder="e.g. 123456789"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-xs font-semibold text-gray-900 px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01] active:scale-98 mt-2"
          >
            {loading ? 'Processing...' : authMode === 'login' ? 'Sign In to Big Market 👌' : 'Create Account (+250 Coins)'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {authMode === 'login' ? (
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <button onClick={() => { setAuthMode('register'); setError(''); }} className="font-bold text-emerald-700 hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-xs text-gray-600">
              Already registered?{' '}
              <button onClick={() => { setAuthMode('login'); setError(''); }} className="font-bold text-emerald-700 hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
