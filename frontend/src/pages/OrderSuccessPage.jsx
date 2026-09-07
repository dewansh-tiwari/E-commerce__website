import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Truck, ArrowRight, ShoppingBag, Clock } from 'lucide-react';

export const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId') || 'ORD' + Math.floor(100000 + Math.random() * 900000);

  useEffect(() => {
    // Trigger celebratory confetti animation!
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="py-16 max-w-lg mx-auto text-center space-y-6">
      
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          ORDER CONFIRMED
        </span>
        <h1 className="text-3xl font-black text-gray-900">🎉 Thank You for Shopping!</h1>
        <p className="text-xs text-gray-500">Your order has been placed and is being packed by our store team.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left space-y-3">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
          <span className="font-bold text-gray-500">Order Reference:</span>
          <span className="font-extrabold text-emerald-700 text-sm">#{orderId}</span>
        </div>

        <div className="flex items-center gap-3 text-xs pt-1">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <p className="font-bold text-gray-800">Estimated Delivery Time</p>
            <p className="text-emerald-700 font-extrabold">20 - 30 Minutes (Express)</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => navigate(`/orders/track?orderId=${orderId}`)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition hover:scale-105"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Live</span>
        </button>

        <Link
          to="/"
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

    </div>
  );
};
