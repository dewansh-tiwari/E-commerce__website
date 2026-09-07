import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Flame, Award, Clock, ChevronRight, Shirt } from 'lucide-react';
import { HeroBanner } from '../components/HeroBanner';
import { WelcomeOfferBanner } from '../components/WelcomeOfferBanner';
import { HappyHoursBanner } from '../components/HappyHoursBanner';
import { BrandShowcase } from '../components/BrandShowcase';
import { ProductCard } from '../components/ProductCard';
import { productService, recommendationService } from '../services/api';

export const HomePage = () => {
  const navigate = useNavigate();

  const [trending, setTrending] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [freshArrivals, setFreshArrivals] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [fashionProducts, setFashionProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllHomeData = async () => {
      try {
        setLoading(true);
        const [trendRes, bestRes, dealRes, freshRes, recRes, fashionRes] = await Promise.all([
          productService.getProducts({ isTrending: 'true', limit: 8 }),
          productService.getProducts({ isBestSeller: 'true', limit: 8 }),
          productService.getProducts({ isDeal: 'true', limit: 8 }),
          productService.getProducts({ isFreshArrival: 'true', limit: 8 }),
          recommendationService.getRecommendations(),
          productService.getProducts({ category: 'Fashion & Apparel', limit: 8 })
        ]);

        setTrending(trendRes.data.products);
        setBestSellers(bestRes.data.products);
        setDeals(dealRes.data.products);
        setFreshArrivals(freshRes.data.products.length ? freshRes.data.products : trendRes.data.products);
        setRecommended(recRes.data.recommendedForYou || bestRes.data.products);
        setFashionProducts(fashionRes.data.products || []);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHomeData();
  }, []);

  const promoCards = [
    { title: 'Up to 50% OFF', subtitle: 'Pantry Staples & Oils', link: '/products?isDeal=true', bg: 'bg-emerald-950 text-white', tag: 'LIMITED TIME' },
    { title: 'Fashion & Lifestyle', subtitle: "Levi's, Puma, BIBA & More", link: '/products?category=Fashion%20%26%20Apparel', bg: 'bg-indigo-950 text-white', tag: 'NEW LAUNCH 👕' },
    { title: 'Fresh Fruits & Veggies', subtitle: '100% Farm Organic', link: '/products?category=Fruits%20%26%20Vegetables', bg: 'bg-emerald-800 text-white', tag: 'ORGANIC' },
    { title: 'Daily Essentials', subtitle: 'Milk, Eggs & Butter', link: '/products?category=Dairy%20%26%20Breakfast', bg: 'bg-teal-900 text-white', tag: 'DAILY FRESH' }
  ];

  return (
    <div className="space-y-10 pb-12">
      
      {/* Hero Banner Section */}
      <HeroBanner />

      {/* First 3 Orders Welcome Mega Offer Banner */}
      <WelcomeOfferBanner />

      {/* Big Market-Style Happy Hour Banner */}
      <HappyHoursBanner />

      {/* Promotional Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {promoCards.map((card, i) => (
          <div
            key={i}
            onClick={() => navigate(card.link)}
            className={`${card.bg} rounded-3xl p-5 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[140px] group`}
          >
            <div>
              <span className="text-[9px] font-extrabold bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {card.tag}
              </span>
              <h3 className="text-base font-extrabold mt-2 leading-snug group-hover:text-amber-300 transition">
                {card.title}
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">{card.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 pt-2">
              <span>Shop Now</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Visual Essential Category Grid (Blinkit & BigBasket Style) */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Explore Essential Categories</h2>
            <p className="text-xs text-gray-500">Find Milk, Oil, Curd, Biscuits, Fashion, Noodles & Fresh Veggies</p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
          {[
            { title: 'Milk & Dahi', icon: '🥛', bg: 'bg-blue-50 border-blue-100 text-blue-900', link: '/products?category=Dairy%20%26%20Breakfast' },
            { title: 'Fashion & Wear', icon: '👕', bg: 'bg-purple-50 border-purple-200 text-purple-900', link: '/products?category=Fashion%20%26%20Apparel' },
            { title: 'Oil & Ghee', icon: '🧂', bg: 'bg-amber-50 border-amber-100 text-amber-900', link: '/products?category=Oils%20%26%20Spices' },
            { title: 'Namkeen & Chips', icon: '🍿', bg: 'bg-orange-50 border-orange-100 text-orange-900', link: '/products?category=Snacks%20%26%20Munchies' },
            { title: 'Biscuits & Bakery', icon: '🍞', bg: 'bg-yellow-50 border-yellow-100 text-yellow-900', link: '/products?category=Bakery' },
            { title: 'Fruits & Veggies', icon: '🥬', bg: 'bg-emerald-50 border-emerald-100 text-emerald-900', link: '/products?category=Fruits%20%26%20Vegetables' },
            { title: 'Maggi & Soups', icon: '🍜', bg: 'bg-red-50 border-red-100 text-red-900', link: '/products?category=Instant%20Food' },
            { title: 'Atta & Basmati', icon: '🌾', bg: 'bg-lime-50 border-lime-100 text-lime-900', link: '/products?category=Rice%20%26%20Atta' },
            { title: 'Tea & Coffee', icon: '🥤', bg: 'bg-teal-50 border-teal-100 text-teal-900', link: '/products?category=Beverages' }
          ].map((cat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(cat.link)}
              className={`${cat.bg} border rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer transition hover:scale-105 hover:shadow-md group`}
            >
              <span className="text-3xl mb-1 transform group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-bold leading-tight">{cat.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Official Top Brands Showcase */}
      <BrandShowcase />

      {/* New Section: Trending Fashion & Apparel */}
      {fashionProducts.length > 0 && (
        <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center font-bold shadow-md">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-white/15 text-amber-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  JUST LAUNCHED
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-0.5">Trending Fashion & Lifestyle</h2>
              </div>
            </div>
            <button 
              onClick={() => navigate('/products?category=Fashion%20%26%20Apparel')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fashionProducts.slice(0, 4).map(prod => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Section 1: Trending Near You */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Trending Near You</h2>
          </div>
          <button 
            onClick={() => navigate('/products?isTrending=true')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="h-64 skeleton-shimmer rounded-2xl" />
            ))
          ) : (
            trending.slice(0, 4).map(prod => (
              <ProductCard key={prod._id} product={prod} />
            ))
          )}
        </div>
      </section>

      {/* Section 2: Best Sellers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Best Sellers</h2>
          </div>
          <button 
            onClick={() => navigate('/products?isBestSeller=true')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {bestSellers.slice(0, 4).map(prod => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      </section>

      {/* Section 3: Today's Super Deals */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="bg-amber-400 text-gray-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
              FLASH DISCOUNTS
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">Today's Deals - Up to 50% OFF</h2>
          </div>
          <button 
            onClick={() => navigate('/products?isDeal=true')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/20 transition"
          >
            View All Deals
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {deals.slice(0, 4).map(prod => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      </section>

      {/* Section 4: AI Recommended For You */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Recommended For You</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recommended.slice(0, 4).map(prod => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      </section>

    </div>
  );
};
