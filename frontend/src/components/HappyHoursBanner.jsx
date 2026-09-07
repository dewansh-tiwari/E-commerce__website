import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Zap, Copy, Check, Sparkles, ArrowRight, Tag, 
  MapPin, CheckCircle2, ShieldCheck, Truck, PackageCheck, Home, Store
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const HappyHoursBanner = () => {
  const navigate = useNavigate();
  const { applyCoupon, setIsCartOpen, cartItems } = useCart();
  const [copiedCode, setCopiedCode] = useState(null);

  // Dynamic live countdown (e.g. countdown to the end of 4-hour happy hour block)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 48, seconds: 35 });

  // Delivery partner moving and parcel handover animation progress (0% to 100%)
  const [deliveryProgress, setDeliveryProgress] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 3, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth medium-speed rider motion loop
  useEffect(() => {
    const motionInterval = setInterval(() => {
      setDeliveryProgress(prev => {
        if (prev >= 94) {
          return 5; // Loop back to store
        }
        return prev + 1.0;
      });
    }, 90);
    return () => clearInterval(motionInterval);
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);

    if (cartItems.length > 0) {
      applyCoupon(code);
    }
  };

  const pad = (num) => String(num).padStart(2, '0');

  // Stages of transit
  const isPacking = deliveryProgress < 20;
  const isTransit = deliveryProgress >= 20 && deliveryProgress < 82;
  const isDelivered = deliveryProgress >= 82;

  // Calculate pixel-safe horizontal position (clamped between store and doorstep)
  const riderLeftPercent = Math.min(76, Math.max(16, deliveryProgress));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-5 sm:p-7 text-white shadow-2xl border border-emerald-700/40 my-6">
      
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP ROW: HAPPY HOUR BRANDING & COUNTDOWN / COUPON */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 mb-5">
        
        {/* Left: Brand Tag & Offer */}
        <div className="space-y-2 text-center lg:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/25">
              <Zap className="w-3.5 h-3.5 fill-gray-950" />
              Big Market-Style Happy Hour
            </span>
            <span className="bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> Live Now • 10-15 Min Express
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Big Market-Style Happy Hour! Flat <span className="text-amber-300">25% OFF</span>
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            Lightning quick delivery on fresh Groceries, Dairy, Munchies, and <span className="font-bold text-white">Fashion & Lifestyle</span> with our express fleet!
          </p>
        </div>

        {/* Right: Countdown Timer & 1-Click Code */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-black/40 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 text-center w-full lg:w-auto shrink-0">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-amber-300 font-bold mb-1">
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>HAPPY HOUR ENDS IN</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-mono">
              <div className="bg-emerald-950 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-center min-w-[42px]">
                <span className="text-lg font-black text-white">{pad(timeLeft.hours)}</span>
                <span className="text-[8px] block text-emerald-300 font-sans uppercase font-bold">Hrs</span>
              </div>
              <span className="font-bold text-amber-400">:</span>
              <div className="bg-emerald-950 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-center min-w-[42px]">
                <span className="text-lg font-black text-white">{pad(timeLeft.minutes)}</span>
                <span className="text-[8px] block text-emerald-300 font-sans uppercase font-bold">Min</span>
              </div>
              <span className="font-bold text-amber-400">:</span>
              <div className="bg-emerald-950 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-center min-w-[42px]">
                <span className="text-lg font-black text-amber-300">{pad(timeLeft.seconds)}</span>
                <span className="text-[8px] block text-emerald-300 font-sans uppercase font-bold">Sec</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-dashed border-amber-400/70 px-3 py-1.5 rounded-xl">
              <span className="font-mono font-black text-xs sm:text-sm text-amber-300 tracking-wider">
                HAPPYHOURS
              </span>
              <button
                onClick={() => handleCopy('HAPPYHOURS')}
                className="bg-amber-400 hover:bg-amber-300 text-gray-950 text-[10px] font-black px-2.5 py-1 rounded-md transition active:scale-95 shadow cursor-pointer"
                title="Copy Code"
              >
                {copiedCode === 'HAPPYHOURS' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MEDIUM-SIZED ANIMATED DELIVERY PARTNER IN STORE-TO-DOOR TRANSIT */}
      {/* DELIVERING PRODUCT FROM STORE TO CUSTOMER                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 bg-black/45 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-4 shadow-xl overflow-hidden">
        
        {/* Medium Stage Status Bar */}
        <div className="flex items-center justify-between text-xs font-bold pb-3 border-b border-white/10 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="uppercase tracking-wider font-extrabold text-[11px] text-white">
              Live Delivery Simulation: Store to Customer
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-300 font-extrabold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              {isPacking ? '🏬 Step 1: Packing at Store' : isTransit ? '🛵 Step 2: Express Delivery Partner in Transit' : '🎉 Step 3: Product Delivered to Customer!'}
            </span>
            <span className="text-[10px] text-emerald-200 hidden sm:inline">⚡ 10-Min Promise</span>
          </div>
        </div>

        {/* Medium-Sized Road & Delivery Arena (Height: ~160px) */}
        <div className="relative h-40 sm:h-44 w-full mt-2 bg-gradient-to-b from-gray-950 via-slate-900 to-emerald-950/80 rounded-xl border border-emerald-600/30 overflow-hidden flex items-end px-3 sm:px-6">
          
          {/* Distant skyline & street lamps */}
          <div className="absolute top-2 inset-x-0 flex justify-around opacity-20 pointer-events-none">
            <div className="w-8 h-12 bg-white/30 rounded-t-sm"></div>
            <div className="w-12 h-16 bg-white/20 rounded-t-sm"></div>
            <div className="w-10 h-10 bg-white/25 rounded-t-sm"></div>
            <div className="w-14 h-14 bg-white/20 rounded-t-sm"></div>
          </div>

          {/* Asphalt Road with glowing lane marks */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gray-900 border-t-2 border-emerald-500/40">
            <div className="w-full h-full border-b-2 border-dashed border-emerald-400/30 translate-y-3"></div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 1. LEFT: BIG MARKET STORE HUB                              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="relative z-10 bottom-3 flex flex-col items-center shrink-0">
            <div className="text-center mb-1">
              <span className="bg-emerald-900 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-emerald-600/60 shadow-xs">
                STORE HUB
              </span>
            </div>

            {/* Storefront Vector SVG */}
            <svg viewBox="0 0 90 90" className="w-20 sm:w-24 h-20 sm:h-24 filter drop-shadow-md">
              {/* Store Building Base */}
              <rect x="8" y="22" width="74" height="65" rx="5" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
              
              {/* Green & Yellow Striped Awning */}
              <path d="M4 22 L86 22 L80 34 L10 34 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
              <path d="M19 22 L27 22 L24 34 L16 34 Z" fill="#047857" />
              <path d="M37 22 L45 22 L42 34 L34 34 Z" fill="#047857" />
              <path d="M55 22 L63 22 L60 34 L52 34 Z" fill="#047857" />
              <path d="M73 22 L81 22 L78 34 L70 34 Z" fill="#047857" />

              {/* Big Market Signboard */}
              <rect x="12" y="8" width="66" height="14" rx="3" fill="#FACC15" stroke="#B45309" strokeWidth="1" />
              <text x="45" y="18" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#0F172A">BIG MARKET 👌</text>

              {/* Glass Door & Shelves */}
              <rect x="32" y="42" width="26" height="45" rx="2" fill="#34D399" opacity="0.35" stroke="#10B981" strokeWidth="1.5" />
              <rect x="35" y="45" width="20" height="42" rx="1" fill="#FEF08A" opacity="0.25" />
              <line x1="45" y1="42" x2="45" y2="87" stroke="#10B981" strokeWidth="1" />

              {/* Dispatch Counter with Parcel Ready */}
              <rect x="14" y="60" width="14" height="18" rx="2" fill="#D97706" />
              <text x="21" y="72" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFF">📦</text>
            </svg>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 2. CENTER: MOVING DELIVERY PARTNER                          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div 
            className="absolute z-20 bottom-3 transition-all duration-100 flex flex-col items-center"
            style={{ left: `${riderLeftPercent}%` }}
          >
            {/* Floating Live Delivery Pill */}
            <div className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap mb-1 flex items-center gap-1.5 border border-emerald-400 animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Big Market Delivery Partner</span>
              <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1 rounded font-extrabold">EXPRESS</span>
            </div>

            {/* HIGH QUALITY SVG: DELIVERY PARTNER IN OFFICIAL UNIFORM ON SCOOTER */}
            <svg viewBox="0 0 130 105" className="w-28 sm:w-32 h-22 sm:h-26 filter drop-shadow-xl">
              <defs>
                <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Speed Wind Streaks */}
              <path d="M5 68 L24 68 M0 75 L18 75 M10 82 L28 82" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

              {/* Headlight Cone on Road */}
              <polygon points="105,72 135,62 135,88" fill="url(#headlightBeam)" />

              {/* Rear Wheel */}
              <circle cx="28" cy="82" r="14" fill="#111827" stroke="#9CA3AF" strokeWidth="3" />
              <circle cx="28" cy="82" r="5" fill="#4B5563" />
              <line x1="28" y1="72" x2="28" y2="92" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="18" y1="82" x2="38" y2="82" stroke="#E5E7EB" strokeWidth="1.5" />

              {/* Front Wheel */}
              <circle cx="98" cy="82" r="14" fill="#111827" stroke="#9CA3AF" strokeWidth="3" />
              <circle cx="98" cy="82" r="5" fill="#4B5563" />
              <line x1="98" y1="72" x2="98" y2="92" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="88" y1="82" x2="108" y2="82" stroke="#E5E7EB" strokeWidth="1.5" />

              {/* Electric Scooter Chassis */}
              <path d="M28 82 L55 82 L66 75 L95 75" stroke="#059669" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M64 75 L80 38" stroke="#047857" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M75 38 L88 38" stroke="#111827" strokeWidth="4" strokeLinecap="round" />

              {/* BIG MARKET CARRIER BOX WITH PARCEL */}
              <rect x="14" y="42" width="28" height="26" rx="4" fill="#047857" stroke="#10B981" strokeWidth="2" />
              <rect x="18" y="46" width="20" height="18" rx="2" fill="#FACC15" />
              <text x="28" y="58" textAnchor="middle" fontSize="8" fontWeight="900" fill="#0F172A">BM 📦</text>

              {/* ─────────────────────────────────────────────────── */}
              {/* RIDER WEARING OFFICIAL BIG MARKET GREEN UNIFORM     */}
              {/* ─────────────────────────────────────────────────── */}
              {/* Legs & Dark Pants */}
              <path d="M48 58 L58 72 L68 72" stroke="#1E293B" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="65" y="70" width="10" height="4" rx="2" fill="#0F172A" />

              {/* Official Big Market Green Uniform Torso */}
              <path d="M45 36 L64 40 L60 59 L43 56 Z" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              
              {/* "BIG MARKET" Text across Uniform */}
              <text x="53" y="50" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FFFFFF" transform="rotate(12 53 50)">
                BIG MARKET
              </text>

              {/* Green Uniform Sleeve */}
              <path d="M52 38 L68 44" stroke="#059669" strokeWidth="7" strokeLinecap="round" />
              {/* Arm reaching to Handlebar */}
              <path d="M64 43 L80 38" stroke="#FDBA74" strokeWidth="4.5" strokeLinecap="round" />
              {/* Hand on Grip */}
              <circle cx="80" cy="38" r="3.5" fill="#FDBA74" />

              {/* Neck */}
              <rect x="53" y="30" width="6" height="7" fill="#FDBA74" rx="1" />

              {/* Friendly Head & Green Delivery Helmet */}
              <circle cx="56" cy="24" r="11" fill="#065F46" stroke="#047857" strokeWidth="1.5" />
              {/* Face */}
              <path d="M57 19 Q66 22 65 29 Q57 28 55 22 Z" fill="#FDBA74" />
              {/* Smiling Eye */}
              <circle cx="62" cy="24" r="1.2" fill="#111827" />
              <path d="M60 27 Q62 29 64 27" stroke="#9A3412" strokeWidth="1" fill="none" />
              {/* Helmet Green Visor Stripe */}
              <path d="M50 20 Q56 16 63 20" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 3. RIGHT: CUSTOMER DOORSTEP & PRODUCT HANDOVER              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="ml-auto relative z-10 bottom-3 flex flex-col items-center shrink-0">
            <div className="text-center mb-1">
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border transition ${
                isDelivered 
                  ? 'bg-amber-400 text-gray-950 border-amber-300 shadow-md animate-pulse' 
                  : 'bg-teal-900 text-teal-200 border-teal-600/60'
              }`}>
                {isDelivered ? '✓ ORDER DELIVERED' : 'CUSTOMER HOME'}
              </span>
            </div>

            {/* Customer Doorstep Vector SVG */}
            <svg viewBox="0 0 90 90" className="w-20 sm:w-24 h-20 sm:h-24 filter drop-shadow-md">
              {/* House Facade */}
              <rect x="10" y="18" width="72" height="69" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="2" />
              {/* Roof Gables */}
              <polygon points="5,18 46,3 87,18" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
              
              {/* Front Door */}
              <rect x="30" y="34" width="32" height="53" rx="3" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
              <circle cx="56" cy="60" r="2" fill="#FACC15" />
              
              {/* Porch Glowing Light */}
              <circle cx="46" cy="26" r="4.5" fill="#FDE047" opacity="0.9" />

              {/* Customer Character standing at doorstep */}
              <circle cx="42" cy="46" r="6" fill="#FDBA74" />
              {/* Smile & Eyes */}
              <circle cx="40" cy="45" r="0.8" fill="#111827" />
              <circle cx="44" cy="45" r="0.8" fill="#111827" />
              <path d="M40 48 Q42 51 44 48" stroke="#9A3412" strokeWidth="0.8" fill="none" />
              {/* Clothes */}
              <path d="M34 54 L50 54 L48 72 L36 72 Z" fill="#38BDF8" />
              {/* Hands extended forward to receive product parcel */}
              <path d="M36 60 L24 64" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M48 60 L36 64" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />

              {/* DELIVERED PRODUCT PARCEL BOX IN CUSTOMER HANDS */}
              {isDelivered && (
                <g className="animate-bounce">
                  <rect x="16" y="58" width="18" height="15" rx="2" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
                  <text x="25" y="68" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0F172A">📦✓</text>
                </g>
              )}
            </svg>
          </div>

        </div>

        {/* Medium Bottom Milestone Tracker */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-200/90 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-emerald-900/60 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-[11px] text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Delivery Partner: <strong>Express Partner Assigned</strong>
            </span>
            <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-xl text-[11px] text-amber-300">
              <PackageCheck className="w-3.5 h-3.5" />
              Product: <strong>Express Fresh Parcel</strong>
            </span>
          </div>

          <button
            onClick={() => navigate('/orders/track')}
            className="text-[11px] font-extrabold text-amber-300 hover:text-white flex items-center gap-1 transition underline cursor-pointer"
          >
            <span>Live GPS Tracking Map</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

    </div>
  );
};
