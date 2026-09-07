import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

const categories = [
  { name: 'All', icon: '🛒' },
  { name: 'Fruits & Vegetables', icon: '🥬' },
  { name: 'Dairy & Breakfast', icon: '🥛' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Snacks & Munchies', icon: '🍿' },
  { name: 'Beverages', icon: '🥤' },
  { name: 'Instant Food', icon: '🍜' },
  { name: 'Rice & Atta', icon: '🌾' },
  { name: 'Pulses & Dals', icon: '🫘' },
  { name: 'Oils & Spices', icon: '🧂' },
  { name: 'Personal Care', icon: '🧼' },
  { name: 'Household', icon: '🧹' },
  { name: 'Fashion & Apparel', icon: '👕' },
  { name: 'Baby Care', icon: '👶' },
  { name: 'Pet Supplies', icon: '🐾' }
];

export const CategoryNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const isHomePage = location.pathname === '/';

  const handleSelect = (catName) => {
    if (catName === 'All') {
      navigate('/products');
    } else {
      navigate(`/products?category=${encodeURIComponent(catName)}`);
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 shadow-2xs py-3 sticky top-16 sm:top-20 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {/* Direct Home Button */}
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border shrink-0 cursor-pointer ${
              isHomePage && !activeCategory
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-105'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Go to Homepage"
          >
            <span className="text-sm">🏠</span>
            <span className="font-extrabold">Home</span>
          </button>
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-105'
                    : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
