import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new order
router.post('/', protect, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      deliverySlot,
      paymentMethod,
      subtotal,
      discountAmount,
      deliveryFee,
      taxes,
      coinsRedeemed,
      coinsDiscount,
      totalAmount
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    // 1. Inventory check & stock decrement
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} no longer exists` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} units of ${product.name} remaining in stock`
        });
      }
    }

    // Decrement stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // 2. Calculate Automatic Shopkeeper Tier Discounts
    // Rule:
    // If shopkeeper order > ₹9,999 => flat ₹1,599 OFF automatically
    // If shopkeeper order > ₹2,999 => flat ₹500 OFF automatically
    const isShopkeeper = req.user.role === 'shopkeeper' || req.body.isShopkeeperOrder;
    let autoShopkeeperDiscount = 0;

    if (isShopkeeper) {
      if (subtotal > 9999) {
        autoShopkeeperDiscount = 1599;
      } else if (subtotal > 2999) {
        autoShopkeeperDiscount = 500;
      }
    }

    const clientProvidedShopkeeperDiscount = Number(req.body.shopkeeperDiscount || 0);
    const effectiveShopkeeperDiscount = Math.max(autoShopkeeperDiscount, clientProvidedShopkeeperDiscount);

    // Total discount combines standard coupons/welcome offers + automatic shopkeeper discount
    const totalDiscountAmount = Math.max(
      Number(discountAmount || 0),
      (Number(discountAmount || 0) + (effectiveShopkeeperDiscount > (discountAmount || 0) ? effectiveShopkeeperDiscount - (discountAmount || 0) : 0))
    );

    // 3. Generate unique Order ID
    const orderId = (isShopkeeper ? 'B2B' : 'ORD') + Math.floor(100000 + Math.random() * 900000);

    // 4. Create initial tracking timeline
    const timeline = [
      { status: 'Order Placed', timestamp: new Date(), note: isShopkeeper ? 'Shopkeeper wholesale order received' : 'Order successfully received' },
      { status: 'Confirmed', timestamp: new Date(Date.now() + 60000), note: 'Verified by Store Manager' }
    ];

    const finalCalculatedTotal = Math.max(0, subtotal - totalDiscountAmount - (coinsDiscount || 0) + (deliveryFee || 0) + (taxes || 0));
    const effectiveTotalAmount = totalAmount || finalCalculatedTotal;

    const order = await Order.create({
      orderId,
      user: req.user._id,
      items,
      shippingAddress,
      deliverySlot: deliverySlot || { type: 'express', timeSlot: '15-25 Minutes' },
      paymentMethod,
      paymentStatus: 'completed',
      orderStatus: 'Confirmed',
      timeline,
      subtotal,
      discountAmount: totalDiscountAmount,
      shopkeeperDiscount: effectiveShopkeeperDiscount,
      deliveryFee: deliveryFee || 0,
      taxes: taxes || 0,
      coinsRedeemed: coinsRedeemed || 0,
      coinsDiscount: coinsDiscount || 0,
      totalAmount: effectiveTotalAmount,
      estimatedDeliveryTime: deliverySlot?.type === 'express' ? '20-30 minutes' : 'Scheduled'
    });

    // 5. Deduct redeemed coins & award cash-back coins (Shopkeepers get 7% coins cashback)
    const user = await User.findById(req.user._id);
    let newCoins = user.coins - (coinsRedeemed || 0);
    const cashbackRate = isShopkeeper ? 0.07 : 0.05;
    const earnedCoins = Math.floor(effectiveTotalAmount * cashbackRate);
    newCoins += earnedCoins;

    user.coins = Math.max(0, newCoins);
    await user.save();

    // 6. Create Order Notification
    await Notification.create({
      user: req.user._id,
      title: isShopkeeper ? `Wholesale Order #${orderId} Confirmed! 🏪` : `Order #${orderId} Confirmed! 🎉`,
      message: isShopkeeper && effectiveShopkeeperDiscount > 0
        ? `Wholesale order of ₹${effectiveTotalAmount} confirmed! Saved ₹${effectiveShopkeeperDiscount} with automatic shopkeeper discount. You earned ${earnedCoins} SuperCoins!`
        : `Your order of ₹${effectiveTotalAmount} is confirmed and will arrive in 20-30 mins. You earned ${earnedCoins} SuperCoins!`,
      type: 'order'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's welcome offer status (First 3 Orders: Flat 100 off above 199 + Free Delivery + Free Handling)
router.get('/welcome-offer-status', protect, async (req, res) => {
  try {
    const ordersCount = await Order.countDocuments({ 
      user: req.user._id,
      orderStatus: { $ne: 'Cancelled' }
    });
    const isEligible = ordersCount < 3;
    res.json({
      ordersPlaced: ordersCount,
      isEligible,
      currentOrderNumber: Math.min(3, ordersCount + 1),
      ordersRemaining: Math.max(0, 3 - ordersCount),
      discountAmount: 100,
      minOrderValue: 199,
      freeDelivery: true,
      freeHandling: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID (with tracking status)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify permission (customer who owns it or admin)
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
