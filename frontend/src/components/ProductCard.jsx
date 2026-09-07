import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Plus, Minus, Zap, ShieldCheck, ChevronDown, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductSizes, getProductDefaultSize, getProductPriceForSize } from '../utils/productVariants';
import { SizeSelectionModal } from './SizeSelectionModal';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const availableSizes = getProductSizes(product);
  const hasMultipleSizes = availableSizes.length > 1;
  const [selectedSize, setSelectedSize] = useState(() => getProductDefaultSize(product));
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

  // Size & Pack Pricing
  const currentPricing = getProductPriceForSize(product, selectedSize);
  const displayPrice = currentPricing.price || product.price;
  const displayOriginalPrice = currentPricing.originalPrice || product.originalPrice;
  const displayDiscountPercent = currentPricing.discountPercent;
  const currentSizeQty = getItemQuantity(product._id, selectedSize);
  const currentCartItemId = `${product._id}_${selectedSize}`;

  // Cart quantity tracking across all variants
  const productCartItems = cartItems.filter(item => item.product === product._id);
  const totalCartQty = productCartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isFavorite = isInWishlist(product._id);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative group">
        
        {/* Top Badges: Discount & Wishlist */}
        <div className="flex items-center justify-between gap-1 mb-2 z-10">
          <div className="flex flex-col gap-1 items-start">
            {displayDiscountPercent > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                {displayDiscountPercent}% OFF
              </span>
            )}
            {product.isOrganic && (
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                🌱 Organic
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product._id);
            }}
            className={`p-1.5 rounded-full transition ${
              isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Image */}
        <div 
          onClick={() => navigate(`/products/${product._id}`)}
          className="w-full h-36 sm:h-44 rounded-xl overflow-hidden mb-3 bg-white border border-gray-100 flex items-center justify-center cursor-pointer relative"
        >
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              if (product.images?.[1] && e.target.src !== product.images[1]) {
                e.target.src = product.images[1];
              } else {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/400x400/f0fdf4/059669?text=${encodeURIComponent(product.brand || product.name?.split(' ')[0] || 'Product')}`;
              }
            }}
          />
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute bottom-2 left-2 bg-amber-500 text-gray-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          
          <div>
            {/* Brand & Size Selector Pill */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
              <span className="truncate max-w-[110px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/80">
                🏷️ {product.brand}
              </span>

              {/* Interactive Size/Variant Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasMultipleSizes) {
                    setIsSizeModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] border transition ${
                  hasMultipleSizes
                    ? 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200 cursor-pointer shadow-2xs'
                    : 'bg-gray-100 text-gray-700 border-gray-200 cursor-default'
                }`}
                title={hasMultipleSizes ? "Click to choose size/pack options" : "Size"}
              >
                <span>{selectedSize}</span>
                {hasMultipleSizes && <ChevronDown className="w-2.5 h-2.5 text-emerald-700" />}
              </button>
            </div>

            {/* Product Title */}
            <h3
              onClick={() => navigate(`/products/${product._id}`)}
              className="text-xs sm:text-sm font-bold text-gray-800 hover:text-emerald-700 cursor-pointer line-clamp-2 mb-1 leading-snug"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Quick Size Select Chips (For 1-click selection or opening modal) */}
            {hasMultipleSizes && (
              <div 
                className="flex items-center gap-1 mb-1.5 overflow-x-auto no-scrollbar py-0.5" 
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[9px] font-extrabold text-gray-400 uppercase shrink-0">Sizes:</span>
                {availableSizes.slice(0, 3).map((sz) => {
                  const qty = getItemQuantity(product._id, sz);
                  const isSelected = selectedSize === sz;
                  const szPricing = getProductPriceForSize(product, sz);

                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSize(sz);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition shrink-0 border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-300'
                          : qty > 0
                            ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                      title={`${sz} — ₹${szPricing.price}`}
                    >
                      {sz} {qty > 0 ? `(${qty})` : ''}
                    </button>
                  );
                })}
                {availableSizes.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSizeModalOpen(true);
                    }}
                    className="text-[9px] font-extrabold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 shrink-0 cursor-pointer"
                  >
                    +{availableSizes.length - 3} more
                  </button>
                )}
              </div>
            )}

            {/* Rating Pill */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-800 border border-emerald-100">
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>{product.rating || 4.5}</span>
              </div>
              <span className="text-[10px] text-gray-400">({product.reviewCount || 24})</span>
            </div>
          </div>

          {/* Pricing & Add Button */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-gray-900 transition-colors duration-200">
                  ₹{displayPrice}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{displayOriginalPrice}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold text-emerald-600 block">
                {currentPricing.savings > 0 ? `⚡ Save ₹${currentPricing.savings}` : '⚡ 15-min delivery'}
              </span>
            </div>

            {/* Add / Quantity Counter for Selected Size */}
            {totalCartQty === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1, selectedSize, displayPrice, displayOriginalPrice);
                }}
                className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-extrabold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
                {hasMultipleSizes && <ChevronDown className="w-2.5 h-2.5 opacity-80" />}
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-md overflow-hidden font-bold text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (productCartItems.length > 1) {
                        setIsSizeModalOpen(true);
                      } else {
                        const onlyItem = productCartItems[0];
                        updateQuantity(onlyItem.cartItemId, onlyItem.quantity - 1);
                      }
                    }}
                    className="px-2.5 py-1.5 hover:bg-emerald-700 active:bg-emerald-800 transition cursor-pointer"
                    title="Decrease"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-extrabold text-xs">{totalCartQty}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (productCartItems.length > 1) {
                        setIsSizeModalOpen(true);
                      } else {
                        const onlyItem = productCartItems[0];
                        updateQuantity(onlyItem.cartItemId, onlyItem.quantity + 1);
                      }
                    }}
                    className="px-2.5 py-1.5 hover:bg-emerald-700 active:bg-emerald-800 transition cursor-pointer"
                    title="Increase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {hasMultipleSizes && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSizeModalOpen(true);
                    }}
                    className="text-[10px] font-black text-emerald-800 hover:text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 px-1.5 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-0.5"
                    title="Choose sizes / quantities"
                  >
                    <Layers className="w-2.5 h-2.5" />
                    <span>Sizes</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Size Selection Modal (Blinkit / Swiggy style popup) */}
      {hasMultipleSizes && (
        <SizeSelectionModal
          isOpen={isSizeModalOpen}
          onClose={() => setIsSizeModalOpen(false)}
          product={product}
          availableSizes={availableSizes}
        />
      )}
    </>
  );
};
