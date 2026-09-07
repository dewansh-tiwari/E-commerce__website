import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to format order for frontend
const formatOrder = (order, items = [], timeline = []) => {
  return {
    ...order,
    _id: order.id,
    orderId: order.order_id,
    user: order.user_id,
    shippingAddress: order.shipping_address,
    deliverySlot: order.delivery_slot,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    discountAmount: Number(order.discount_amount),
    shopkeeperDiscount: Number(order.shopkeeper_discount),
    deliveryFee: Number(order.delivery_fee),
    taxes: Number(order.taxes),
    coinsRedeemed: order.coins_redeemed,
    coinsDiscount: Number(order.coins_discount),
    totalAmount: Number(order.total_amount),
    estimatedDeliveryTime: order.estimated_delivery_time,
    driverInfo: order.driver_info,
    createdAt: order.created_at,
    items: items.map(item => ({
      _id: item.id,
      product: item.product_id,
      name: item.name,
      brand: item.brand,
      price: Number(item.price),
      quantity: item.quantity,
      weight: item.weight,
      size: item.size,
      selectedSize: item.selected_size,
      image: item.image
    })),
    timeline: timeline.map(t => ({
      _id: t.id,
      status: t.status,
      timestamp: t.timestamp,
      note: t.note
    }))
  };
};

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
      totalAmount,
      isShopkeeperOrder
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    const isShopkeeper = req.user.role === 'shopkeeper' || isShopkeeperOrder;

    // Try Supabase RPC Function (Atomic Transaction) first
    const sanitizedItems = items.map(i => ({
      product_id: i.product || i._id || i.id,
      name: i.name,
      brand: i.brand || '',
      price: Number(i.price),
      quantity: Number(i.quantity),
      weight: i.weight || '',
      size: i.size || '',
      selectedSize: i.selectedSize || '',
      image: i.image || ''
    }));

    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_transaction', {
      p_user_id: req.user.id,
      p_items: sanitizedItems,
      p_shipping_address: shippingAddress || {},
      p_delivery_slot: deliverySlot || { type: 'express', timeSlot: '15-25 Minutes' },
      p_payment_method: paymentMethod || 'cod',
      p_subtotal: Number(subtotal || 0),
      p_discount_amount: Number(discountAmount || 0),
      p_delivery_fee: Number(deliveryFee || 0),
      p_taxes: Number(taxes || 0),
      p_coins_redeemed: Number(coinsRedeemed || 0),
      p_coins_discount: Number(coinsDiscount || 0),
      p_total_amount: Number(totalAmount || 0),
      p_is_shopkeeper_order: Boolean(isShopkeeper)
    });

    if (!rpcError && rpcResult && rpcResult.orderUuid) {
      // Fetch full order for response
      const { data: createdOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', rpcResult.orderUuid)
        .single();

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', rpcResult.orderUuid);

      const { data: orderTimeline } = await supabase
        .from('order_timeline')
        .select('*')
        .eq('order_id', rpcResult.orderUuid);

      return res.status(201).json(formatOrder(createdOrder, orderItems || [], orderTimeline || []));
    }

    // Fallback: Direct Supabase Queries if RPC is not loaded
    // 1. Inventory check
    for (const item of sanitizedItems) {
      const { data: prod, error } = await supabase
        .from('products')
        .select('name, stock')
        .eq('id', item.product_id)
        .single();

      if (error || !prod) {
        return res.status(404).json({ message: `Product ${item.name} no longer exists` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${prod.stock} units of ${prod.name} remaining in stock`
        });
      }
    }

    // 2. Decrement stock
    for (const item of sanitizedItems) {
      const { data: p } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
      await supabase.from('products').update({ stock: Math.max(0, p.stock - item.quantity) }).eq('id', item.product_id);
    }

    // 3. Wholesale discount rule
    let autoShopkeeperDiscount = 0;
    if (isShopkeeper) {
      if (subtotal > 9999) autoShopkeeperDiscount = 1599;
      else if (subtotal > 2999) autoShopkeeperDiscount = 500;
    }
    const effectiveShopkeeperDiscount = Math.max(autoShopkeeperDiscount, Number(req.body.shopkeeperDiscount || 0));
    const totalDiscountAmount = Math.max(Number(discountAmount || 0), effectiveShopkeeperDiscount);

    // 4. Generate Order ID
    const orderId = (isShopkeeper ? 'B2B' : 'ORD') + Math.floor(100000 + Math.random() * 900000);

    // 5. Insert order
    const { data: newOrder, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        user_id: req.user.id,
        shipping_address: shippingAddress || {},
        delivery_slot: deliverySlot || { type: 'express', timeSlot: '15-25 Minutes' },
        payment_method: paymentMethod || 'cod',
        payment_status: 'completed',
        order_status: 'Confirmed',
        subtotal: Number(subtotal || 0),
        discount_amount: totalDiscountAmount,
        shopkeeper_discount: effectiveShopkeeperDiscount,
        delivery_fee: Number(deliveryFee || 0),
        taxes: Number(taxes || 0),
        coins_redeemed: Number(coinsRedeemed || 0),
        coins_discount: Number(coinsDiscount || 0),
        total_amount: Number(totalAmount || 0),
        estimated_delivery_time: deliverySlot?.type === 'express' ? '20-30 minutes' : 'Scheduled'
      })
      .select()
      .single();

    if (orderErr) return res.status(500).json({ message: orderErr.message });

    // 6. Insert order items
    const itemsToInsert = sanitizedItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
      weight: item.weight,
      size: item.size,
      selected_size: item.selectedSize,
      image: item.image
    }));
    await supabase.from('order_items').insert(itemsToInsert);

    // 7. Insert timeline
    const timelineToInsert = [
      { order_id: newOrder.id, status: 'Order Placed', note: isShopkeeper ? 'Shopkeeper wholesale order received' : 'Order successfully received' },
      { order_id: newOrder.id, status: 'Confirmed', note: 'Verified by Store Manager' }
    ];
    await supabase.from('order_timeline').insert(timelineToInsert);

    // 8. SuperCoins cashback & update
    const cashbackRate = isShopkeeper ? 0.07 : 0.05;
    const earnedCoins = Math.floor(Number(totalAmount) * cashbackRate);
    const newCoins = Math.max(0, (req.user.coins - (coinsRedeemed || 0)) + earnedCoins);

    await supabase.from('users').update({ coins: newCoins }).eq('id', req.user.id);

    // 9. Notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: isShopkeeper ? `Wholesale Order #${orderId} Confirmed! 🏪` : `Order #${orderId} Confirmed! 🎉`,
      message: `Your order of ₹${totalAmount} is confirmed! You earned ${earnedCoins} SuperCoins!`,
      type: 'order'
    });

    const { data: itemsResult } = await supabase.from('order_items').select('*').eq('order_id', newOrder.id);
    const { data: timelineResult } = await supabase.from('order_timeline').select('*').eq('order_id', newOrder.id);

    res.status(201).json(formatOrder(newOrder, itemsResult || [], timelineResult || []));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_timeline(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    const formatted = (orders || []).map(o => formatOrder(o, o.order_items || [], o.order_timeline || []));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's welcome offer status
router.get('/welcome-offer-status', protect, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .neq('order_status', 'Cancelled');

    if (error) return res.status(500).json({ message: error.message });

    const ordersCount = count || 0;
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

// Get order by ID or order_id
router.get('/:id', protect, async (req, res) => {
  try {
    const identifier = req.params.id;
    let query = supabase.from('orders').select('*, order_items(*), order_timeline(*)');

    // Check if UUID or order_id
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('order_id', identifier);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(formatOrder(order, order.order_items || [], order.order_timeline || []));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
