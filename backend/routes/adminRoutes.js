import express from 'express';
import { supabase } from '../config/supabase.js';
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
    // Try Supabase RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_dashboard_metrics');

    const salesChartData = [
      { name: 'Mon', revenue: 14500, orders: 32 },
      { name: 'Tue', revenue: 18200, orders: 41 },
      { name: 'Wed', revenue: 22400, orders: 55 },
      { name: 'Thu', revenue: 19800, orders: 46 },
      { name: 'Fri', revenue: 28900, orders: 68 },
      { name: 'Sat', revenue: 34100, orders: 84 },
      { name: 'Sun', revenue: 39500, orders: 92 }
    ];

    if (!rpcErr && rpcData) {
      return res.json({
        ...rpcData,
        salesChartData
      });
    }

    // Direct fallback
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'completed')
      .neq('order_status', 'Cancelled');

    const totalSalesRevenue = (completedOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: pendingOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('order_status', ['Order Placed', 'Confirmed', 'Preparing']);
    const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer');
    const { count: totalShopkeepers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'shopkeeper');
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });

    // Low stock items (stock <= 10)
    const { data: lowStock } = await supabase
      .from('products')
      .select('id, name, brand, category, stock, price, images')
      .lte('stock', 10)
      .limit(10);

    // Recent orders with user
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select('id, order_id, total_amount, order_status, created_at, users(name, email, role)')
      .order('created_at', { ascending: false })
      .limit(6);

    const recentOrders = (recentOrdersData || []).map(o => ({
      _id: o.id,
      orderId: o.order_id,
      totalAmount: Number(o.total_amount),
      orderStatus: o.order_status,
      createdAt: o.created_at,
      user: o.users ? { name: o.users.name, email: o.users.email, role: o.users.role } : null
    }));

    res.json({
      revenue: totalSalesRevenue,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalCustomers: totalCustomers || 0,
      totalShopkeepers: totalShopkeepers || 0,
      totalProducts: totalProducts || 0,
      lowStockProducts: (lowStock || []).map(p => ({ ...p, _id: p.id })),
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
    const productPayload = {
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      sub_category: req.body.subCategory || 'General',
      price: Number(req.body.price),
      original_price: Number(req.body.originalPrice || req.body.price),
      stock: Number(req.body.stock || 50),
      weight: req.body.weight || 'pack',
      sizes: req.body.sizes || [],
      unit: req.body.unit || 'pack',
      images: req.body.images || [],
      description: req.body.description || '',
      key_features: req.body.keyFeatures || [],
      ingredients: req.body.ingredients || '100% Pure & Natural',
      nutrition: req.body.nutrition || { calories: 'N/A', protein: 'N/A', carbs: 'N/A', fat: 'N/A' },
      storage_info: req.body.storageInfo || 'Store in cool place',
      is_organic: Boolean(req.body.isOrganic),
      is_veg: req.body.isVeg !== undefined ? Boolean(req.body.isVeg) : true,
      dietary_tags: req.body.dietaryTags || [],
      is_bestseller: Boolean(req.body.isBestSeller),
      is_trending: Boolean(req.body.isTrending),
      is_deal: Boolean(req.body.isDeal),
      is_fresh_arrival: Boolean(req.body.isFreshArrival)
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(productPayload)
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json({ ...product, _id: product.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.brand) updates.brand = req.body.brand;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.subCategory) updates.sub_category = req.body.subCategory;
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.originalPrice !== undefined) updates.original_price = Number(req.body.originalPrice);
    if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
    if (req.body.weight) updates.weight = req.body.weight;
    if (req.body.sizes) updates.sizes = req.body.sizes;
    if (req.body.images) updates.images = req.body.images;
    if (req.body.description) updates.description = req.body.description;
    if (req.body.isDeal !== undefined) updates.is_deal = Boolean(req.body.isDeal);
    if (req.body.isTrending !== undefined) updates.is_trending = Boolean(req.body.isTrending);
    if (req.body.isBestSeller !== undefined) updates.is_bestseller = Boolean(req.body.isBestSeller);
    if (req.body.isFreshArrival !== undefined) updates.is_fresh_arrival = Boolean(req.body.isFreshArrival);

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !product) return res.status(404).json({ message: 'Product not found' });
    res.json({ ...product, _id: product.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ message: error.message });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Category CRUD
router.post('/categories', async (req, res) => {
  try {
    const { name, icon, image, description } = req.body;
    const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data: category, error } = await supabase
      .from('categories')
      .insert({ name, slug, icon: icon || '🛒', image: image || '', description: description || '' })
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json({ ...category, _id: category.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ message: error.message });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Order Management
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('orders')
      .select('*, users(name, email, phone)')
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('order_status', status);
    }

    const { data: orders, error } = await query;
    if (error) return res.status(500).json({ message: error.message });

    const formatted = (orders || []).map(o => ({
      ...o,
      _id: o.id,
      orderId: o.order_id,
      orderStatus: o.order_status,
      totalAmount: Number(o.total_amount),
      user: o.users ? { name: o.users.name, email: o.users.email, phone: o.users.phone } : null
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const { data: order, error } = await supabase
      .from('orders')
      .update({ order_status: status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !order) return res.status(404).json({ message: 'Order not found' });

    // Append to timeline
    await supabase.from('order_timeline').insert({
      order_id: order.id,
      status,
      note: note || `Status updated to ${status} by Admin`
    });

    // Create Notification for Customer
    await supabase.from('notifications').insert({
      user_id: order.user_id,
      title: `Order Update #${order.order_id}`,
      message: `Your order is now: ${status}. ${note || ''}`,
      type: 'order'
    });

    res.json({ ...order, _id: order.id, orderStatus: order.order_status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Customer & Shopkeeper Management
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = supabase
      .from('users')
      .select('id, name, email, phone, role, status, coins, store_name, gst_number, created_at')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    } else {
      query = query.in('role', ['customer', 'shopkeeper']);
    }

    const { data: users, error } = await query;
    if (error) return res.status(500).json({ message: error.message });

    const formatted = (users || []).map(u => ({ ...u, _id: u.id }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'blocked'
    const { data: user, error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, name, email, role, status')
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User status changed to ${status}`, user: { ...user, _id: user.id } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
