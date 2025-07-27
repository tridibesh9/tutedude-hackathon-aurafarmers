import axios from "axios";

// Base API configuration
const API_BASE_URL = "http://localhost:8000/api/v1";
// const API_BASE_URL = "http://10.145.113.104:8000/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // User Login
  async login(email, password) {
    const response = await api.post("/login", { email, password });
    return response.data;
  },

  // User Registration
  async register(email, password, mobile_number, user_type) {
    const response = await api.post("/register", {
      email,
      password,
      mobile_number,
      user_type,
    });
    return response.data;
  },

  // Verify Token
  async verifyToken() {
    const response = await api.get("/verify-token");
    return response.data;
  },
};

// User API functions
export const userAPI = {
  // Get User Profile
  async getProfile() {
    const response = await api.get("/user/profile");
    return response.data;
  },

  // Get User Type
  async getUserType() {
    const response = await api.get("/user/type");
    return response.data;
  },

  // Get Buyer Profile
  async getBuyerProfile() {
    const response = await api.get("/buyer/profile");
    return response.data;
  },

  // Get Seller Profile
  async getSellerProfile() {
    const response = await api.get("/seller/profile");
    return response.data;
  },
};

// Product API functions
export const productAPI = {
  // Create Product (Seller Only)
  async createProduct(name, category, price) {
    const response = await api.post("/product/create", {
      name,
      category,
      price,
    });
    return response.data;
  },

  // Update Product (Seller Only)
  async updateProduct(productId, name, category, price) {
    const response = await api.put(`/product/update/${productId}`, {
      name,
      category,
      price,
    });
    return response.data;
  },

  // Get Product Details
  async getProduct(productId) {
    const response = await api.get(`/product/${productId}`);
    return response.data;
  },

  // Get All Products
  async getAllProducts(params = {}) {
    const {
      skip = 0,
      limit = 10,
      category,
      min_price,
      max_price,
      seller_only = false,
    } = params;

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      seller_only: seller_only.toString(),
    });

    if (category) queryParams.append("category", category);
    if (min_price !== undefined)
      queryParams.append("min_price", min_price.toString());
    if (max_price !== undefined)
      queryParams.append("max_price", max_price.toString());

    const response = await api.get(`/product/?${queryParams}`);
    return response.data;
  },

  // Delete Product (Seller Only)
  async deleteProduct(productId) {
    await api.delete(`/product/delete/${productId}`);
  },

  // Get Products by Category
  async getProductsByCategory(category, skip = 0, limit = 10) {
    const response = await api.get(
      `/product/category/${category}?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  // Get Products by Seller
  async getProductsBySeller(sellerId, skip = 0, limit = 10) {
    const response = await api.get(
      `/product/seller/${sellerId}?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },
};

// Inventory API functions
export const inventoryAPI = {
  // Add Inventory Batch (Seller Only)
  async addInventory(product_id, quantity, discount, expiry_date) {
    const response = await api.post("/inventory/add", {
      product_id,
      quantity,
      discount,
      expiry_date,
    });
    return response.data;
  },

  // Update Inventory Batch (Seller Only)
  async updateInventory(inventoryId, quantity, discount, expiry_date) {
    const response = await api.put(`/inventory/update/${inventoryId}`, {
      quantity,
      discount,
      expiry_date,
    });
    return response.data;
  },

  // Get Product Inventory
  async getProductInventory(productId, show_expired = false) {
    const response = await api.get(
      `/inventory/product/${productId}?show_expired=${show_expired}`
    );
    return response.data;
  },

  // Get My Inventory (Seller Only)
  async getMyInventory(params = {}) {
    const {
      product_name,
      show_expired = false,
      skip = 0,
      limit = 100,
    } = params;

    const queryParams = new URLSearchParams({
      show_expired: show_expired.toString(),
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (product_name) queryParams.append("product_name", product_name);

    const response = await api.get(`/inventory/my-inventory?${queryParams}`);
    return response.data;
  },

  // Delete Inventory Batch (Seller Only)
  async deleteInventory(inventoryId) {
    await api.delete(`/inventory/delete/${inventoryId}`);
  },

  // Get Available Quantity
  async getAvailableQuantity(productId) {
    const response = await api.get(`/inventory/available/${productId}`);
    return response.data;
  },
};

// Order API functions
export const orderAPI = {
  // Create Order (Buyer Only)
  async createOrder(seller_id, estimated_delivery_date, order_items) {
    const response = await api.post("/order/create", {
      seller_id,
      estimated_delivery_date,
      order_items,
    });
    return response.data;
  },

  // Update Order Status
  async updateOrder(orderId, order_status, estimated_delivery_date) {
    const response = await api.put(`/order/update/${orderId}`, {
      order_status,
      estimated_delivery_date,
    });
    return response.data;
  },

  // Get Order Details
  async getOrder(orderId) {
    const response = await api.get(`/order/${orderId}`);
    return response.data;
  },

  // Get All Orders
  async getAllOrders(params = {}) {
    const { skip = 0, limit = 10, order_status } = params;

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (order_status) queryParams.append("order_status", order_status);

    const response = await api.get(`/order/?${queryParams}`);
    return response.data;
  },
};

// Bargain API functions
export const bargainAPI = {
  // Create Public Bargain (Buyer Only)
  async createPublicBargain(
    product_id,
    quantity,
    initial_bid_price,
    location_pincode,
    expires_in_hours
  ) {
    const response = await api.post("/bargain/public/create", {
      product_id,
      quantity,
      initial_bid_price,
      location_pincode,
      expires_in_hours,
    });
    return response.data;
  },

  // Get Available Public Bargains (Seller Only)
  async getAvailablePublicBargains(params = {}) {
    const { location_pincode, category, skip = 0, limit = 20 } = params;

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (location_pincode)
      queryParams.append("location_pincode", location_pincode);
    if (category) queryParams.append("category", category);

    const response = await api.get(`/bargain/public/available?${queryParams}`);
    return response.data;
  },

  // Respond to Public Bargain (Seller Only)
  async respondToPublicBargain(roomId, bid_price, quantity, message) {
    const response = await api.post(`/bargain/public/${roomId}/respond`, {
      bid_price,
      quantity,
      message,
    });
    return response.data;
  },

  // Create Private Bargain (Buyer Only)
  async createPrivateBargain(
    product_id,
    seller_id,
    quantity,
    initial_bid_price,
    location_pincode
  ) {
    const response = await api.post("/bargain/private/create", {
      product_id,
      seller_id,
      quantity,
      initial_bid_price,
      location_pincode,
    });
    return response.data;
  },

  // Place Bid in Room
  async placeBid(
    roomId,
    bid_price,
    quantity,
    message,
    is_counter_offer = true
  ) {
    const response = await api.post(`/bargain/${roomId}/bid`, {
      bid_price,
      quantity,
      message,
      is_counter_offer,
    });
    return response.data;
  },

  // Accept Bargain
  async acceptBargain(roomId, bid_id) {
    const response = await api.post(`/bargain/${roomId}/accept`, {
      bid_id,
    });
    return response.data;
  },

  // Get Bargain Room Details
  async getBargainRoom(roomId) {
    const response = await api.get(`/bargain/${roomId}`);
    return response.data;
  },

  // Get My Bargains
  async getMyBargains(params = {}) {
    const { room_type, status, skip = 0, limit = 20 } = params;

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (room_type) queryParams.append("room_type", room_type);
    if (status) queryParams.append("status", status);

    const response = await api.get(`/bargain/my-bargains?${queryParams}`);
    return response.data;
  },
};

// Helper functions
export const apiHelpers = {
  // Handle API errors
  handleError(error) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    return error.message || "An unexpected error occurred";
  },

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  },

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN");
  },

  // Format datetime
  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString("en-IN");
  },
};

export default api;
