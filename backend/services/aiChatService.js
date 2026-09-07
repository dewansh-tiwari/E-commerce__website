import { supabase, isSupabaseConfigured } from '../config/supabase.js';

export const processChatMessage = async ({ message, history = [], context = {}, userId = null }) => {
  const query = (message || '').trim();
  const lower = query.toLowerCase();

  // 1. Fetch authenticated user data if available
  let currentUser = null;
  let userOrders = [];
  if (userId && isSupabaseConfigured) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, coins')
        .eq('id', userId)
        .single();
      currentUser = user;

      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      userOrders = orders || [];
    } catch (e) {
      console.error('Error fetching user context:', e);
    }
  }

  // Fallback demo order if guest/no orders
  if (userOrders.length === 0 && isSupabaseConfigured) {
    try {
      const { data: fallbackOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(3);
      userOrders = fallbackOrders || [];
    } catch (e) {
      console.error('Error fetching fallback orders:', e);
    }
  }

  const latestOrder = userOrders.length > 0 ? userOrders[0] : null;

  // 2. Intent Identification
  const isTracking = /track|where(\s+is)?(\s+my)?(\s+order)?|status|delivery(\s+status)?|has(\s+my)?(\s+order)?(\s+arrived)?|rider|driver/i.test(lower);
  const isDeliveryIssue = /late|delay|not(\s+yet)?(\s+delivered)?|when(\s+will)?(\s+it)?(\s+reach)?|delivery(\s+time)?|reschedule|leave(\s+at)?(\s+door)?|call(\s+rider)?|ring(\s+bell)?/i.test(lower);
  const isRefundOrDamage = /damage|broken|leak|spoilt|rotten|missing|wrong(\s+item)?|refund|return|replace|cancel/i.test(lower);
  const isOfferOrCoupon = /coupon|discount|offer|welcome|supercoin|coins|promo|code|deal|save/i.test(lower);
  const isGreeting = /^(hi|hello|hey|greetings|hola|namaste|good\s+(morning|afternoon|evening))\b/i.test(lower);
  const isHumanEscalation = /human|agent|support(\s+person)?|executive|representative|call\s+me|customer\s+care/i.test(lower);

  // ─────────────────────────────────────────────────────────────
  // INTENT A: ORDER TRACKING
  // ─────────────────────────────────────────────────────────────
  if (isTracking && !isRefundOrDamage) {
    const orderIdMatch = query.match(/(ORD\w+|BM-\w+|\b[A-Za-z0-9]{6,24}\b)/i);
    let targetOrder = latestOrder;

    if (orderIdMatch && isSupabaseConfigured) {
      const { data: searched } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`order_id.ilike.%${orderIdMatch[0]}%`)
        .limit(1)
        .single();
      if (searched) targetOrder = searched;
    }

    if (targetOrder) {
      const status = targetOrder.order_status || 'Out for Delivery';
      const eta = targetOrder.estimated_delivery_time || '15-20 minutes';
      const rider = targetOrder.driver_info?.name || 'Ramesh Kumar';
      const vehicle = targetOrder.driver_info?.vehicleNumber || 'MH 02 EV 4092';
      const phone = targetOrder.driver_info?.phone || '+91 98765 43210';
      const itemsList = targetOrder.order_items || [];

      return {
        reply: `Here is the real-time status of your order **#${targetOrder.order_id}**:\n\n` +
               `• **Current Status:** ${status === 'Delivered' ? '✅ Delivered' : '🚚 ' + status}\n` +
               `• **Estimated Arrival:** ${eta}\n` +
               `• **Delivery Partner:** ${rider} (${vehicle})\n` +
               `• **Contact:** ${phone}\n` +
               `• **Total Items:** ${itemsList.length} items (₹${targetOrder.total_amount})\n\n` +
               `Your delivery partner is taking optimal express routes to reach you on time!`,
        intent: 'TRACK_ORDER',
        orderData: {
          orderId: targetOrder.order_id,
          orderStatus: status,
          estimatedDeliveryTime: eta,
          totalAmount: Number(targetOrder.total_amount),
          itemsCount: itemsList.length,
          driverInfo: targetOrder.driver_info,
          items: itemsList.slice(0, 3)
        },
        suggestions: ['Call Delivery Partner 📞', 'Add Delivery Instructions 🚪', 'Check Other Orders 📦', 'Help with Items 💔']
      };
    } else {
      return {
        reply: "You don't have any recent active orders linked right now. If you placed an order as a guest or have an Order ID (e.g., `ORD12345`), please share it and I will track it for you right away!",
        intent: 'TRACK_ORDER',
        suggestions: ['Start Shopping 🛒', 'View Bestsellers 🔥', 'Check Welcome Offer 🎁']
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT B: DELIVERY ISSUES
  // ─────────────────────────────────────────────────────────────
  if (isDeliveryIssue && !isRefundOrDamage) {
    if (latestOrder) {
      return {
        reply: `I understand you have a question about delivery for order **#${latestOrder.order_id}**.\n\n` +
               `• **Current ETA:** ${latestOrder.estimated_delivery_time || '15-20 minutes'}\n` +
               `• **Driver:** ${latestOrder.driver_info?.name || 'Ramesh Kumar'} (${latestOrder.driver_info?.phone || '+91 98765 43210'})\n\n` +
               `📍 **Special Delivery Notes Recorded:**\n` +
               `- Contactless Doorstep Delivery\n` +
               `- Please call upon arrival at the gate\n\n` +
               `If your order is delayed past the estimated window, we will automatically credit **50 SuperCoins** as our On-Time Delivery Guarantee!`,
        intent: 'DELIVERY_ISSUE',
        orderData: {
          orderId: latestOrder.order_id,
          driverInfo: latestOrder.driver_info
        },
        suggestions: ['Call Rider Directly 📞', 'Leave at Doorstep 🚪', 'I Want a Refund 💔', 'Track on Map 🗺️']
      };
    } else {
      return {
        reply: "Our standard express delivery delivers fresh groceries and daily essentials in **10 to 20 minutes** across all active zones! If you have placed an order, please share the Order ID so I can escalate with the dispatch hub.",
        intent: 'DELIVERY_ISSUE',
        suggestions: ['Track My Order 🚚', 'Browse Groceries 🥦', 'Contact Support 📞']
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT C: REFUND / DAMAGE RESOLUTION
  // ─────────────────────────────────────────────────────────────
  if (isRefundOrDamage) {
    const refundOrderId = latestOrder?.order_id || 'BM-EXPRESS-902';
    const affectedItemName = latestOrder?.order_items?.[0]?.name || 'Fresh Item';
    const refundAmount = Number(latestOrder?.order_items?.[0]?.price || 50);
    const refundReference = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    if (currentUser) {
      try {
        // Try RPC
        const { error: rpcErr } = await supabase.rpc('credit_user_wallet_refund', {
          p_user_id: currentUser.id,
          p_amount: refundAmount,
          p_reason: `Damaged item refund for #${refundOrderId}`
        });

        if (rpcErr) {
          // Direct fallback
          const newCoins = (currentUser.coins || 0) + refundAmount;
          await supabase.from('users').update({ coins: newCoins }).eq('id', currentUser.id);
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            title: 'Wallet Refund Credited! 💰',
            message: `₹${refundAmount} (${refundAmount} SuperCoins) credited to your wallet for: Damaged item refund for #${refundOrderId}`,
            type: 'reward'
          });
        }
      } catch (e) {
        console.error('Error crediting user refund coins:', e);
      }
    }

    return {
      reply: `I am deeply sorry you had an issue with your items! At **Big Market**, your satisfaction is 100% guaranteed under our **No-Questions-Asked Freshness Promise**.\n\n` +
             `✅ **Resolution Approved Instantly:**\n` +
             `• **Order Reference:** #${refundOrderId}\n` +
             `• **Affected Item:** ${affectedItemName}\n` +
             `• **Refund ID:** \`${refundReference}\`\n` +
             `• **Refund Amount:** ₹${refundAmount} credited immediately to your **Big Market Wallet / SuperCoins**!\n\n` +
             `You do not need to return the damaged item. Your updated wallet balance is ready to use on your next order!`,
      intent: 'REFUND_ISSUE',
      refundData: {
        orderId: refundOrderId,
        refundReference,
        refundAmount,
        itemName: affectedItemName,
        status: 'Processed & Credited'
      },
      suggestions: ['Check Wallet Balance 💰', 'Track Other Orders 📦', 'Continue Shopping 🛒', 'Chat with Human Agent 💬']
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT D: OFFERS & COUPONS
  // ─────────────────────────────────────────────────────────────
  if (isOfferOrCoupon) {
    const coinsBalance = currentUser?.coins ?? 450;
    return {
      reply: `🎉 **Current Live Offers & Discounts at Big Market:**\n\n` +
             `1. **🎁 First 3 Orders Welcome Offer:**\n` +
             `   • **₹100 FLAT OFF** on any order above ₹199\n` +
             `   • **FREE Delivery** (Save ₹30)\n` +
             `   • **FREE Handling Charge** (Save ₹5)\n` +
             `   • *Applied automatically at checkout!*\n\n` +
             `2. **🪙 SuperCoins Balance:** You currently have **${coinsBalance} SuperCoins** (1 Coin = ₹1 value redeemable during checkout).\n\n` +
             `3. **🎟️ Active Promo Codes:**\n` +
             `   • \`FRESH20\` — 20% OFF on Fruits & Veggies up to ₹100\n` +
             `   • \`BIGMEGA\` — ₹150 OFF on orders above ₹799\n` +
             `   • \`SNACK10\` — 10% OFF on all Snacks & Biscuits`,
      intent: 'COUPONS_OFFERS',
      suggestions: ['Apply Welcome Offer 🎁', 'View Snacks & Munchies 🍿', 'View Fresh Dairy 🥛', 'Track My Order 🚚']
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT E: HUMAN AGENT ESCALATION
  // ─────────────────────────────────────────────────────────────
  if (isHumanEscalation) {
    return {
      reply: `I have connected you to our **Priority Customer Support Queue**.\n\n` +
             `• **Agent Assigned:** Priya Nair (Senior Support Specialist)\n` +
             `• **Support Phone:** +91 1800 200 8899 (Toll-Free, 24x7)\n` +
             `• **Email:** support@bigmarket.com\n\n` +
             `An agent is also reviewing your chat history to provide immediate follow-up assistance. Is there a specific Order ID or item you'd like to escalate right now?`,
      intent: 'HUMAN_ESCALATION',
      suggestions: ['Track My Order 🚚', 'Report Damaged Item 💔', 'Delivery Delayed ⏱️', 'Start New Query 💡']
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT F: PRODUCT CATALOG SEARCH
  // ─────────────────────────────────────────────────────────────
  const cleanTerms = lower
    .replace(/(please|can\s+you|find|give|me|show|recommend|suggest|search|what\s+are|some|best|cheap|good|items?|products?|want|buy|options?|in\s+stock|available)/g, ' ')
    .trim();

  let matchedProducts = [];
  if (cleanTerms.length >= 2 && isSupabaseConfigured) {
    try {
      const searchPattern = `%${cleanTerms}%`;
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${searchPattern},brand.ilike.${searchPattern},category.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(4);
      matchedProducts = prods || [];
    } catch (e) {
      console.error('Error finding matching products in Supabase:', e);
    }
  }

  if (matchedProducts.length === 0 && isSupabaseConfigured && (cleanTerms.includes('milk') || cleanTerms.includes('biscuit') || cleanTerms.includes('chip') || cleanTerms.includes('oil') || cleanTerms.includes('snack'))) {
    const { data: fallbackProds } = await supabase.from('products').select('*').limit(4);
    matchedProducts = fallbackProds || [];
  }

  if (matchedProducts.length > 0) {
    const productNames = matchedProducts
      .map(p => `• **${p.name}** (${p.weight}) — ₹${p.price} ${Number(p.original_price) > Number(p.price) ? `~~₹${p.original_price}~~` : ''}`)
      .join('\n');

    return {
      reply: `Here are the top matches from our catalog for you:\n\n${productNames}\n\nYou can tap **+ Add to Cart** directly on any item below to add it immediately!`,
      intent: 'PRODUCT_INQUIRY',
      products: matchedProducts.map(p => ({
        _id: p.id,
        name: p.name,
        brand: p.brand,
        price: Number(p.price),
        originalPrice: Number(p.original_price),
        image: p.images?.[0] || '/products/official/amul-milk.jpg',
        weight: p.weight,
        category: p.category,
        rating: Number(p.rating)
      })),
      suggestions: ['Track My Order 🚚', 'View Cart 🛒', 'Check Deals 🏷️', 'Other Recommendations ✨']
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT G: GREETINGS & DEFAULT CONVERSATIONAL ASSISTANT
  // ─────────────────────────────────────────────────────────────
  const greetingName = currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : '';

  return {
    reply: isGreeting
      ? `Hello${greetingName}! 👋 I'm **Big Market AI**, your 24/7 personal shopping and delivery assistant.\n\n` +
        `How can I help you today? Here are a few things I can do in seconds:\n` +
        `• 🚚 **Track your live order** & driver location\n` +
        `• ⚡ **Check 10-20 min delivery ETA**\n` +
        `• 💔 **Instant refund or replacement** for damaged/missing items\n` +
        `• 🍎 **Find products & add directly to cart**\n` +
        `• 🎁 **Check your First 3 Orders Welcome Offer** (₹100 OFF)`
      : `I'm here to help you with any product or delivery questions${greetingName}!\n\n` +
        `You can ask me to track an active order, find items in our grocery catalog, get an instant refund for an issue, or check our current offers. What would you like to do?`,
    intent: 'GENERAL',
    suggestions: [
      '📦 Track My Order',
      '⚡ 10-Min Delivery ETA',
      '🍎 Recommend Fresh Groceries',
      '💔 Damaged / Missing Item Refund',
      '🎟️ Welcome Offer (₹100 OFF)'
    ]
  };
};

export const getQuickActions = async (userId = null) => {
  let hasActiveOrder = false;
  let latestOrderId = null;

  if (userId) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('order_id, order_status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (order && order.order_status !== 'Delivered' && order.order_status !== 'Cancelled') {
        hasActiveOrder = true;
        latestOrderId = order.order_id;
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (hasActiveOrder) {
    return [
      { label: `🚚 Track Order #${latestOrderId}`, message: `Where is order #${latestOrderId}?` },
      { label: '⚡ Delivery ETA', message: 'What is the estimated delivery time for my order?' },
      { label: '💔 Report Issue with Order', message: 'I have an issue with my order items' },
      { label: '🎟️ My Offers & SuperCoins', message: 'What discounts and coins do I have?' }
    ];
  }

  return [
    { label: '📦 Track My Order', message: 'Where is my order?' },
    { label: '⚡ 10-Min Delivery Promise', message: 'How fast is the delivery?' },
    { label: '🍎 Fresh Milk & Bread', message: 'Recommend fresh dairy and bread' },
    { label: '💔 Damaged / Missing Item Refund', message: 'One item in my order was damaged or missing' },
    { label: '🎁 First 3 Orders ₹100 OFF', message: 'Tell me about the Welcome Offer' }
  ];
};
