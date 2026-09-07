import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Heart, Plus, Minus, Zap, ShieldCheck, Truck, RefreshCw, Sparkles, Check, Home, ChevronRight } from 'lucide-react';
import { productService, recommendationService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { getProductSizes, getProductDefaultSize, getProductPriceForSize } from '../utils/productVariants';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeTab, setActiveTab] = useState('features'); // 'features', 'nutrition', 'reviews'
  const [similarProducts, setSimilarProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await productService.getProductById(id);
        setProduct(res.data);
        setSelectedImage(res.data.images?.[0] || '');
        setSelectedSize(getProductDefaultSize(res.data));

        const recRes = await recommendationService.getRecommendations({
          category: res.data.category,
          productId: id
        });
        setSimilarProducts(recRes.data.similarProducts || []);
        setFrequentlyBought(recRes.data.frequentlyBoughtTogether || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return <div className="h-96 skeleton-shimmer rounded-3xl my-8" />;
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900">Product not found</h2>
        <div className="flex justify-center items-center gap-3 mt-4">
          <Link to="/" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
            <Home className="w-4 h-4" /> Go to Homepage
          </Link>
          <button onClick={() => navigate('/products')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-5 py-2.5 rounded-xl transition">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const availableSizes = getProductSizes(product);
  const activeSize = selectedSize || getProductDefaultSize(product);
  const variantPricing = getProductPriceForSize(product, activeSize);
  const displayPrice = variantPricing.price || product.price;
  const displayOriginalPrice = variantPricing.originalPrice || product.originalPrice;
  const displayDiscountPercent = variantPricing.discountPercent;
  const displaySavings = variantPricing.savings;

  const cartItemId = `${product._id}_${activeSize}`;
  const quantityInCart = getItemQuantity(product._id, activeSize);
  const isFavorite = isInWishlist(product._id);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    try {
      const res = await productService.addReview(product._id, {
        rating: reviewRating,
        comment: reviewComment
      });
      setProduct(res.data.product);
      setReviewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Breadcrumb Navigation with Home Button */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-gray-500 overflow-x-auto py-1">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition shadow-2xs shrink-0"
          title="Return to Homepage"
        >
          <Home className="w-3.5 h-3.5 text-emerald-600" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <Link 
          to={`/products?category=${encodeURIComponent(product.category)}`}
          className="px-2.5 py-1.5 rounded-xl hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 transition capitalize shrink-0"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-gray-800 truncate max-w-xs sm:max-w-md font-bold" title={product.name}>
          {product.name}
        </span>
      </nav>
      
      {/* Product Top Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Images Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center relative p-4">
            <img 
              src={selectedImage} 
              alt={product.name} 
              className="max-w-full max-h-full object-contain" 
              onError={(e) => {
                if (product.images?.[1] && e.target.src !== product.images[1]) {
                  e.target.src = product.images[1];
                }
              }}
            />
            {displayDiscountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow">
                {displayDiscountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Selector */}
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition bg-white p-1 flex items-center justify-center ${
                    selectedImage === img ? 'border-emerald-600 scale-105 shadow-xs' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="thumb" className="max-w-full max-h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information Column */}
        <div className="lg:col-span-7 space-y-5">
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.brand}
              </span>
              <button
                onClick={() => toggleWishlist(product._id)}
                className={`p-2 rounded-full transition ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-2">{product.name}</h1>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-100">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>{product.rating}</span>
              </div>
              <span className="text-xs text-gray-500 font-semibold">{product.reviewCount} Ratings & Verified Reviews</span>
              <span className="text-xs font-bold text-gray-500">
                • Selected: <span className="text-emerald-700 font-extrabold">{activeSize}</span>
              </span>
            </div>
          </div>

          {/* Interactive Size / Pack Variant Selector (For All Products) */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <span>📏</span>
                {product.category === 'Fashion & Apparel'
                  ? 'Select Size / Fit:'
                  : 'Select Pack Size / Weight:'}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                {activeSize}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {availableSizes.map((sizeOption) => {
                const isSelected = activeSize === sizeOption;
                const sizeQty = getItemQuantity(product._id, sizeOption);
                const szPricing = getProductPriceForSize(product, sizeOption);

                return (
                  <button
                    key={sizeOption}
                    type="button"
                    onClick={() => setSelectedSize(sizeOption)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition border flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200 scale-105'
                        : sizeQty > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="leading-tight font-extrabold">{sizeOption}</span>
                      <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                        ₹{szPricing.price}
                      </span>
                    </div>
                    {sizeQty > 0 && !isSelected && (
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1">
                        {sizeQty} in cart
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] ml-1" />}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5 pt-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Selected: <strong className="text-emerald-900 font-black">{activeSize}</strong> • ⚡ 15-Minute Express Delivery & 100% Genuine
              </span>
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-gray-500 font-semibold block">Selling Price ({activeSize})</span>
                {displayDiscountPercent > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    {displayDiscountPercent}% OFF • SAVE ₹{displaySavings}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">₹{displayPrice}</span>
                {displayOriginalPrice > displayPrice && (
                  <span className="text-sm text-gray-400 line-through">MRP ₹{displayOriginalPrice}</span>
                )}
              </div>
            </div>

            {/* Quantity / Add for Selected Size */}
            <div>
              {quantityInCart === 0 ? (
                <button
                  onClick={() => addToCart(product, 1, activeSize, displayPrice, displayOriginalPrice)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD TO CART ({activeSize})</span>
                </button>
              ) : (
                <div className="flex items-center bg-emerald-600 text-white rounded-2xl shadow-md overflow-hidden font-bold text-xs p-1">
                  <button onClick={() => updateQuantity(cartItemId, quantityInCart - 1)} className="px-3 py-1.5 hover:bg-emerald-700">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-extrabold text-base">{quantityInCart}</span>
                  <button onClick={() => updateQuantity(cartItemId, quantityInCart + 1)} className="px-3 py-1.5 hover:bg-emerald-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Value Badges */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold text-gray-700">
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col items-center">
              <Zap className="w-4 h-4 text-emerald-600 mb-1" />
              <span>15-Min Delivery</span>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <span>Quality Guarantee</span>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col items-center">
              <RefreshCw className="w-4 h-4 text-emerald-600 mb-1" />
              <span>Instant Refund</span>
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('features')}
                className={`pb-2 text-xs font-extrabold transition ${
                  activeTab === 'features' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'
                }`}
              >
                Key Features & Details
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`pb-2 text-xs font-extrabold transition ${
                  activeTab === 'nutrition' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'
                }`}
              >
                Nutritional Info
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2 text-xs font-extrabold transition ${
                  activeTab === 'reviews' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'
                }`}
              >
                Customer Reviews ({product.reviews?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="py-4">
              {activeTab === 'features' && (
                <div className="space-y-3 text-xs text-gray-700">
                  <p className="leading-relaxed">{product.description}</p>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-900 block">Highlights:</span>
                    {product.keyFeatures?.map((feat, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-gray-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500"><strong>Storage:</strong> {product.storageInfo}</p>
                </div>
              )}

              {activeTab === 'nutrition' && (
                <div className="bg-gray-50 rounded-2xl p-4 text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-2 font-bold">Nutrient</th>
                        <th className="pb-2 font-bold">Per Serving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr><td className="py-1.5 font-medium">Calories</td><td>{product.nutrition?.calories}</td></tr>
                      <tr><td className="py-1.5 font-medium">Protein</td><td>{product.nutrition?.protein}</td></tr>
                      <tr><td className="py-1.5 font-medium">Carbohydrates</td><td>{product.nutrition?.carbs}</td></tr>
                      <tr><td className="py-1.5 font-medium">Fat</td><td>{product.nutrition?.fat}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddReview} className="p-3 bg-gray-50 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-gray-900 block">Add Your Review</span>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="text-xs p-1.5 bg-white border border-gray-200 rounded-lg"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                    </select>
                    <textarea
                      placeholder="Write your product experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-emerald-500"
                    />
                    <button type="submit" className="bg-emerald-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg">
                      Submit Review
                    </button>
                  </form>

                  <div className="space-y-2">
                    {product.reviews?.map((rev, i) => (
                      <div key={i} className="p-3 border border-gray-100 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-gray-800">
                          <span>{rev.userName}</span>
                          <span className="text-amber-500">{'⭐'.repeat(rev.rating)}</span>
                        </div>
                        <p className="text-gray-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">Similar Products You Might Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarProducts.map(prod => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
