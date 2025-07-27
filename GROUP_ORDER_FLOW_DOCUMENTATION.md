# Group Order Flow Documentation

## Overview
The group order system allows multiple buyers to collaborate on purchasing products together, potentially achieving better prices through bulk discounts and shared shipping costs.

## API Endpoints Overview
Base URL: `http://localhost:8000/api/v1`

### Group Order Related Endpoints:
1. `POST /order/create` - Create a new group order (primary buyer)
2. `POST /order/group/join` - Join an existing group order
3. `GET /order/group/{order_id}` - Get group order details
4. `GET /order/group/available` - List available group orders to join
5. `PUT /order/group/participant/{participant_id}/status` - Update participant status
6. `POST /order/calculate-pricing` - Calculate pricing for group orders

---

## Complete Group Order Flow

### Step 1: Primary Buyer Creates Group Order

**Endpoint:** `POST /api/v1/order/create`

**Sample Request:**
```json
{
  "order_data": {
    "seller_id": "123e4567-e89b-12d3-a456-426614174001",
    "estimated_delivery_date": "2025-08-15",
    "order_type": "group"
  },
  "order_items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174002",
      "quantity": 50,
      "price_per_unit": 25.00
    },
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174003",
      "quantity": 30,
      "price_per_unit": 15.50
    }
  ],
  "purchase_type": "solo_singletime"
}
```

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Sample Response:**
```json
{
  "order_id": "123e4567-e89b-12d3-a456-426614174100",
  "buyer_id": "123e4567-e89b-12d3-a456-426614174010",
  "seller_id": "123e4567-e89b-12d3-a456-426614174001",
  "group_buyer_ids": ["123e4567-e89b-12d3-a456-426614174010"],
  "order_type": "group",
  "total_price": 1715.00,
  "order_status": "Pending",
  "estimated_delivery_date": "2025-08-15",
  "order_date": "2025-07-27T10:30:00Z"
}
```

### Step 2: Calculate Pricing (Optional - Before Creating Order)

**Endpoint:** `POST /api/v1/order/calculate-pricing`

**Sample Request:**
```json
{
  "order_items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174002",
      "quantity": 50,
      "price_per_unit": 25.00
    }
  ],
  "seller_id": "123e4567-e89b-12d3-a456-426614174001",
  "purchase_type": "solo_singletime"
}
```

**Sample Response:**
```json
{
  "seller_id": "123e4567-e89b-12d3-a456-426614174001",
  "purchase_type": "solo_singletime",
  "summary": {
    "total_original_price": 1250.00,
    "total_discounted_price": 1125.00,
    "total_savings": 125.00,
    "overall_savings_percentage": 10.0
  },
  "item_breakdowns": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174002",
      "product_name": "Organic Rice",
      "quantity": 50,
      "original_total": 1250.00,
      "discounted_total": 1125.00,
      "savings": 125.00,
      "savings_percentage": 10.0,
      "batch_details": [
        {
          "inventory_id": "123e4567-e89b-12d3-a456-426614174200",
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

### Step 3: Other Buyers Discover Available Group Orders

**Endpoint:** `GET /api/v1/order/group/available`

**Query Parameters:**
- `seller_id` (optional): Filter by specific seller
- `product_category` (optional): Filter by product category
- `max_distance_km` (optional): Filter by distance
- `skip`: Pagination offset (default: 0)
- `limit`: Number of results (default: 20, max: 100)

**Sample Request:**
```bash
GET /api/v1/order/group/available?seller_id=123e4567-e89b-12d3-a456-426614174001&limit=10
```

**Sample Response:**
```json
[
  {
    "order_id": "123e4567-e89b-12d3-a456-426614174100",
    "primary_buyer_id": "123e4567-e89b-12d3-a456-426614174010",
    "seller_id": "123e4567-e89b-12d3-a456-426614174001",
    "total_participants": 1,
    "total_quantity": 80,
    "total_price": 1715.00,
    "order_status": "Pending",
    "order_type": "group",
    "participants": [],
    "estimated_delivery_date": "2025-08-15",
    "order_date": "2025-07-27T10:30:00Z"
  }
]
```

### Step 4: Secondary Buyers Join Group Order

**Endpoint:** `POST /api/v1/order/group/join`

**Sample Request:**
```json
{
  "order_id": "123e4567-e89b-12d3-a456-426614174100",
  "quantity_requested": 20
}
```

**Headers:**
```
Authorization: Bearer {jwt_token_buyer2}
Content-Type: application/json
```

**Sample Response:**
```json
{
  "participant_id": "123e4567-e89b-12d3-a456-426614174300",
  "order_id": "123e4567-e89b-12d3-a456-426614174100",
  "buyer_id": "123e4567-e89b-12d3-a456-426614174020",
  "quantity_share": 20,
  "price_share": 428.75,
  "status": "pending",
  "joined_at": "2025-07-27T11:00:00Z",
  "buyer_info": null
}
```

### Step 5: Get Group Order Details

**Endpoint:** `GET /api/v1/order/group/{order_id}`

**Sample Request:**
```bash
GET /api/v1/order/group/123e4567-e89b-12d3-a456-426614174100
```

**Sample Response:**
```json
{
  "order_id": "123e4567-e89b-12d3-a456-426614174100",
  "primary_buyer_id": "123e4567-e89b-12d3-a456-426614174010",
  "seller_id": "123e4567-e89b-12d3-a456-426614174001",
  "total_participants": 2,
  "total_quantity": 100,
  "total_price": 2143.75,
  "order_status": "Pending",
  "order_type": "group",
  "participants": [
    {
      "participant_id": "123e4567-e89b-12d3-a456-426614174301",
      "order_id": "123e4567-e89b-12d3-a456-426614174100",
      "buyer_id": "123e4567-e89b-12d3-a456-426614174010",
      "quantity_share": 80,
      "price_share": 1715.00,
      "status": "confirmed",
      "joined_at": "2025-07-27T10:30:00Z",
      "buyer_info": {
        "email": "primary.buyer@example.com",
        "mobile_number": "+1234567890",
        "shipping_address": "123 Main St, City, State",
        "shipping_pincode": "12345"
      }
    },
    {
      "participant_id": "123e4567-e89b-12d3-a456-426614174300",
      "order_id": "123e4567-e89b-12d3-a456-426614174100",
      "buyer_id": "123e4567-e89b-12d3-a456-426614174020",
      "quantity_share": 20,
      "price_share": 428.75,
      "status": "pending",
      "joined_at": "2025-07-27T11:00:00Z",
      "buyer_info": {
        "email": "secondary.buyer@example.com",
        "mobile_number": "+1234567891",
        "shipping_address": "456 Oak Ave, City, State",
        "shipping_pincode": "12346"
      }
    }
  ],
  "estimated_delivery_date": "2025-08-15",
  "order_date": "2025-07-27T10:30:00Z"
}
```

### Step 6: Update Participant Status

**Endpoint:** `PUT /api/v1/order/group/participant/{participant_id}/status`

**Sample Request:**
```bash
PUT /api/v1/order/group/participant/123e4567-e89b-12d3-a456-426614174300/status?new_status=confirmed
```

**Sample Response:**
```json
{
  "message": "Participant status updated to confirmed"
}
```

### Step 7: Get Order Details with Items

**Endpoint:** `GET /api/v1/order/{order_id}`

**Sample Response:**
```json
{
  "order_id": "123e4567-e89b-12d3-a456-426614174100",
  "buyer_id": "123e4567-e89b-12d3-a456-426614174010",
  "seller_id": "123e4567-e89b-12d3-a456-426614174001",
  "group_buyer_ids": [
    "123e4567-e89b-12d3-a456-426614174010",
    "123e4567-e89b-12d3-a456-426614174020"
  ],
  "order_type": "group",
  "total_price": 2143.75,
  "order_status": "Pending",
  "estimated_delivery_date": "2025-08-15",
  "order_date": "2025-07-27T10:30:00Z",
  "order_items": [
    {
      "order_item_id": "123e4567-e89b-12d3-a456-426614174400",
      "order_id": "123e4567-e89b-12d3-a456-426614174100",
      "product_id": "123e4567-e89b-12d3-a456-426614174002",
      "quantity": 50,
      "price_per_unit": 22.50
    },
    {
      "order_item_id": "123e4567-e89b-12d3-a456-426614174401",
      "order_id": "123e4567-e89b-12d3-a456-426614174100",
      "product_id": "123e4567-e89b-12d3-a456-426614174003",
      "quantity": 30,
      "price_per_unit": 14.95
    }
  ],
  "group_buyers_info": [
    {
      "buyer_id": "123e4567-e89b-12d3-a456-426614174010",
      "email": "primary.buyer@example.com",
      "mobile_number": "+1234567890",
      "quantity_share": 80,
      "price_share": 1715.00,
      "status": "confirmed",
      "joined_at": "2025-07-27T10:30:00Z",
      "shipping_address": "123 Main St, City, State",
      "shipping_pincode": "12345"
    },
    {
      "buyer_id": "123e4567-e89b-12d3-a456-426614174020",
      "email": "secondary.buyer@example.com",
      "mobile_number": "+1234567891",
      "quantity_share": 20,
      "price_share": 428.75,
      "status": "confirmed",
      "joined_at": "2025-07-27T11:00:00Z",
      "shipping_address": "456 Oak Ave, City, State",
      "shipping_pincode": "12346"
    }
  ]
}
```

---

## Complete Flow Summary

### 1. **Order Creation Flow:**
   - Primary buyer creates group order with `order_type: "group"`
   - System creates order and initial participant record
   - Inventory is allocated using FIFO logic
   - Discounts are applied based on quantity and purchase type

### 2. **Joining Flow:**
   - Other buyers discover available group orders
   - Buyers join by specifying quantity they want
   - System calculates their price share proportionally
   - Participant status starts as "pending"

### 3. **Management Flow:**
   - Participants can update their status to "confirmed"
   - Primary buyer or participants can view detailed order information
   - Seller can update order status (Pending → Confirmed → Shipped → Delivered)

### 4. **Key Features:**
   - **FIFO Inventory Management:** Uses oldest inventory first
   - **Dynamic Pricing:** Applies bulk discounts based on total quantity
   - **Group Coordination:** Tracks all participants and their shares
   - **Flexible Participation:** Buyers can join/leave before confirmation
   - **Proportional Pricing:** Price calculated based on quantity share

### 5. **Business Rules:**
   - Only buyers can create and join group orders
   - Group orders must be in "Pending" status to accept new participants
   - Inventory availability is checked before allowing joins
   - Price per unit is calculated based on available inventory batches and discounts
   - Each participant's price share is proportional to their quantity share

---

## Error Scenarios

### Common Error Responses:

**Insufficient Inventory:**
```json
{
  "detail": "Insufficient inventory for Organic Rice. Requested: 100, Available: 75"
}
```

**Order Not Found:**
```json
{
  "detail": "Order not found"
}
```

**Permission Denied:**
```json
{
  "detail": "Only buyers can create orders"
}
```

**Already Participant:**
```json
{
  "detail": "You are already part of this group order"
}
```

**Order Not Available for Joining:**
```json
{
  "detail": "Cannot join order that is no longer pending"
}
```

---

## Required Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

The token should contain the user's information and be obtained through the login endpoint.
