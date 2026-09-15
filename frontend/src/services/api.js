import axios from 'axios';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_USER,
  MOCK_COUPONS,
  MOCK_ORDERS,
  MOCK_TRAFFIC_STATS
} from './mockData';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Attach JWT Auth token to requests automatically
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('freshkart_user');
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Fallback Mock Engine for Vercel / Offline Preview
const getMockResponse = (config) => {
  const rawUrl = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const params = config.params || {};
  let body = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch (e) {
      body = {};
    }
  }

  // Sanitize path (strip base URL if included)
  const path = rawUrl.replace(/^https?:\/\/[^\/]+\/api/, '').replace(/^\/api/, '');

  console.warn(`[Vercel Fallback Mock Mode] Serving static mock data for ${method.toUpperCase()} ${path}`);

  // 1. Categories
  if (path === '/categories' && method === 'get') {
    return MOCK_CATEGORIES;
  }

  // 2. Search Suggestions
  if (path === '/products/search-suggestions' && method === 'get') {
    const query = (params.q || '').toLowerCase();
    const suggestions = MOCK_PRODUCTS
      .filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
      .map(p => p.name)
      .slice(0, 5);
    return { suggestions };
  }

  // 3. Products Single ID
  if (path.startsWith('/products/') && method === 'get' && !path.includes('search-suggestions')) {
    const prodId = path.split('/products/')[1];
    const product = MOCK_PRODUCTS.find(p => p._id === prodId || p.id === prodId) || MOCK_PRODUCTS[0];
    return product;
  }

  // 4. Products List
  if ((path === '/products' || path === '/products/') && method === 'get') {
    let list = [...MOCK_PRODUCTS];

    if (params.category) {
      const cat = decodeURIComponent(params.category).toLowerCase();
      list = list.filter(p => p.category.toLowerCase() === cat);
    }
    if (params.brand) {
      const b = decodeURIComponent(params.brand).toLowerCase();
      list = list.filter(p => p.brand.toLowerCase() === b);
    }
    if (params.isTrending === 'true' || params.isTrending === true) {
      list = list.filter(p => p.isTrending);
    }
    if (params.isBestSeller === 'true' || params.isBestSeller === true) {
      list = list.filter(p => p.isBestSeller);
    }
    if (params.isDeal === 'true' || params.isDeal === true) {
      list = list.filter(p => p.isDeal);
    }
    if (params.search || params.q) {
      const q = (params.search || params.q).toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (params.limit) {
      const lim = parseInt(params.limit, 10);
      if (!isNaN(lim)) list = list.slice(0, lim);
    }

    return {
      products: list,
      total: list.length,
      pages: 1,
      page: 1
    };
  }

  // 5. Product Reviews
  if (path.includes('/reviews') && method === 'post') {
    return { message: 'Review added successfully!', rating: 5 };
  }

  // 6. Recommendations
  if (path === '/recommendations' && method === 'get') {
    return { recommendedForYou: MOCK_PRODUCTS.slice(0, 6) };
  }

  // 7. Auth Login / Register / Profile
  if (path === '/auth/login' && method === 'post') {
    return { ...MOCK_USER, email: body.email || MOCK_USER.email };
  }
  if (path === '/auth/register' && method === 'post') {
    return { ...MOCK_USER, name: body.name || MOCK_USER.name, email: body.email || MOCK_USER.email };
  }
  if (path === '/auth/me' && method === 'get') {
    return MOCK_USER;
  }
  if (path === '/auth/toggle-shopkeeper') {
    return { user: { ...MOCK_USER, role: 'shopkeeper' } };
  }

  // 8. Orders
  if (path === '/orders' && method === 'post') {
    const newOrder = {
      _id: `BM-${Math.floor(100000 + Math.random() * 900000)}`,
      orderNumber: `BM-${Math.floor(100000 + Math.random() * 900000)}`,
      items: body.items || [],
      shippingAddress: body.shippingAddress || MOCK_USER.addresses[0],
      totalAmount: body.totalAmount || 150,
      paymentMethod: body.paymentMethod || 'Cash on Delivery',
      orderStatus: 'Processing',
      createdAt: new Date().toISOString()
    };
    MOCK_ORDERS.unshift(newOrder);
    return newOrder;
  }
  if (path === '/orders/my-orders' && method === 'get') {
    return MOCK_ORDERS;
  }
  if (path === '/orders/welcome-offer-status' && method === 'get') {
    return { isEligible: true, remainingOrders: 3, discountPercent: 50, maxDiscount: 100 };
  }
  if (path.startsWith('/orders/') && method === 'get') {
    const orderId = path.split('/orders/')[1];
    const found = MOCK_ORDERS.find(o => o._id === orderId || o.orderNumber === orderId);
    return found || MOCK_ORDERS[0];
  }

  // 9. Coupons
  if (path === '/coupons' && method === 'get') {
    return MOCK_COUPONS;
  }
  if (path === '/coupons/validate' && method === 'post') {
    const code = (body.code || '').toUpperCase();
    const subtotal = body.subtotal || 200;
    const found = MOCK_COUPONS.find(c => c.code === code);
    if (found) {
      const discount = Math.min((subtotal * found.discountPercent) / 100, found.maxDiscount);
      return { valid: true, discountAmount: discount, finalTotal: subtotal - discount, coupon: found };
    }
    return { valid: true, discountAmount: 50, finalTotal: Math.max(0, subtotal - 50), coupon: MOCK_COUPONS[0] };
  }

  // 10. User profile, wishlist, coins
  if (path === '/users/profile') return MOCK_USER;
  if (path === '/users/daily-claim') return { message: '50 SuperCoins claimed!', coins: MOCK_USER.coins + 50 };
  if (path === '/users/wishlist') return [];
  if (path.includes('/users/wishlist/')) return { message: 'Wishlist updated' };
  if (path === '/users/notifications') return [{ _id: 'n-1', title: 'Welcome to Big Market! 👌', message: 'Explore farm fresh groceries & 15-min delivery.' }];
  if (path.includes('/users/addresses')) return { addresses: MOCK_USER.addresses };

  // 11. Admin & Traffic
  if (path === '/admin/dashboard') {
    return {
      totalRevenue: 184500,
      totalOrders: 1420,
      totalUsers: 395,
      totalProducts: MOCK_PRODUCTS.length
    };
  }
  if (path === '/admin/orders') return MOCK_ORDERS;
  if (path === '/admin/users') return [MOCK_USER];
  if (path === '/admin/traffic' || path === '/traffic/status') return MOCK_TRAFFIC_STATS;

  // 12. AI Chat
  if (path === '/ai-chat/message' && method === 'post') {
    const msg = (body.message || '').toLowerCase();
    let reply = "I'm your Big Market instant assistant! How can I help you with your groceries, orders, or savings today?";
    if (msg.includes('order') || msg.includes('track') || msg.includes('where')) {
      reply = "Your active order BM-89241 is packed and out for delivery! 🛵 Expected arrival in 8 minutes.";
    } else if (msg.includes('deal') || msg.includes('offer') || msg.includes('coupon')) {
      reply = "Use coupon code WELCOME50 at checkout to get 50% OFF (up to ₹100) on your order! 🎉";
    } else if (msg.includes('coin') || msg.includes('supercoin')) {
      reply = `You currently have ${MOCK_USER.coins} SuperCoins! You can redeem them at checkout for extra instant discounts.`;
    }
    return { reply };
  }
  if (path === '/ai-chat/quick-actions') {
    return { actions: ['Where is my order? 🚚', 'Active coupons & deals 🏷️', 'Claim daily SuperCoins 🪙'] };
  }

  // Default fallback object
  return { status: 'OK', data: [] };
};

// Response interceptor with Traffic Surge Retry & Vercel Fallback
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Traffic Surge Retry (HTTP 429 / 503)
    if (error.response && (error.response.status === 429 || error.response.status === 503)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:traffic-surge', {
          detail: { message: error.response.data?.message || 'High server traffic detected. Retrying automatically...' }
        }));
      }

      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2) {
        config._retryCount += 1;
        const retryAfterHeader = error.response.headers['retry-after'];
        const delayMs = retryAfterHeader ? Math.min(Number(retryAfterHeader) * 1000, 3000) : config._retryCount * 1200;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return API(config);
      }
    }

    // Vercel / Offline Fallback Mode: Catch 404, 500, Network Errors, or unreachable server
    if (
      !error.response ||
      error.response.status === 404 ||
      error.response.status === 500 ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error'
    ) {
      const mockData = getMockResponse(config || {});
      return Promise.resolve({
        data: mockData,
        status: 200,
        statusText: 'OK (Mock Fallback)',
        headers: {},
        config
      });
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getProfile: () => API.get('/auth/me'),
  toggleShopkeeper: (data) => API.post('/auth/toggle-shopkeeper', data || {})
};

export const productService = {
  getProducts: (params) => API.get('/products', { params }),
  getProductById: (id) => API.get(`/products/${id}`),
  getSearchSuggestions: (q) => API.get('/products/search-suggestions', { params: { q } }),
  addReview: (id, reviewData) => API.post(`/products/${id}/reviews`, reviewData)
};

export const categoryService = {
  getCategories: () => API.get('/categories')
};

export const orderService = {
  createOrder: (orderData) => API.post('/orders', orderData),
  getMyOrders: () => API.get('/orders/my-orders'),
  getOrderById: (id) => API.get(`/orders/${id}`),
  getWelcomeOfferStatus: () => API.get('/orders/welcome-offer-status')
};

export const userService = {
  updateProfile: (data) => API.put('/users/profile', data),
  addAddress: (addressData) => API.post('/users/addresses', addressData),
  deleteAddress: (id) => API.delete(`/users/addresses/${id}`),
  claimDailyCoins: () => API.post('/users/daily-claim'),
  getWishlist: () => API.get('/users/wishlist'),
  toggleWishlist: (productId) => API.post(`/users/wishlist/${productId}`),
  getNotifications: () => API.get('/users/notifications')
};

export const couponService = {
  getCoupons: () => API.get('/coupons'),
  validateCoupon: (code, subtotal) => API.post('/coupons/validate', { code, subtotal })
};

export const recommendationService = {
  getRecommendations: (params) => API.get('/recommendations', { params })
};

export const adminService = {
  getDashboard: () => API.get('/admin/dashboard'),
  createProduct: (data) => API.post('/admin/products', data),
  updateProduct: (id, data) => API.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/admin/products/${id}`),
  createCategory: (data) => API.post('/admin/categories', data),
  deleteCategory: (id) => API.delete(`/admin/categories/${id}`),
  getOrders: (params) => API.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => API.put(`/admin/orders/${id}/status`, data),
  getUsers: (params) => API.get('/admin/users', { params }),
  updateUserStatus: (id, data) => API.put(`/admin/users/${id}/status`, data),
  getTrafficMetrics: () => API.get('/admin/traffic')
};

export const trafficService = {
  getTrafficStatus: () => API.get('/traffic/status')
};

export const aiChatService = {
  sendMessage: (payload) => API.post('/ai-chat/message', payload),
  getQuickActions: () => API.get('/ai-chat/quick-actions')
};

export default API;
