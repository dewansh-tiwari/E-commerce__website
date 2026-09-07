import React, { createContext, useContext, useState, useEffect } from 'react';
import { couponService, orderService } from '../services/api';
import { useAuth } from './AuthContext';
import { getProductPriceForSize } from '../utils/productVariants';

const CartContext = createContext();

const FREE_DELIVERY_THRESHOLD = 299;
const WELCOME_MIN_ORDER = 199;
const WELCOME_DISCOUNT_VALUE = 100;

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('freshkart_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [redeemCoins, setRedeemCoins] = useState(0); // Coins user selected to redeem at checkout
  const [ordersPlacedCount, setOrdersPlacedCount] = useState(0);
  const [isShopkeeperMode, setIsShopkeeperMode] = useState(() => {
    return localStorage.getItem('freshkart_shopkeeper_mode') === 'true';
  });

  // Sync shopkeeper mode if user has shopkeeper role
  useEffect(() => {
    if (user?.role === 'shopkeeper') {
      setIsShopkeeperMode(true);
      localStorage.setItem('freshkart_shopkeeper_mode', 'true');
    }
  }, [user]);

  const toggleShopkeeperMode = () => {
    setIsShopkeeperMode(prev => {
      const nextVal = !prev;
      localStorage.setItem('freshkart_shopkeeper_mode', String(nextVal));
      return nextVal;
    });
  };

  const isShopkeeper = user?.role === 'shopkeeper' || isShopkeeperMode;

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('freshkart_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fetch user order count for First 3 Orders eligibility
  const fetchOrderEligibility = async () => {
    if (user) {
      try {
        const res = await orderService.getWelcomeOfferStatus();
        setOrdersPlacedCount(res.data.ordersPlaced || 0);
      } catch (err) {
        // Fallback: check my-orders list
        try {
          const ordRes = await orderService.getMyOrders();
          const activeOrders = ordRes.data.filter(o => o.orderStatus !== 'Cancelled');
          setOrdersPlacedCount(activeOrders.length);
        } catch (_) {
          setOrdersPlacedCount(0);
        }
      }
    } else {
      setOrdersPlacedCount(0); // Guest users are considered first-order eligible
    }
  };

  useEffect(() => {
    fetchOrderEligibility();
  }, [user]);

  const addToCart = (product, quantity = 1, selectedSize = null, customPrice = null, customOriginalPrice = null) => {
    const size = selectedSize || product.selectedSize || product.weight || 'Standard';
    const cartItemId = `${product._id}_${size}`;
    const variantPricing = getProductPriceForSize(product, size);
    const itemPrice = customPrice !== null && customPrice !== undefined ? customPrice : (variantPricing.price || product.price);
    const itemOriginalPrice = customOriginalPrice !== null && customOriginalPrice !== undefined ? customOriginalPrice : (variantPricing.originalPrice || product.originalPrice);

    setCartItems(prev => {
      const existing = prev.find(item => (item.cartItemId || `${item.product}_${item.selectedSize || item.weight}`) === cartItemId);
      if (existing) {
        return prev.map(item =>
          (item.cartItemId || `${item.product}_${item.selectedSize || item.weight}`) === cartItemId
            ? { ...item, quantity: item.quantity + quantity, price: itemPrice, originalPrice: itemOriginalPrice }
            : item
        );
      } else {
        return [...prev, {
          cartItemId,
          product: product._id,
          name: product.name,
          brand: product.brand,
          price: itemPrice,
          originalPrice: itemOriginalPrice,
          weight: size,
          selectedSize: size,
          image: product.images?.[0] || '',
          quantity,
          stock: product.stock
        }];
      }
    });
  };

  const updateQuantity = (identifier, newQty) => {
    if (newQty <= 0) {
      removeFromCart(identifier);
    } else {
      setCartItems(prev => prev.map(item =>
        (item.cartItemId === identifier || item.product === identifier)
          ? { ...item, quantity: newQty }
          : item
      ));
    }
  };

  const removeFromCart = (identifier) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== identifier && item.product !== identifier));
  };

  const getItemQuantity = (productId, selectedSize = null) => {
    if (!selectedSize) {
      const item = cartItems.find(i => i.product === productId);
      return item ? item.quantity : 0;
    }
    const cartItemId = `${productId}_${selectedSize}`;
    const item = cartItems.find(i => (i.cartItemId || `${i.product}_${i.selectedSize || i.weight}`) === cartItemId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setRedeemCoins(0);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const originalSubtotal = cartItems.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  const itemDiscount = originalSubtotal - subtotal;

  // Automatic Shopkeeper Tiered Discounts
  // Rule:
  // - Subtotal > 9,999 => flat ₹1,599 OFF automatically
  // - Subtotal > 2,999 => flat ₹500 OFF automatically
  let shopkeeperDiscount = 0;
  let shopkeeperTier = 0; // 0: none, 1: ₹500, 2: ₹1,599

  if (isShopkeeper) {
    if (subtotal > 9999) {
      shopkeeperDiscount = 1599;
      shopkeeperTier = 2;
    } else if (subtotal > 2999) {
      shopkeeperDiscount = 500;
      shopkeeperTier = 1;
    }
  }

  const shopkeeperOffer = {
    isShopkeeper,
    isShopkeeperMode,
    tier: shopkeeperTier,
    discountAmount: shopkeeperDiscount,
    amountToTier1: Math.max(0, 3000 - subtotal),
    amountToTier2: Math.max(0, 10000 - subtotal),
    progressToTier1: Math.min(100, Math.round((subtotal / 3000) * 100)),
    progressToTier2: subtotal <= 2999 ? 0 : Math.min(100, Math.round(((subtotal - 2999) / 7000) * 100)),
    tier1Threshold: 2999,
    tier1Discount: 500,
    tier2Threshold: 9999,
    tier2Discount: 1599
  };

  // First 3 Orders Welcome Offer Logic
  const isWelcomeEligible = ordersPlacedCount < 3;
  const isWelcomeApplied = isWelcomeEligible && subtotal > WELCOME_MIN_ORDER;
  const currentOrderNumber = Math.min(3, ordersPlacedCount + 1);
  const ordersRemaining = Math.max(0, 3 - ordersPlacedCount);
  const welcomeDiscount = isWelcomeApplied ? WELCOME_DISCOUNT_VALUE : 0;

  // Delivery Fee: Free if welcome offer applied, or if subtotal >= FREE_DELIVERY_THRESHOLD (299), or cart empty
  const standardDeliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 25;
  const deliveryFee = (isWelcomeApplied || (isShopkeeper && subtotal > 2999)) ? 0 : standardDeliveryFee;
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  // Handling charge: Free if welcome offer applied, else standard ₹15
  const standardHandling = subtotal > 0 ? 15 : 0;
  const taxesAndHandling = isWelcomeApplied ? 0 : standardHandling;

  // Coupons discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.code === 'WELCOME100') {
      couponDiscount = 0;
    } else {
      couponDiscount = appliedCoupon.discountAmount;
    }
  }

  const coinsDiscount = Math.floor(redeemCoins / 10); // 10 coins = ₹1

  // Final Total calculation with Shopkeeper Automatic Discount
  const finalTotal = Math.max(
    0,
    subtotal - welcomeDiscount - shopkeeperDiscount - couponDiscount - coinsDiscount + deliveryFee + taxesAndHandling
  );

  const totalItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Total savings breakdown
  const welcomeOfferSavings = isWelcomeApplied ? (WELCOME_DISCOUNT_VALUE + 25 + 15) : 0;
  const totalSavings = itemDiscount + welcomeDiscount + shopkeeperDiscount + couponDiscount + coinsDiscount + (isWelcomeApplied ? 40 : 0);

  const welcomeOffer = {
    isEligible: isWelcomeEligible,
    isApplied: isWelcomeApplied,
    ordersPlaced: ordersPlacedCount,
    currentOrderNumber,
    ordersRemaining,
    discountValue: WELCOME_DISCOUNT_VALUE,
    minOrder: WELCOME_MIN_ORDER,
    amountNeeded: Math.max(0, 200 - subtotal),
    freeDelivery: isWelcomeApplied,
    freeHandling: isWelcomeApplied,
    savings: welcomeOfferSavings
  };

  const applyCoupon = async (code) => {
    try {
      setCouponError('');
      const upperCode = code.toUpperCase();

      if (upperCode === 'WELCOME100') {
        if (!isWelcomeEligible) {
          throw new Error('This welcome offer is only valid on your first 3 orders.');
        }
        if (subtotal <= WELCOME_MIN_ORDER) {
          throw new Error(`Minimum order value above ₹${WELCOME_MIN_ORDER} required for WELCOME100.`);
        }
        setAppliedCoupon({
          code: 'WELCOME100',
          discountAmount: WELCOME_DISCOUNT_VALUE,
          description: 'First 3 Orders: Flat ₹100 OFF + FREE Delivery + FREE Handling'
        });
        return;
      }

      const res = await couponService.validateCoupon(upperCode, subtotal);
      setAppliedCoupon(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid coupon code';
      setCouponError(msg);
      setAppliedCoupon(null);
      throw err;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      getItemQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      subtotal,
      originalSubtotal,
      itemDiscount,
      deliveryFee,
      standardDeliveryFee,
      amountToFreeDelivery,
      FREE_DELIVERY_THRESHOLD,
      taxesAndHandling,
      standardHandling,
      appliedCoupon,
      couponError,
      applyCoupon,
      removeCoupon,
      redeemCoins,
      setRedeemCoins,
      coinsDiscount,
      finalTotal,
      totalItemCount,
      welcomeOffer,
      welcomeDiscount,
      isShopkeeper,
      isShopkeeperMode,
      setIsShopkeeperMode,
      toggleShopkeeperMode,
      shopkeeperDiscount,
      shopkeeperOffer,
      totalSavings,
      refreshOrderCount: fetchOrderEligibility
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
