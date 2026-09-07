import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, ShieldCheck, Clock } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: 'Fresh Farm Produce Delivered in 15 Minutes',
    subtitle: 'Directly from organic certified partner farms to your kitchen doorstep.',
    badge: '100% Organic & Pesticide Free',
    gradient: 'from-emerald-900 via-emerald-800 to-teal-900',
    accentColor: 'text-amber-400',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Shop Farm Fresh',
    link: '/products?category=Fruits%20%26%20Vegetables'
  },
  {
    id: 2,
    title: 'Up to 50% OFF Daily Groceries & Pantry Essentials',
    subtitle: 'Stock up on premium Basmati Rice, Whole Wheat Atta, Cold-pressed Oils & Spices.',
    badge: 'Super Savings Weekend',
    gradient: 'from-teal-950 via-emerald-900 to-slate-900',
    accentColor: 'text-emerald-400',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Explore Mega Deals',
    link: '/products?isDeal=true'
  },
  {
    id: 3,
    title: 'Chilled Milk, Artisan Breads & Greek Yogurt',
    subtitle: 'Start your morning with fresh dairy, butter, and oven-baked whole wheat bread.',
    badge: 'Morning Special',
    gradient: 'from-emerald-800 via-teal-900 to-emerald-950',
    accentColor: 'text-amber-300',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Order Breakfast Essentials',
    link: '/products?category=Dairy%20%26%20Breakfast'
  }
];

export const HeroBanner = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r my-6 shadow-xl text-white">
      <div className={`bg-gradient-to-r ${slide.gradient} transition-all duration-700 p-6 sm:p-10 lg:p-12 min-h-[340px] sm:min-h-[380px] flex items-center`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full z-10">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/20">
              <Sparkles className={`w-4 h-4 ${slide.accentColor}`} />
              <span>{slide.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {slide.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-200 font-medium max-w-xl">
              {slide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => navigate(slide.link)}
                className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition hover:scale-105"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/products?isDeal=true')}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold border border-white/20 transition backdrop-blur-sm"
              >
                Explore 50% OFF Deals
              </button>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-300 pt-2">
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> 15 Min Delivery</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-400" /> 6 AM - 11 PM</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Quality Verified</span>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 group">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-72 object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 bg-amber-400 text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full shadow">
                🪙 Earn 5% SuperCoins Cash-Back
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-3 right-6 flex gap-1.5 z-20">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
