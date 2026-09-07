import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { TOP_BRANDS } from '../data/brandsData';

export const BrandShowcase = () => {
  const navigate = useNavigate();

  const handleBrandClick = (brandName) => {
    navigate(`/products?brand=${encodeURIComponent(brandName)}`);
  };

  return (
    <section className="bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/20 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              100% Original Brand Guarantee
            </span>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Official Retail Packets
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Shop by Top Brands
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Explore authentic products directly from India's most trusted household brands
          </p>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="self-start sm:self-auto text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition active:scale-95"
        >
          <span>View All Brands</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {TOP_BRANDS.map((brand) => (
          <div
            key={brand.id}
            onClick={() => handleBrandClick(brand.filterKey)}
            className={`group bg-white rounded-2xl p-4 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col justify-between items-center text-center relative overflow-hidden ${brand.borderColor || 'border-gray-200 hover:border-emerald-400'}`}
          >
            {/* Badge */}
            <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 group-hover:bg-amber-100 group-hover:text-amber-900 transition">
              {brand.badge}
            </span>

            {/* Official Logo Photo */}
            <div className="w-full h-16 sm:h-20 flex items-center justify-center p-2 mt-2 group-hover:scale-105 transition-transform duration-300">
              <img
                src={brand.logo}
                alt={`${brand.name} official logo`}
                className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                loading="lazy"
              />
            </div>

            {/* Brand Details */}
            <div className="w-full pt-3 border-t border-gray-100 mt-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-emerald-700 transition line-clamp-1">
                {brand.name}
              </h3>
              <p className="text-[10px] text-gray-400 italic line-clamp-1 mt-0.5">
                {brand.tagline}
              </p>
              
              <div className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                <span>Shop Items</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
