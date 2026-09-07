import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Zap, ShieldCheck, RefreshCw, HeartHandshake, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-24 lg:pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-800 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">15-Minute Delivery</h4>
            <p className="text-xs text-gray-400 mt-1">Superfast hyper-local fulfillment</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">100% Fresh & Organic</h4>
            <p className="text-xs text-gray-400 mt-1">Sourced directly from certified partner farms</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Easy Returns</h4>
            <p className="text-xs text-gray-400 mt-1">No questions asked instant refund</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-3">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Best Price Guaranteed</h4>
            <p className="text-xs text-gray-400 mt-1">Daily deals & SuperCoins rewards</p>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12">
          
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-2xl font-extrabold text-white flex items-center gap-1">Big Market 👌</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Big Market 👌 is your ultimate destination for farm-fresh vegetables, organic fruits, dairy, snacks, and daily household essentials delivered in 15 minutes.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email for deals..."
                className="bg-gray-800 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none border border-gray-700 focus:border-emerald-500 w-full max-w-xs"
              />
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition">
                Subscribe
              </button>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Top Categories</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/products?category=Fruits%20%26%20Vegetables" className="hover:text-emerald-400">Fruits & Vegetables</Link></li>
              <li><Link to="/products?category=Dairy%20%26%20Breakfast" className="hover:text-emerald-400">Dairy & Breakfast</Link></li>
              <li><Link to="/products?category=Bakery" className="hover:text-emerald-400">Fresh Bakery</Link></li>
              <li><Link to="/products?category=Snacks%20%26%20Munchies" className="hover:text-emerald-400">Snacks & Munchies</Link></li>
              <li><Link to="/products?category=Beverages" className="hover:text-emerald-400">Beverages & Juices</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Customer Care</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/profile" className="hover:text-emerald-400">My Account & Orders</Link></li>
              <li><Link to="/orders/track" className="hover:text-emerald-400">Track Order</Link></li>
              <li><a href="#help" className="hover:text-emerald-400">Help & FAQs</a></li>
              <li><a href="#returns" className="hover:text-emerald-400">Refund Policy</a></li>
              <li><a href="#terms" className="hover:text-emerald-400">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Contact Us</h5>
            <div className="text-xs text-gray-400 space-y-2">
              <p>📍 Bandra West, Mumbai 400050</p>
              <p>📞 1800-BIG-MARKET</p>
              <p>✉️ support@bigmarket.com</p>
              <div className="pt-2 flex gap-2">
                <span className="bg-gray-800 text-xs px-2.5 py-1 rounded text-gray-300">UPI</span>
                <span className="bg-gray-800 text-xs px-2.5 py-1 rounded text-gray-300">Visa</span>
                <span className="bg-gray-800 text-xs px-2.5 py-1 rounded text-gray-300">MasterCard</span>
                <span className="bg-gray-800 text-xs px-2.5 py-1 rounded text-amber-400">SuperCoins 🪙</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Big Market Technologies Pvt Ltd. All rights reserved. Original Brand Identity.
        </div>

      </div>
    </footer>
  );
};
