import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gift, CheckCircle2, ArrowRight, Copy, Check, Zap, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const WelcomeOfferBanner = () => {
  const navigate = useNavigate();
  const { welcomeOffer, applyCoupon, subtotal, setIsCartOpen, cartItems } = useCart();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('WELCOME100');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (cartItems.length > 0) {
      applyCoupon('WELCOME100').catch(() => {});
      setIsCartOpen(true);
    }
  };

  if (!welcomeOffer.isEligible) {
    return null; // Don't show to users who completed 3 orders
  }

  const { currentOrderNumber, ordersRemaining } = welcomeOffer;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/30 my-6">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Left Side: Headlines & Benefit Pills */}
        <div className="space-y-4 text-center lg:text-left flex-1">
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/30">
              <Gift className="w-3.5 h-3.5 fill-gray-950" />
              First 3 Orders Welcome Special
            </span>
            <span className="bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Order {currentOrderNumber} of 3 Available
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Get <span className="text-amber-400 underline decoration-amber-400/40">Flat ₹100 OFF</span> on Orders Above ₹199
            </h2>
            <p className="text-sm sm:text-base text-gray-200 mt-1.5 font-medium flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span>+ 100% FREE Express Delivery</span>
              <span>•</span>
              <span>+ FREE Handling & Packaging Charge</span>
            </p>
          </div>

          {/* 3 Steps / Orders Progress */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md pt-1">
            {[1, 2, 3].map((num) => {
              const isPast = num < currentOrderNumber;
              const isCurrent = num === currentOrderNumber;
              return (
                <div
                  key={num}
                  className={`p-2.5 rounded-2xl border text-center transition ${
                    isCurrent
                      ? 'bg-gradient-to-b from-emerald-600/80 to-teal-700/80 border-amber-400/80 shadow-lg ring-2 ring-amber-400/30'
                      : isPast
                        ? 'bg-white/5 border-emerald-600/30 text-emerald-400 opacity-80'
                        : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span>Order {num}</span>
                  </div>
                  <div className="text-xs font-black text-white">
                    {isPast ? 'Completed' : '₹140 Savings'}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Side: Code Pill & CTA */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 w-full lg:w-auto shrink-0">
          
          {/* Coupon Code Pill */}
          <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-emerald-400/30 flex items-center justify-between gap-4 w-full sm:w-auto">
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Use Promo Code</span>
              <span className="text-base font-black tracking-widest text-amber-300">WELCOME100</span>
            </div>
            <button
              onClick={handleCopy}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Applied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Action CTA */}
          <button
            onClick={() => {
              if (cartItems.length > 0 && subtotal > 199) {
                setIsCartOpen(true);
              } else {
                navigate('/products');
              }
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>{cartItems.length > 0 ? (subtotal > 199 ? 'Claim in Cart' : 'Add Items to Reach ₹200') : 'Shop Groceries Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
};
