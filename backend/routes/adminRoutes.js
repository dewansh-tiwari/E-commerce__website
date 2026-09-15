import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getTrafficStats } from '../middleware/trafficManager.js';

const router = express.Router();

// Apply protect & admin middleware to all admin routes
router.use(protect, admin);

// Admin Live Website Traffic & Performance Monitoring
router.get('/traffic', (req, res) => {
  res.json(getTrafficStats());
});

// Admin Dashboard Summary Metrics
router.get('/dashboard', async (req, res) => {
  try {
    const totalSalesRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed', orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['Order Placed', 'Confirmed', 'Preparing'] } });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalShopkeepers = await User.countDocuments({ role: 'shopkeeper' });
    const totalProducts = await Product.countDocuments();

    // Low stock items (stock <= 10)
    const lowStockProducts = await Product.find({ stock: { $lte: 10 } }).select('name brand category stock price images');

    // Recent orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email role');

    // Monthly / Daily chart data simulation
    const salesChartData = [
      { name: 'Mon', revenue: 14500, orders: 32 },
      { name: 'Tue', revenue: 18200, orders: 41 },
      { name: 'Wed', revenue: 22400, orders: 55 },
      { name: 'Thu', revenue: 19800, orders: 46 },
      { name: 'Fri', revenue: 28900, orders: 68 },
      { name: 'Sat', revenue: 34100, orders: 84 },
      { name: 'Sun', revenue: 39500, orders: 92 }
    ];

    res.json({
      revenue: totalSalesRevenue[0]?.total || 0,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalShopkeepers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      salesChartData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Product CRUD
router.post('/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Category CRUD
router.post('/categories', async (req, res) => {
  try {
    const { name, icon, image, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await Category.create({ name, slug, icon, image, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Order Management
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== 'All' ? { orderStatus: status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('user', 'name email phone');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by Admin`
    });

    await order.save();

    // Create Notification for Customer
    await Notification.create({
      user: order.user,
      title: `Order Update #${order.orderId}`,
      message: `Your order is now: ${status}. ${note || ''}`,
      type: 'order'
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Customer & Shopkeeper Management
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : { role: { $in: ['customer', 'shopkeeper'] } };
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'blocked'
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    await user.save();

    res.json({ message: `User status changed to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
