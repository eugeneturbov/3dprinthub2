import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Redirect to unauthorized page or show error
      console.error('Access forbidden');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/me', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (addressData) => api.post('/users/addresses', addressData),
  updateAddress: (addressId, addressData) => api.put(`/users/addresses/${addressId}`, addressData),
  deleteAddress: (addressId) => api.delete(`/users/addresses/${addressId}`),
  getWishlist: () => api.get('/users/wishlist'),
  addToWishlist: (productId) => api.post('/users/wishlist', { product_id: productId }),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: (params) => api.get('/products/featured', { params }),
  getRelatedProducts: (id, params) => api.get(`/products/${id}/related`, { params }),
  searchProducts: (params) => api.get('/products/search', { params }),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadProductImages: (productId, formData) => api.post(`/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProductImage: (imageId) => api.delete(`/products/images/${imageId}`),
  createVariant: (productId, variantData) => api.post(`/products/${productId}/variants`, variantData),
  updateVariant: (variantId, variantData) => api.put(`/products/variants/${variantId}`, variantData),
  deleteVariant: (variantId) => api.delete(`/products/variants/${variantId}`),
};

// Shops API
export const shopsAPI = {
  getShops: (params) => api.get('/shops', { params }),
  getShop: (id) => api.get(`/shops/${id}`),
  getShopBySlug: (slug) => api.get(`/shops/slug/${slug}`),
  getShopProducts: (shopId, params) => api.get(`/shops/${shopId}/products`, { params }),
  createShop: (shopData) => api.post('/shops', shopData),
  updateShop: (id, shopData) => api.put(`/shops/${id}`, shopData),
  updateShopStatus: (id, status) => api.put(`/shops/${id}/status`, { status }),
  getShopStats: (shopId) => api.get(`/shops/${shopId}/stats`),
  getShopSales: (shopId, params) => api.get(`/shops/${shopId}/sales`, { params }),
  getTopProducts: (shopId, params) => api.get(`/shops/${shopId}/top-products`, { params }),
};

// Categories API
export const categoriesAPI = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getCategoryProducts: (categoryId, params) => api.get(`/categories/${categoryId}/products`, { params }),
};

// Orders API
export const ordersAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  getSellerOrders: (params) => api.get('/orders/seller', { params }),
  updateSellerOrderStatus: (id, status) => api.put(`/orders/${id}/seller-status`, { status }),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (itemData) => api.post('/cart', itemData),
  updateCartItem: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart'),
  mergeCart: (sessionId) => api.post('/cart/merge', { session_id: sessionId }),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  getShopReviews: (shopId, params) => api.get(`/reviews/shop/${shopId}`, { params }),
  createProductReview: (productId, reviewData) => api.post(`/reviews/product/${productId}`, reviewData),
  createShopReview: (shopId, reviewData) => api.post(`/reviews/shop/${shopId}`, reviewData),
  updateReview: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// Upload API
export const uploadAPI = {
  uploadFile: (formData, onUploadProgress) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  uploadProductFile: (productId, formData, onUploadProgress) => api.post(`/upload/product/${productId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  uploadShopLogo: (shopId, formData, onUploadProgress) => api.post(`/upload/shop/${shopId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  uploadUserAvatar: (formData, onUploadProgress) => api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
};

// Payments API
export const paymentsAPI = {
  createPayment: (orderData) => api.post('/payments/create', orderData),
  confirmPayment: (paymentId, paymentData) => api.post(`/payments/confirm/${paymentId}`, paymentData),
  getPaymentStatus: (paymentId) => api.get(`/payments/status/${paymentId}`),
  refundPayment: (paymentId, refundData) => api.post(`/payments/refund/${paymentId}`, refundData),
  requestWithdrawal: (withdrawalData) => api.post('/payments/withdrawal', withdrawalData),
  getWithdrawalHistory: (params) => api.get('/payments/withdrawals', { params }),
};

// Search API
export const searchAPI = {
  search: (query, params) => api.get('/search', { params: { q: query, ...params } }),
  getSuggestions: (query) => api.get('/search/suggestions', { params: { q: query } }),
  getPopularSearches: () => api.get('/search/popular'),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getShops: (params) => api.get('/admin/shops', { params }),
  updateShopStatus: (shopId, status) => api.put(`/admin/shops/${shopId}/status`, { status }),
  getProducts: (params) => api.get('/admin/products', { params }),
  updateProductStatus: (productId, status) => api.put(`/admin/products/${productId}/status`, { status }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
  getStats: () => api.get('/admin/stats'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settingsData) => api.put('/admin/settings', settingsData),
};

export default api;
