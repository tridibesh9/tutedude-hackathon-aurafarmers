# Saathi E-commerce API Documentation

## 📌 Overview
Complete API documentation for the Saathi E-commerce platform backend. This API provides endpoints for user authentication, product management, inventory control, order processing, and real-time bargaining features.

## 🌐 Base Configuration
- **Base URL**: `http://localhost:8000/api/v1`
- **Authentication**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **Authorization Header**: `Authorization: Bearer <your_jwt_token>`

---

## 🔐 Authentication & Registration

### 1. User Login
```http
POST /login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_type": "buyer|seller|both"
}
```

### 2. Verify Token
```http
GET /verify-token
Authorization: Bearer <token>
```
**Response:**
```json
{
  "valid": true,
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "mobile_number": "+1234567890"
}
```

### 3. User Registration
```http
POST /register
```
**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "mobile_number": "+1234567890",
  "user_type": "buyer|seller|both"
}
```
**Response:**
```json
{
  "message": "User registered successfully as buyer",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "newuser@example.com",
  "user_type": "buyer"
}
```

---

## 👥 User Profile Management

### 4. Get User Profile
```http
GET /user/profile
Authorization: Bearer <token>
```
**Response:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "mobile_number": "+1234567890",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 5. Get User Type
```http
GET /user/type
Authorization: Bearer <token>
```
**Response:**
```json
{
  "user_type": "buyer|seller|both|none"
}
```

### 6. Get Buyer Profile
```http
GET /buyer/profile
Authorization: Bearer <token>
```
**Response:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "buyer_specific_data": "..."
}
```

### 7. Get Seller Profile
```http
GET /seller/profile
Authorization: Bearer <token>
```
**Response:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "seller_specific_data": "..."
}
```

---

## 🛍️ Product Management

### 8. Create Product (Seller Only)
```http
POST /product/create
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "name": "Fresh Organic Tomatoes",
  "category": "Vegetables",
  "price": 25.50
}
```
**Response:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "seller_id": "456e7890-e12b-34d5-a678-901234567890",
  "name": "Fresh Organic Tomatoes",
  "category": "Vegetables",
  "price": 25.50,
  "rating": 0.0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 9. Update Product (Seller Only)
```http
PUT /product/update/{product_id}
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "name": "Premium Organic Tomatoes",
  "category": "Vegetables",
  "price": 30.00
}
```
**Response:** Updated product details

### 10. Get Product Details
```http
GET /product/{product_id}
Authorization: Bearer <token>
```
**Response:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "seller_id": "456e7890-e12b-34d5-a678-901234567890",
  "name": "Fresh Organic Tomatoes",
  "category": "Vegetables",
  "price": 25.50,
  "rating": 4.5,
  "created_at": "2024-01-15T10:30:00Z",
  "inventories": [
    {
      "inventory_id": "inv-123",
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "456e7890-e12b-34d5-a678-901234567890",
      "quantity": 100,
      "discount": 5.0,
      "expiry_date": "2024-02-15",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 11. Get All Products
```http
GET /product/?skip=0&limit=10&category=Vegetables&min_price=10&max_price=50&seller_only=false
Authorization: Bearer <token>
```
**Query Parameters:**
- `skip`: int (default: 0) - Number of products to skip for pagination
- `limit`: int (default: 10, max: 100) - Number of products to return
- `category`: string (optional) - Filter by category
- `min_price`: decimal (optional) - Minimum price filter
- `max_price`: decimal (optional) - Maximum price filter
- `seller_only`: boolean (default: false) - Get only current user's products (seller only)

**Response:** Array of `ProductWithInventoryResponse`

### 12. Delete Product (Seller Only)
```http
DELETE /product/delete/{product_id}
Authorization: Bearer <token>
```
**Response:** 204 No Content

### 13. Get Products by Category
```http
GET /product/category/{category}?skip=0&limit=10
Authorization: Bearer <token>
```
**Response:** Array of products in the specified category

### 14. Get Products by Seller
```http
GET /product/seller/{seller_id}?skip=0&limit=10
Authorization: Bearer <token>
```
**Response:** Array of products by specific seller

---

## 📦 Inventory Management

### 15. Add Inventory Batch (Seller Only)
```http
POST /inventory/add
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 100,
  "discount": 5.0,
  "expiry_date": "2024-02-15"
}
```
**Response:** Inventory batch details

### 16. Update Inventory Batch (Seller Only)
```http
PUT /inventory/update/{inventory_id}
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "quantity": 80,
  "discount": 10.0,
  "expiry_date": "2024-02-20"
}
```

### 17. Get Product Inventory
```http
GET /inventory/product/{product_id}?show_expired=false
Authorization: Bearer <token>
```
**Query Parameters:**
- `show_expired`: boolean (default: false) - Include expired batches

### 18. Get My Inventory (Seller Only)
```http
GET /inventory/my-inventory?product_name=tomato&show_expired=false&skip=0&limit=100
Authorization: Bearer <token>
```
**Query Parameters:**
- `product_name`: string (optional) - Filter by product name
- `show_expired`: boolean (default: false) - Include expired batches
- `skip`: int (default: 0) - Pagination offset
- `limit`: int (default: 100, max: 100) - Pagination limit

### 19. Delete Inventory Batch (Seller Only)
```http
DELETE /inventory/delete/{inventory_id}
Authorization: Bearer <token>
```
**Response:** 204 No Content

### 20. Get Available Quantity
```http
GET /inventory/available/{product_id}
Authorization: Bearer <token>
```
**Response:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "total_available_quantity": 250,
  "active_batches": 3,
  "batches": [
    {
      "inventory_id": "inv-123",
      "quantity": 100,
      "discount": 5.0,
      "expiry_date": "2024-02-15"
    }
  ]
}
```

### 21. Get Product Pricing
```http
GET /inventory/pricing/{product_id}?quantity=50&purchase_type=solo_singletime
Authorization: Bearer <token>
```
**Query Parameters:**
- `quantity`: int (required) - Quantity to purchase
- `purchase_type`: string (default: "solo_singletime") - Type of purchase: "solo_singletime", "subscription", or "group"

**Response:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_name": "Organic Rice",
  "quantity_requested": 50,
  "purchase_type": "solo_singletime",
  "pricing": {
    "original_total": 1250.00,
    "discounted_total": 1125.00,
    "total_savings": 125.00,
    "savings_percentage": 10.0,
    "average_price_per_unit": 22.50
  },
  "batch_breakdown": [
    {
      "inventory_id": "inv-123",
      "quantity_from_batch": 50,
      "original_price_per_unit": 25.00,
      "discounted_price_per_unit": 22.50,
      "discount_applied": 10.0,
      "batch_total": 1125.00,
      "expiry_date": "2025-12-31"
    }
  ],
  "available_quantity": 200
}
```

---

## 🛒 Order Management

### 21. Create Order (Buyer Only)
```http
POST /order/create
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "order_data": {
    "seller_id": "456e7890-e12b-34d5-a678-901234567890",
    "estimated_delivery_date": "2024-01-20",
    "order_type": "individual"
  },
  "order_items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 5,
      "price_per_unit": 25.50
    },
    {
      "product_id": "789e0123-e45f-67g8-a901-234567890123",
      "quantity": 3,
      "price_per_unit": 15.00
    }
  ],
  "purchase_type": "solo_singletime"
}
```
**Response:**
```json
{
  "order_id": "ord-123456",
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "group_buyer_ids": null,
  "order_type": "individual",
  "total_price": 127.50,
  "order_status": "Pending",
  "estimated_delivery_date": "2024-01-20",
  "order_date": "2024-01-15T10:30:00Z"
}
```

### 22. Calculate Order Pricing (Buyer Only)
```http
POST /order/calculate-pricing
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "order_items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 50,
      "price_per_unit": 25.00
    }
  ],
  "seller_id": "456e7890-e12b-34d5-a678-901234567890",
  "purchase_type": "solo_singletime"
}
```
**Response:**
```json
{
  "seller_id": "456e7890-e12b-34d5-a678-901234567890",
  "purchase_type": "solo_singletime",
  "summary": {
    "total_original_price": 1250.00,
    "total_discounted_price": 1125.00,
    "total_savings": 125.00,
    "overall_savings_percentage": 10.0
  },
  "item_breakdowns": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_name": "Organic Rice",
      "quantity": 50,
      "original_total": 1250.00,
      "discounted_total": 1125.00,
      "savings": 125.00,
      "savings_percentage": 10.0,
      "batch_details": [
        {
          "inventory_id": "inv-123",
          "quantity_from_batch": 50,
          "original_price_per_unit": 25.00,
          "discounted_price_per_unit": 22.50,
          "discount_applied": 10.0,
          "batch_total": 1125.00,
          "expiry_date": "2025-12-31"
        }
      ]
    }
  ]
}
```

### 23. Create Group Order (Buyer Only)
```http
POST /order/create
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "order_data": {
    "seller_id": "456e7890-e12b-34d5-a678-901234567890",
    "estimated_delivery_date": "2024-01-20",
    "order_type": "group"
  },
  "order_items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 50,
      "price_per_unit": 25.00
    }
  ],
  "purchase_type": "solo_singletime"
}
```
**Response:**
```json
{
  "order_id": "ord-123456",
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "group_buyer_ids": ["buyer-uuid"],
  "order_type": "group",
  "total_price": 1125.00,
  "order_status": "Pending",
  "estimated_delivery_date": "2024-01-20",
  "order_date": "2024-01-15T10:30:00Z"
}
```

### 24. Join Group Order (Buyer Only)
```http
POST /order/group/join
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "order_id": "ord-123456",
  "quantity_requested": 20
}
```
**Response:**
```json
{
  "participant_id": "part-123456",
  "order_id": "ord-123456",
  "buyer_id": "buyer2-uuid",
  "quantity_share": 20,
  "price_share": 450.00,
  "status": "pending",
  "joined_at": "2024-01-15T11:00:00Z",
  "buyer_info": null
}
```

### 25. Get Available Group Orders (Buyer Only)
```http
GET /order/group/available?seller_id=456e7890-e12b-34d5-a678-901234567890&skip=0&limit=20
Authorization: Bearer <token>
```
**Query Parameters:**
- `seller_id`: UUID (optional) - Filter by specific seller
- `product_category`: string (optional) - Filter by product category
- `max_distance_km`: int (optional) - Filter by distance
- `skip`: int (default: 0) - Pagination offset
- `limit`: int (default: 20, max: 100) - Pagination limit

**Response:**
```json
[
  {
    "order_id": "ord-123456",
    "primary_buyer_id": "buyer-uuid",
    "seller_id": "seller-uuid",
    "total_participants": 2,
    "total_quantity": 70,
    "total_price": 1575.00,
    "order_status": "Pending",
    "order_type": "group",
    "participants": [],
    "estimated_delivery_date": "2024-01-20",
    "order_date": "2024-01-15T10:30:00Z"
  }
]
```

### 26. Get Group Order Details
```http
GET /order/group/{order_id}
Authorization: Bearer <token>
```
**Response:**
```json
{
  "order_id": "ord-123456",
  "primary_buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "total_participants": 2,
  "total_quantity": 70,
  "total_price": 1575.00,
  "order_status": "Pending",
  "order_type": "group",
  "participants": [
    {
      "participant_id": "part-123",
      "order_id": "ord-123456",
      "buyer_id": "buyer-uuid",
      "quantity_share": 50,
      "price_share": 1125.00,
      "status": "confirmed",
      "joined_at": "2024-01-15T10:30:00Z",
      "buyer_info": {
        "email": "buyer@example.com",
        "mobile_number": "+1234567890",
        "shipping_address": "123 Main St",
        "shipping_pincode": "12345"
      }
    }
  ],
  "estimated_delivery_date": "2024-01-20",
  "order_date": "2024-01-15T10:30:00Z"
}
```

### 27. Update Group Order Participant Status
```http
PUT /order/group/participant/{participant_id}/status?new_status=confirmed
Authorization: Bearer <token>
```
**Response:**
```json
{
  "message": "Participant status updated to confirmed"
}
```

### 28. Update Order Status
```http
PUT /order/update/{order_id}
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "order_status": "Confirmed|Shipped|Delivered|Cancelled",
  "estimated_delivery_date": "2024-01-22"
}
```

### 29. Get Order Details
```http
GET /order/{order_id}
Authorization: Bearer <token>
```
**Response:**
```json
{
  "order_id": "ord-123456",
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "group_buyer_ids": ["buyer-uuid", "buyer2-uuid"],
  "order_type": "individual",
  "total_price": 127.50,
  "order_status": "Pending",
  "estimated_delivery_date": "2024-01-20",
  "order_date": "2024-01-15T10:30:00Z",
  "order_items": [
    {
      "order_item_id": "item-123",
      "order_id": "ord-123456",
      "product_id": "product-uuid",
      "quantity": 5,
      "price_per_unit": 20.50
    }
  ],
  "group_buyers_info": null
}
```

### 30. Get All Orders
```http
GET /order/?skip=0&limit=10&order_status=Pending
Authorization: Bearer <token>
```
**Query Parameters:**
- `skip`: int (default: 0) - Pagination offset
- `limit`: int (default: 10) - Pagination limit
- `order_status`: string (optional) - Filter by order status

**Response:** Array of orders with items (buyer's orders or seller's orders based on user type)

---

## 💬 Live Bargaining System

### 31. Create Public Bargain (Buyer Only)
```http
POST /bargain/public/create
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 10,
  "initial_bid_price": 20.00,
  "location_pincode": "12345",
  "expires_in_hours": 24
}
```
**Response:**
```json
{
  "room_id": "room-123456",
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "buyer_id": "buyer-uuid",
  "seller_id": null,
  "room_type": "public",
  "status": "active",
  "initial_quantity": 10,
  "initial_bid_price": 20.00,
  "current_bid_price": 20.00,
  "location_pincode": "12345",
  "expires_at": "2024-01-16T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 32. Get Available Public Bargains (Seller Only)
```http
GET /bargain/public/available?location_pincode=12345&category=Vegetables&skip=0&limit=20
Authorization: Bearer <token>
```
**Query Parameters:**
- `location_pincode`: string (optional) - Filter by location
- `category`: string (optional) - Filter by product category
- `skip`: int (default: 0) - Pagination offset
- `limit`: int (default: 20, max: 100) - Pagination limit

**Response:**
```json
[
  {
    "room_id": "room-123456",
    "product_id": "product-uuid",
    "product_name": "Fresh Organic Tomatoes",
    "product_category": "Vegetables",
    "original_price": 25.50,
    "buyer_id": "buyer-uuid",
    "buyer_location": "12345",
    "quantity": 10,
    "current_bid_price": 20.00,
    "expires_at": "2024-01-16T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "total_seller_responses": 3
  }
]
```

### 33. Respond to Public Bargain (Seller Only)
```http
POST /bargain/public/{room_id}/respond
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "bid_price": 22.00,
  "quantity": 10,
  "message": "Fresh stock available with 5% discount!"
}
```

### 34. Create Private Bargain (Buyer Only)
```http
POST /bargain/private/create
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "seller_id": "456e7890-e12b-34d5-a678-901234567890",
  "quantity": 5,
  "initial_bid_price": 18.00,
  "location_pincode": "12345"
}
```

### 35. Place Bid in Room
```http
POST /bargain/{room_id}/bid
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "bid_price": 21.00,
  "quantity": 10,
  "message": "Can you do 21 per unit?",
  "is_counter_offer": true
}
```

### 36. Accept Bargain
```http
POST /bargain/{room_id}/accept
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "bid_id": "bid-123456"
}
```
**Response:**
```json
{
  "message": "Bargain accepted successfully",
  "room_id": "room-123456",
  "accepted_bid_id": "bid-123456",
  "final_price": 21.00,
  "quantity": 10
}
```

### 37. Get Bargain Room Details
```http
GET /bargain/{room_id}
Authorization: Bearer <token>
```
**Response:**
```json
{
  "room_id": "room-123456",
  "product_id": "product-uuid",
  "product_name": "Fresh Organic Tomatoes",
  "product_category": "Vegetables",
  "product_price": 25.50,
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "room_type": "private",
  "status": "active",
  "initial_quantity": 10,
  "initial_bid_price": 20.00,
  "current_bid_price": 21.00,
  "location_pincode": "12345",
  "expires_at": "2024-01-16T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "recent_bids": [
    {
      "bid_id": "bid-123",
      "user_type": "buyer",
      "bid_price": 21.00,
      "quantity": 10,
      "message": "Can you do 21 per unit?",
      "is_counter_offer": true,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "recent_messages": [
    {
      "message_id": "msg-123",
      "user_id": "user-uuid",
      "content": "Hi, I'm interested in bulk purchase",
      "created_at": "2024-01-15T10:45:00Z"
    }
  ]
}
```

### 38. Get My Bargains
```http
GET /bargain/my-bargains?room_type=public&status=active&skip=0&limit=20
Authorization: Bearer <token>
```
**Query Parameters:**
- `room_type`: string (optional) - "public" or "private"
- `status`: string (optional) - "active", "closed", "accepted", "rejected"
- `skip`: int (default: 0) - Pagination offset
- `limit`: int (default: 20, max: 100) - Pagination limit

---

## 🔄 Real-time WebSocket Connection

### 39. WebSocket Endpoint for Live Bargaining
```
WebSocket: /bargain/{room_id}/ws?token=<jwt_token>
```

#### Connection Methods:
1. **Via Query Parameter:**
   ```
   ws://localhost:8000/api/v1/bargain/room-123456/ws?token=your_jwt_token
   ```

2. **Via First Message:**
   ```
   ws://localhost:8000/api/v1/bargain/room-123456/ws
   ```
   Then send:
   ```json
   {"type": "auth", "token": "your_jwt_token"}
   ```

#### Messages You Can Send:
```json
// Authenticate (if not done via query param)
{"type": "auth", "token": "your_jwt_token"}

// Keep connection alive
{"type": "ping"}

// Show typing indicator
{"type": "typing", "is_typing": true}

// Send chat message
{"type": "chat_message", "content": "Hello, interested in bulk order"}

// Get recent activity
{"type": "get_recent_activity"}
```

#### Messages You'll Receive:
```json
// Authentication success
{"type": "auth_success", "message": "Successfully authenticated", "user_id": "user-uuid"}

// New bid placed
{
  "type": "new_bid",
  "bid": {
    "bid_id": "bid-123",
    "user_type": "seller",
    "bid_price": 22.00,
    "quantity": 10,
    "message": "Best offer!",
    "created_at": "2024-01-15T12:00:00Z"
  }
}

// New chat message
{
  "type": "new_message",
  "message": {
    "message_id": "msg-123",
    "user_id": "user-uuid",
    "content": "Thanks for the offer",
    "created_at": "2024-01-15T12:05:00Z"
  }
}

// Bargain accepted/closed
{
  "type": "bargain_accepted",
  "accepted_bid_id": "bid-123",
  "final_price": 22.00,
  "quantity": 10
}

// User joined/left room
{"type": "user_joined", "user_id": "user-uuid", "timestamp": "2024-01-15T12:00:00Z"}
{"type": "user_left", "user_id": "user-uuid", "timestamp": "2024-01-15T12:10:00Z"}

// Typing indicator
{"type": "typing", "user_id": "user-uuid", "is_typing": true, "timestamp": "2024-01-15T12:00:00Z"}

// Keep-alive response
{"type": "pong", "timestamp": "2024-01-15T12:00:00Z"}

// Error occurred
{"type": "error", "message": "Error description"}
```

---

## 📋 Response Formats & Error Handling

### Success Response Format
Most endpoints return data directly or in this format:
```json
{
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `204` - No Content (Success, no data returned)
- `400` - Bad Request (Invalid input data)
- `401` - Unauthorized (Authentication required/failed)
- `403` - Forbidden (Access denied)
- `404` - Not Found (Resource doesn't exist)
- `422` - Unprocessable Entity (Validation error)
- `500` - Internal Server Error

---

## 🔑 User Types & Permissions

### Permission Matrix
| Endpoint | Buyer | Seller | Both | None |
|----------|-------|---------|------|------|
| Login/Register | ✅ | ✅ | ✅ | ✅ |
| View Products | ✅ | ✅ | ✅ | ❌ |
| Create Products | ❌ | ✅ | ✅ | ❌ |
| Manage Inventory | ❌ | ✅ | ✅ | ❌ |
| Create Orders | ✅ | ❌ | ✅ | ❌ |
| Create Group Orders | ✅ | ❌ | ✅ | ❌ |
| Join Group Orders | ✅ | ❌ | ✅ | ❌ |
| View Group Orders | ✅ | ✅ | ✅ | ❌ |
| Update Order Status | ❌ | ✅ | ✅ | ❌ |
| Calculate Pricing | ✅ | ❌ | ✅ | ❌ |
| Create Public Bargains | ✅ | ❌ | ✅ | ❌ |
| Respond to Bargains | ❌ | ✅ | ✅ | ❌ |
| Private Bargaining | ✅ | ✅ | ✅ | ❌ |

---

## 🚀 Integration Guidelines

### 1. Authentication Flow
```javascript
// Step 1: Login
const loginResponse = await fetch('/api/v1/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});
const { access_token, user_type } = await loginResponse.json();

// Step 2: Store token (localStorage, sessionStorage, or secure cookie)
localStorage.setItem('token', access_token);
localStorage.setItem('userType', user_type);

// Step 3: Use token in subsequent requests
const response = await fetch('/api/v1/product/', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. WebSocket Connection
```javascript
// Connect to bargaining room
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:8000/api/v1/bargain/room-123/ws?token=${token}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'new_bid':
      updateBidsList(data.bid);
      break;
    case 'new_message':
      addChatMessage(data.message);
      break;
    case 'bargain_accepted':
      showSuccessMessage('Bargain accepted!');
      break;
  }
};

// Send a chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  content: 'Hello, interested in bulk order'
}));
```

### 3. Error Handling
```javascript
const handleApiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API call failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    // Handle different error types
    if (error.message.includes('401')) {
      // Redirect to login
      window.location.href = '/login';
    }
    throw error;
  }
};
```

### 4. Pagination Handling
```javascript
const fetchProducts = async (page = 0, limit = 10, filters = {}) => {
  const params = new URLSearchParams({
    skip: page * limit,
    limit: limit,
    ...filters
  });
  
  const response = await fetch(`/api/v1/product/?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

### 5. Group Order Management
```javascript
// Create a group order
const createGroupOrder = async (orderData, orderItems) => {
  const response = await fetch('/api/v1/order/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_data: { ...orderData, order_type: "group" },
      order_items: orderItems,
      purchase_type: "solo_singletime"
    })
  });
  
  return await response.json();
};

// Join an existing group order
const joinGroupOrder = async (orderId, quantityRequested) => {
  const response = await fetch('/api/v1/order/group/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_id: orderId,
      quantity_requested: quantityRequested
    })
  });
  
  return await response.json();
};

// Get available group orders
const getAvailableGroupOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/order/group/available?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

### 6. Pricing Calculation
```javascript
// Calculate pricing before placing order
const calculatePricing = async (orderItems, sellerId, purchaseType = "solo_singletime") => {
  const response = await fetch('/api/v1/order/calculate-pricing', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_items: orderItems,
      seller_id: sellerId,
      purchase_type: purchaseType
    })
  });
  
  return await response.json();
};

// Get product pricing for specific quantity
const getProductPricing = async (productId, quantity, purchaseType = "solo_singletime") => {
  const params = new URLSearchParams({
    quantity: quantity,
    purchase_type: purchaseType
  });
  
  const response = await fetch(`/api/v1/inventory/pricing/${productId}?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

---

## 📝 Data Formats

### Date Format
All dates use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS.sssZ`
```
Example: "2024-01-15T10:30:00.000Z"
```

### UUID Format
All IDs use UUID v4 format:
```
Example: "123e4567-e89b-12d3-a456-426614174000"
```

### Decimal Numbers
Prices and monetary values are decimal numbers with up to 2 decimal places:
```
Example: 25.50, 100.00, 0.99
```

---

## 🔧 Development Notes

### CORS Configuration
The API allows requests from:
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8080` (Alternative dev server)

### Rate Limiting
Currently no rate limiting is implemented, but consider adding it for production.

### Database
- Uses PostgreSQL with SQLAlchemy ORM
- Async database operations
- Automatic table creation on startup

### Real-time Features
- WebSocket connections for live bargaining
- Connection management for multiple users
- Automatic cleanup on disconnect

### Group Order System
- Collaborative purchasing with multiple buyers
- FIFO inventory allocation
- Dynamic pricing based on bulk discounts
- Proportional cost sharing among participants
- Real-time inventory checks for availability

### Advanced Pricing
- Multi-tier discount system (solo, subscription, group)
- FIFO inventory management
- Batch-based pricing calculation
- Real-time pricing endpoints for frontend integration

---

This documentation provides everything needed to integrate the Saathi E-commerce API with any frontend framework. The API supports traditional e-commerce operations, innovative group purchasing, real-time bargaining features, and advanced pricing calculations.
