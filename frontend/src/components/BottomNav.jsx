import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Package, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const BottomNav = () => {
  const navigate = useNavigate();
  const { totalItemCount, setIsCartOpen } = useCart();
  const { user, setIsAuthModalOpen } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 lg:hidden shadow-lg">
      <div className="grid grid-cols-5 h-14">
        
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-[10px] font-bold transition ${
              isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-[10px] font-bold transition ${
              isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Search</span>
        </NavLink>

        <button
          onClick={() => {
            if (user) navigate('/profile');
            else setIsAuthModalOpen(true);
          }}
          className="flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 hover:text-gray-900 transition"
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 hover:text-gray-900 relative transition"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-400 text-gray-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {totalItemCount}
              </span>
            )}
          </div>
          <span>Basket</span>
        </button>

        <button
          onClick={() => {
            if (user) navigate('/profile');
            else setIsAuthModalOpen(true);
          }}
          className="flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 hover:text-gray-900 transition"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Account</span>
        </button>

      </div>
    </div>
  );
};
