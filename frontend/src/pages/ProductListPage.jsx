import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, RefreshCw, X, Sparkles, Home } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { productService } from '../services/api';
import { TOP_BRANDS } from '../data/brandsData';

export const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const categoryParam = searchParams.get('category') || '';
  const subCategoryParam = searchParams.get('subCategory') || '';
  const searchParam = searchParams.get('q') || '';
  const isDealParam = searchParams.get('isDeal') || '';
  const isTrendingParam = searchParams.get('isTrending') || '';
  const isBestSellerParam = searchParams.get('isBestSeller') || '';
  const brandParam = searchParams.get('brand') || '';

  const isFashion = categoryParam === 'Fashion & Apparel' || categoryParam === 'fashion-apparel';

  const FASHION_SUBCATEGORIES = [
    { label: 'All Fashion', value: '', icon: '✨' },
    { label: "Men's Wear", value: "Men's Wear", icon: '👔' },
    { label: 'Ethnic Wear', value: 'Ethnic Wear', icon: '🥻' },
    { label: "Women's Western", value: "Women's Western", icon: '👗' },
    { label: 'Footwear', value: 'Footwear', icon: '👟' },
    { label: 'Bags & Backpacks', value: 'Bags & Backpacks', icon: '🎒' },
    { label: 'Accessories', value: 'Accessories', icon: '🕶️' },
    { label: 'Watches', value: 'Watches', icon: '⌚' },
    { label: 'Kids Fashion', value: 'Kids Fashion', icon: '🧒' }
  ];

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategoryParam);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [sortOption, setSortOption] = useState('popularity');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (brandParam) {
      setSelectedBrand(brandParam);
    }
  }, [brandParam]);

  useEffect(() => {
    if (subCategoryParam) {
      setSelectedSubCategory(subCategoryParam);
    }
  }, [subCategoryParam]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        category: categoryParam !== 'All' ? categoryParam : '',
        subCategory: selectedSubCategory,
        search: searchParam,
        brand: selectedBrand,
        maxPrice,
        dietary: selectedDietary.join(','),
        sort: sortOption,
        isDeal: isDealParam,
        isTrending: isTrendingParam,
        isBestSeller: isBestSellerParam,
        limit: 40
      };

      const res = await productService.getProducts(params);
      setProducts(res.data.products);
      setTotalProducts(res.data.totalProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryParam, selectedSubCategory, searchParam, isDealParam, isTrendingParam, isBestSellerParam, selectedBrand, maxPrice, selectedDietary, sortOption]);

  const handleDietaryToggle = (tag) => {
    if (selectedDietary.includes(tag)) {
      setSelectedDietary(selectedDietary.filter(t => t !== tag));
    } else {
      setSelectedDietary([...selectedDietary, tag]);
    }
  };

  const clearAllFilters = () => {
    setSelectedBrand('');
    setSelectedSubCategory('');
    setMaxPrice(5000);
    setSelectedDietary([]);
    setSortOption('popularity');
    setSearchParams({});
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Category / Breadcrumbs Title Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-emerald-300 transition font-bold" 
              title="Return to Homepage"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-emerald-700 font-bold">{categoryParam || 'All Products'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {categoryParam ? `${categoryParam}` : searchParam ? `Results for "${searchParam}"` : 'All Groceries & Essentials'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing {totalProducts} items available for 15-minute hyper-local delivery
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-gray-50 text-gray-800 text-xs font-bold rounded-xl px-3 py-2 border border-gray-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="popularity">Sort by: Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
            <option value="rating">Top Customer Rated</option>
          </select>
        </div>
      </div>

      {/* Fashion Department Filter Pills (if browsing Fashion) */}
      {isFashion && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-extrabold text-emerald-950 shrink-0 ml-1 flex items-center gap-1">
              <span>🛍️</span> Department:
            </span>
            {FASHION_SUBCATEGORIES.map((sub) => {
              const isActive = selectedSubCategory === sub.value;
              return (
                <button
                  key={sub.label}
                  onClick={() => setSelectedSubCategory(isActive ? '' : sub.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs h-fit sticky top-36">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 font-extrabold text-sm text-gray-900">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Filter Products</span>
            </div>
            <button onClick={clearAllFilters} className="text-[11px] font-bold text-emerald-700 hover:underline">
              Reset All
            </button>
          </div>

          {/* Price Range Slider */}
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-2">Max Price: ₹{maxPrice}</label>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
              <span>₹50</span>
              <span>₹5,000</span>
            </div>
          </div>

          {/* Department or Dietary Filter */}
          {isFashion ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Department</label>
                {selectedSubCategory && (
                  <button onClick={() => setSelectedSubCategory('')} className="text-[10px] text-emerald-700 font-bold hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {FASHION_SUBCATEGORIES.filter(s => s.value).map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => setSelectedSubCategory(selectedSubCategory === sub.value ? '' : sub.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition border text-left ${
                      selectedSubCategory === sub.value
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{sub.icon}</span>
                      <span>{sub.label}</span>
                    </span>
                    {selectedSubCategory === sub.value && (
                      <span className="text-emerald-700 text-[10px]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-2">Dietary Preference</label>
              <div className="space-y-2">
                {['Organic', 'Veg', 'High-Protein', 'Low-Calorie', 'Keto'].map((tag) => (
                  <label key={tag} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDietary.includes(tag)}
                      onChange={() => handleDietaryToggle(tag)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Brands with Official Logos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-800">
                {isFashion ? 'Fashion Brands' : 'Official Brands'}
              </label>
              {selectedBrand && (
                <button
                  onClick={() => setSelectedBrand('')}
                  className="text-[10px] text-emerald-700 font-bold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 text-xs font-medium text-gray-600">
              {(isFashion ? TOP_BRANDS.filter(b => b.category === 'Fashion & Apparel') : TOP_BRANDS).map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(selectedBrand === brand.filterKey ? '' : brand.filterKey)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition border text-left ${
                    selectedBrand === brand.filterKey
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-xs'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-5 bg-white rounded border border-gray-100 flex items-center justify-center p-0.5 shrink-0">
                      <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="truncate text-xs">{brand.name}</span>
                  </div>
                  {selectedBrand === brand.filterKey && (
                    <span className="text-[10px] text-emerald-700 font-black shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Quick Brand Selector Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedBrand('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition border ${
                !selectedBrand
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              All Brands
            </button>
            {(isFashion ? TOP_BRANDS.filter(b => b.category === 'Fashion & Apparel') : TOP_BRANDS).map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(selectedBrand === b.filterKey ? '' : b.filterKey)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 transition border ${
                  selectedBrand === b.filterKey
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div className="w-6 h-4 bg-white rounded-xs p-0.5 flex items-center justify-center">
                  <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" />
                </div>
                <span>{b.name}</span>
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, idx) => (
                <div key={idx} className="h-64 skeleton-shimmer rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
              <h3 className="text-base font-bold text-gray-900">No products match your filters</h3>
              <p className="text-xs text-gray-500 mt-1">Try resetting price range or clearing dietary preferences.</p>
              <button onClick={clearAllFilters} className="mt-4 bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map(prod => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
