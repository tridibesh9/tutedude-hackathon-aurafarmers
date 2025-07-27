# Bargain System Implementation Guide

## Overview
The bargain system enables real-time negotiation between buyers and sellers on the Saathi platform. It supports both public bargains (where multiple sellers can compete) and private bargains (direct negotiation between specific buyer-seller pairs).

## Architecture

### Core Components

1. **REST API Endpoints** - Handle bargain CRUD operations
2. **WebSocket Connection** - Real-time updates and messaging
3. **Database Models** - Store bargain rooms, bids, and messages
4. **Connection Manager** - Manage WebSocket connections per room

### Database Models

```python
# Main models involved:
- BargainRoom: Core bargain session
- BargainBid: Individual bids placed
- BargainMessage: Chat messages during bargaining
- BaseUser, Buyer, Seller: User authentication
- Product: Items being bargained for
```

## API Endpoints

### Public Bargaining

#### 1. Create Public Bargain (Buyer Only)
```http
POST /bargain/public/create
```
**Purpose**: Buyers create public bargains where multiple sellers can compete

**Request Body**:
```json
{
  "product_id": "uuid",
  "quantity": 10,
  "initial_bid_price": 25.50,
  "location_pincode": "12345",
  "expires_in_hours": 24
}
```

**Features**:
- Only buyers can create public bargains
- Sets expiry time automatically
- Validates product exists
- Creates room with `seller_id = null`

#### 2. Get Available Public Bargains (Seller Only)
```http
GET /bargain/public/available?location_pincode=12345&category=Vegetables&skip=0&limit=20
```
**Purpose**: Sellers view active public bargains they can respond to

**Query Parameters**:
- `location_pincode`: Filter by location
- `category`: Filter by product category
- `skip`: Pagination offset
- `limit`: Maximum results (max 100)

**Returns**: List of public bargains with product details and response counts

#### 3. Respond to Public Bargain (Seller Only)
```http
POST /bargain/public/{room_id}/respond
```
**Purpose**: Sellers place competitive bids on public bargains

**Request Body**:
```json
{
  "bid_price": 22.00,
  "quantity": 10,
  "message": "Fresh stock available with discount!"
}
```

**Features**:
- Validates seller permissions
- Checks bargain hasn't expired
- Sends real-time update to all room participants

### Private Bargaining

#### 4. Create Private Bargain (Buyer Only)
```http
POST /bargain/private/create
```
**Purpose**: Direct negotiation between specific buyer and seller

**Request Body**:
```json
{
  "product_id": "uuid",
  "seller_id": "uuid",
  "quantity": 5,
  "initial_bid_price": 30.00,
  "location_pincode": "12345"
}
```

**Features**:
- Validates seller exists
- Verifies product belongs to seller
- Creates private room with specific participants

### Universal Bargaining Operations

#### 5. Place Bid in Room
```http
POST /bargain/{room_id}/bid
```
**Purpose**: Place bids in any active bargaining room

**Request Body**:
```json
{
  "bid_price": 21.00,
  "quantity": 10,
  "message": "Counter offer",
  "is_counter_offer": true
}
```

**Features**:
- Works for both public and private rooms
- Validates user permissions
- Updates room's current bid price
- Sends real-time notifications

#### 6. Accept Bargain
```http
POST /bargain/{room_id}/accept
```
**Purpose**: Accept a specific bid and close the bargaining

**Request Body**:
```json
{
  "bid_id": "uuid"
}
```

**Features**:
- Buyers can accept in public bargains
- Either party can accept in private bargains
- Closes the room with status "accepted"
- Sends final update to all participants

#### 7. Get Bargain Room Details
```http
GET /bargain/{room_id}
```
**Purpose**: Get comprehensive room information

**Returns**:
- Room details and status
- Product information
- Recent bids (last 10)
- Recent chat messages (last 10)
- Access controlled based on room type

#### 8. Get My Bargains
```http
GET /bargain/my-bargains?room_type=public&status=active&skip=0&limit=20
```
**Purpose**: List all user's bargaining rooms

**Query Parameters**:
- `room_type`: "public" or "private"
- `status`: "active", "closed", "accepted", "rejected"
- `skip`: Pagination offset
- `limit`: Maximum results

## WebSocket Real-Time Features

### Connection Setup

#### WebSocket Endpoint
```
ws://localhost:8000/api/v1/bargain/{room_id}/ws
```

#### Authentication Methods

**Method 1: Query Parameter**
```
ws://localhost:8000/api/v1/bargain/{room_id}/ws?token=your_jwt_token
```

**Method 2: First Message**
```javascript
// Connect first, then send:
{
  "type": "auth",
  "token": "your_jwt_token"
}
```

### Message Types

#### Incoming Messages (Client → Server)

```javascript
// Authentication
{ "type": "auth", "token": "jwt_token" }

// Keep connection alive
{ "type": "ping" }

// Typing indicator
{ "type": "typing", "is_typing": true }

// Chat during bargaining
{ "type": "chat_message", "content": "Hello everyone!" }

// Request recent activity
{ "type": "get_recent_activity" }
```

#### Outgoing Messages (Server → Client)

```javascript
// Authentication success
{
  "type": "auth_success",
  "message": "Successfully authenticated",
  "user_id": "uuid"
}

// New bid placed
{
  "type": "new_bid",
  "bid": {
    "bid_id": "uuid",
    "user_type": "seller",
    "bid_price": 22.50,
    "quantity": 10,
    "message": "Best offer!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}

// Chat message
{
  "type": "new_message",
  "message": {
    "message_id": "uuid",
    "user_id": "uuid",
    "content": "Great deal!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}

// Bargain accepted/closed
{
  "type": "bargain_accepted",
  "accepted_bid_id": "uuid",
  "final_price": 22.50,
  "quantity": 10
}

// User presence
{
  "type": "user_joined",
  "user_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}

{
  "type": "user_left",
  "user_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Room information on connect
{
  "type": "room_info",
  "room": {
    "room_id": "uuid",
    "room_type": "public",
    "status": "active",
    "current_bid_price": 22.50,
    "quantity": 10
  }
}

// Typing indicators
{
  "type": "typing",
  "user_id": "uuid",
  "is_typing": true,
  "timestamp": "2024-01-15T10:30:00Z"
}

// Errors
{
  "type": "error",
  "message": "Authentication failed"
}
```

### Connection Management

#### Access Control
- **Private Rooms**: Only buyer and seller can access
- **Public Rooms**: Buyer and any seller can access
- JWT token validation required
- Room access verification before connection

#### Connection Lifecycle
1. **Connect**: WebSocket handshake
2. **Authenticate**: Validate JWT token
3. **Authorize**: Check room access permissions
4. **Join**: Add to connection manager
5. **Send Room Info**: Current room state
6. **Message Loop**: Handle real-time messages
7. **Disconnect**: Clean up and notify others

## Frontend Integration

### JavaScript WebSocket Client

```javascript
import { BargainWebSocket } from './utils/bargainUtils.js';

// Initialize connection
const ws = new BargainWebSocket(
  bargainId,
  authToken,
  handleMessage,
  handleError
);

// Connect
ws.connect();

// Send messages
ws.send({ type: 'ping' });
ws.send({ 
  type: 'chat_message', 
  content: 'Hello everyone!' 
});

// Handle incoming messages
function handleMessage(data) {
  switch(data.type) {
    case 'new_bid':
      updateBidDisplay(data.bid);
      break;
    case 'new_message':
      addChatMessage(data.message);
      break;
    case 'bargain_accepted':
      showBargainComplete(data);
      break;
  }
}
```

### API Integration

```javascript
import { bargainAPI } from './utils/bargainUtils.js';

// Create bargain
const bargain = await bargainAPI.createBargain({
  type: 'public',
  product_id: 'uuid',
  quantity: 10,
  initial_bid_price: 25.50,
  location_pincode: '12345',
  expires_in_hours: 24
});

// Place bid
const bid = await bargainAPI.placeBid(bargainId, {
  bid_price: 23.00,
  quantity: 10,
  message: 'Counter offer'
});

// Get available bargains
const bargains = await bargainAPI.getPublicBargains({
  location_pincode: '12345',
  category: 'Vegetables'
});
```

## Security Features

### Authentication & Authorization
- JWT token validation for all endpoints
- Role-based access (buyer/seller specific endpoints)
- WebSocket authentication with token validation
- Room access control based on user permissions

### Data Validation
- Input validation for all request bodies
- Price and quantity validation
- Expiry time validation
- Product ownership verification

### Error Handling
- Comprehensive error responses
- WebSocket error messaging
- Connection cleanup on failures
- Graceful disconnection handling

## Performance Considerations

### Database Optimization
- Indexed queries for bargain lookups
- Pagination for large result sets
- Optimized joins for room details
- Efficient message storage

### WebSocket Scaling
- Connection pooling per room
- Memory cleanup on disconnect
- Message broadcasting optimization
- Background process handling

### Real-time Updates
- Instant bid notifications
- Live chat messaging
- User presence tracking
- Typing indicators

## Usage Examples

### Public Bargaining Flow
1. **Buyer** creates public bargain for tomatoes
2. **Multiple sellers** see the bargain in their available list
3. **Sellers** place competitive bids via WebSocket
4. **Real-time updates** show all bids to participants
5. **Buyer** accepts best offer
6. **Room closes** and all participants notified

### Private Bargaining Flow
1. **Buyer** initiates private bargain with specific seller
2. **Both parties** connect to WebSocket room
3. **Negotiation** happens via bids and chat
4. **Either party** can accept when satisfied
5. **Deal closed** with final terms

## Testing

The implementation includes comprehensive testing capabilities:

```bash
# Run the test suite
cd backend
python test_bargain_api.py
```

The test covers:
- Public bargain creation
- Bid placement
- WebSocket connections
- Error handling
- Authentication flows

## Deployment Notes

### Environment Setup
1. Ensure WebSocket support in your deployment environment
2. Configure proper CORS settings for WebSocket connections
3. Set up database migrations for bargain tables
4. Configure JWT secret keys

### Monitoring
- Monitor WebSocket connection counts
- Track bargain completion rates
- Monitor message throughput
- Alert on authentication failures

## Future Enhancements

### Potential Features
- Automatic bid expiration
- Bid increment rules
- Multi-product bargaining
- Bargain templates
- Advanced filtering
- Bargain analytics
- Mobile push notifications
- Video call integration

### Scalability Improvements
- Redis for WebSocket scaling
- Message queue for notifications
- Caching for frequently accessed data
- Database sharding for high volume

## Conclusion

The bargain system provides a complete real-time negotiation platform with:
- ✅ Public and private bargaining modes
- ✅ Real-time WebSocket communication
- ✅ Comprehensive REST API
- ✅ Secure authentication and authorization
- ✅ Live chat and typing indicators
- ✅ User presence tracking
- ✅ Mobile-ready architecture

The implementation is production-ready and can handle multiple concurrent bargaining sessions with real-time updates for all participants.
