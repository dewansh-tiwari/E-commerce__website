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

    // 2. Generate unique Order ID
    const orderId = 'ORD' + Math.floor(100000 + Math.random() * 900000);

    // 3. Create initial tracking timeline
    const timeline = [
      { status: 'Order Placed', timestamp: new Date(), note: 'Order successfully received' },
      { status: 'Confirmed', timestamp: new Date(Date.now() + 60000), note: 'Verified by Store Manager' }
    ];

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
      discountAmount: discountAmount || 0,
      deliveryFee: deliveryFee || 0,
      taxes: taxes || 0,
      coinsRedeemed: coinsRedeemed || 0,
      coinsDiscount: coinsDiscount || 0,
      totalAmount,
      estimatedDeliveryTime: deliverySlot?.type === 'express' ? '20-30 minutes' : 'Scheduled'
    });

    // 4. Deduct redeemed coins & award 10% cash-back coins!
    const user = await User.findById(req.user._id);
    let newCoins = user.coins - (coinsRedeemed || 0);
    const earnedCoins = Math.floor(totalAmount * 0.05); // 5% cashback in SuperCoins 🪙
    newCoins += earnedCoins;

    user.coins = Math.max(0, newCoins);
    await user.save();

    // 5. Create Order Notification
    await Notification.create({
      user: req.user._id,
      title: `Order #${orderId} Confirmed! 🎉`,
      message: `Your order of ₹${totalAmount} is confirmed and will arrive in 20-30 mins. You earned ${earnedCoins} SuperCoins!`,
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
