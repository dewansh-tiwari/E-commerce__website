import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Attach JWT Auth token to requests automatically
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('freshkart_user');
  if (userInfo) {
    const parsed = JSON.parse(userInfo);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to detect connection cut / network errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      !error.response || 
      error.code === 'ERR_NETWORK' || 
      error.message === 'Network Error' ||
      (typeof navigator !== 'undefined' && !navigator.onLine)
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:network-error'));
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getProfile: () => API.get('/auth/me')
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
  getUsers: () => API.get('/admin/users'),
  updateUserStatus: (id, data) => API.put(`/admin/users/${id}/status`, data)
};

export const aiChatService = {
  sendMessage: (payload) => API.post('/ai-chat/message', payload),
  getQuickActions: () => API.get('/ai-chat/quick-actions')
};

export default API;
