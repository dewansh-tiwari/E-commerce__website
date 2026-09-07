import React, { useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, Zap, Star, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProductPriceForSize } from '../utils/productVariants';

export const SizeSelectionModal = ({
  isOpen,
  onClose,
  product,
  availableSizes = []
}) => {
  const { cartItems, addToCart, updateQuantity, getItemQuantity, setIsCartOpen } = useCart();

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const productCartItems = cartItems.filter(item => item.product === product._id);
  const totalProductQty = productCartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalProductAmount = productCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const discountPercent = product.discountPercent || (
    product.originalPrice > product.price 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Product Preview */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between gap-3 bg-gradient-to-r from-emerald-50/60 to-teal-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-emerald-100 p-1 flex-shrink-0 shadow-xs overflow-hidden flex items-center justify-center">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/100x100/f0fdf4/059669?text=${encodeURIComponent(product.brand || 'Item')}`;
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                  {product.brand}
                </span>
                {discountPercent > 0 && (
                  <span className="text-[10px] font-black text-white bg-emerald-600 px-1.5 py-0.5 rounded-full shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-0.5">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {product.rating || 4.5}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  15-min delivery
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subheading */}
        <div className="px-4 sm:px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📏</span>
            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
              Select Size / Pack
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-500">
            {availableSizes.length} {availableSizes.length === 1 ? 'option' : 'options available'}
          </span>
        </div>

        {/* Size Variant Options List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-gray-50">
          {availableSizes.map((size) => {
            const quantity = getItemQuantity(product._id, size);
            const cartItemId = `${product._id}_${size}`;
            const isInCart = quantity > 0;
            const pricing = getProductPriceForSize(product, size);

            return (
              <div
                key={size}
                className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                  isInCart
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-400/30'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50/60'
                }`}
              >
                {/* Size and Pricing Details */}
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition ${
                    isInCart 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {isInCart ? <Check className="w-4 h-4 stroke-[3]" /> : size.slice(0, 3)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-gray-900">
                        {size}
                      </span>
                      {pricing.discountPercent > 0 && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                          {pricing.discountPercent}% OFF
                        </span>
                      )}
                      {isInCart && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          {quantity} in cart
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-sm font-black text-gray-900">₹{pricing.price}</span>
                      {pricing.originalPrice > pricing.price && (
                        <span className="text-[11px] text-gray-400 line-through">
                          ₹{pricing.originalPrice}
                        </span>
                      )}
                      {pricing.savings > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600">
                          (Save ₹{pricing.savings})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add or Counter Action */}
                <div className="flex-shrink-0">
                  {quantity === 0 ? (
                    <button
                      type="button"
                      onClick={() => addToCart(product, 1, size, pricing.price, pricing.originalPrice)}
                      className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD</span>
                    </button>
                  ) : (
                    <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-md overflow-hidden font-bold text-xs border border-emerald-600">
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartItemId, quantity - 1)}
                        className="px-2.5 py-2 hover:bg-emerald-700 active:bg-emerald-800 transition"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-black text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartItemId, quantity + 1)}
                        className="px-2.5 py-2 hover:bg-emerald-700 active:bg-emerald-800 transition"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div>
            {totalProductQty > 0 ? (
              <div>
                <span className="text-xs text-gray-500 font-bold block">
                  {totalProductQty} {totalProductQty === 1 ? 'item' : 'items'} added
                </span>
                <span className="text-sm font-black text-emerald-700">
                  Total: ₹{totalProductAmount}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 font-medium">
                Choose a size to add to your order
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalProductQty > 0 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsCartOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View Cart</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
