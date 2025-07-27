import React, { useState, useEffect, useRef } from 'react';
import './BargainRoom.css';

const BargainRoom = ({ bargain, userRole, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [bids, setBids] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newBid, setNewBid] = useState({ price: '', quantity: '', message: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [roomData, setRoomData] = useState(bargain);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [bargain.id]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionStatus('No authentication token found');
      return;
    }

    // Construct WebSocket URL
    const wsUrl = `ws://localhost:8000/api/v1/bargain/${bargain.id}/ws?token=${encodeURIComponent(token)}`;
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('Connected');
        
        // Request recent activity
        ws.current.send(JSON.stringify({
          type: 'get_recent_activity'
        }));
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        switch (data.type) {
          case 'auth_success':
            console.log('Authentication successful');
            break;
            
          case 'room_info':
            console.log('Room info received:', data.room);
            // Update room data with latest info
            setRoomData(prev => ({
              ...prev,
              current_price: data.room.current_bid_price,
              status: data.room.status
            }));
            break;
            
          case 'new_bid':
            setBids(prev => [data.bid, ...prev]);
            // Update current price
            setRoomData(prev => ({
              ...prev,
              current_price: data.bid.bid_price
            }));
            break;
            
          case 'new_message':
            setMessages(prev => [data.message, ...prev]);
            break;
            
          case 'recent_activity':
            setBids(data.bids || []);
            setMessages(data.messages || []);
            break;
            
          case 'bargain_accepted':
            alert(`Bargain accepted! Final price: $${data.final_price} for quantity: ${data.quantity}`);
            setRoomData(prev => ({
              ...prev,
              status: 'accepted'
            }));
            break;
            
          case 'user_joined':
            console.log(`User ${data.user_id} joined the room`);
            break;
            
          case 'user_left':
            console.log(`User ${data.user_id} left the room`);
            break;
            
          case 'error':
            console.error('WebSocket error:', data.message);
            setConnectionStatus(`Error: ${data.message}`);
            break;
            
          case 'pong':
            // Keep-alive response
            break;
            
          default:
            console.log('Unknown message type:', data);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!isConnected) {
            console.log('Attempting to reconnect...');
            setConnectionStatus('Reconnecting...');
            connectWebSocket();
          }
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('Failed to connect');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && ws.current && isConnected) {
      ws.current.send(JSON.stringify({
        type: 'chat_message',
        content: newMessage.trim()
      }));
      setNewMessage('');
    }
  };

  const placeBid = async () => {
    if (!newBid.price || !newBid.quantity) {
      alert('Please enter both price and quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargain.id}/bid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bid_price: parseFloat(newBid.price),
          quantity: parseInt(newBid.quantity),
          message: newBid.message || '',
          is_counter_offer: false
        })
      });

      if (response.ok) {
        setNewBid({ price: '', quantity: '', message: '' });
        // The WebSocket will receive the new bid automatically
      } else {
        const error = await response.json();
        alert(`Failed to place bid: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid. Please try again.');
    }
  };

  const acceptBid = async (bidId) => {
    if (!confirm('Are you sure you want to accept this bid?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargain.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bid_id: bidId
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Bargain accepted! ${result.message}`);
      } else {
        const error = await response.json();
        alert(`Failed to accept bid: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    }
  };

  // Keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current && isConnected) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Safe property access with fallbacks
  const productName = roomData.product_name || roomData.name || 'Unknown Product';
  const category = roomData.category || 'Unknown Category';
  const startingPrice = roomData.starting_price || roomData.initial_bid_price || '0';
  const currentPrice = roomData.current_price || roomData.current_bid_price || startingPrice;
  const quantity = roomData.quantity || roomData.initial_quantity || 0;
  const location = roomData.location || roomData.location_pincode || 'Unknown Location';
  const status = roomData.status || roomData.bargain_status || 'Unknown Status';
  const expiryTime = roomData.expiry_time || roomData.expires_at;

  return (
    <div className="bargain-room">
      <div className="room-header">
        <button onClick={onBack} className="back-btn">← Back to Dashboard</button>
        <h2>Bargain Room - {productName}</h2>
        <div className="connection-status" style={{
          color: isConnected ? 'green' : 'red',
          fontSize: '12px'
        }}>
          {connectionStatus}
        </div>
      </div>

      <div className="room-content" style={{ display: 'flex', gap: '20px', height: '70vh' }}>
        {/* Bargain Details */}
        <div className="bargain-details" style={{ flex: '1', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Bargain Details</h3>
          <div><strong>Product:</strong> {productName}</div>
          <div><strong>Category:</strong> {category}</div>
          <div><strong>Starting Price:</strong> ${startingPrice}</div>
          <div><strong>Current Price:</strong> ${currentPrice}</div>
          <div><strong>Quantity:</strong> {quantity}</div>
          <div><strong>Location:</strong> {location}</div>
          <div><strong>Status:</strong> {status}</div>
          {expiryTime && (
            <div><strong>Expires:</strong> {new Date(expiryTime).toLocaleString()}</div>
          )}
        </div>

        {/* Bids Section */}
        <div className="bids-section" style={{ flex: '1', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Bids</h3>
          <div className="bids-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {bids.length === 0 ? (
              <p>No bids yet</p>
            ) : (
              bids.map((bid, index) => (
                <div key={bid.bid_id || index} className="bid-item" style={{
                  padding: '10px',
                  margin: '5px 0',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  backgroundColor: bid.user_type === 'buyer' ? '#e3f2fd' : '#f3e5f5'
                }}>
                  <div><strong>{bid.user_type}:</strong> ${bid.bid_price} for {bid.quantity} units</div>
                  {bid.message && <div><em>"{bid.message}"</em></div>}
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(bid.created_at).toLocaleString()}
                  </div>
                  {/* Accept button for buyers accepting seller bids, or sellers accepting buyer bids */}
                  {((userRole === 'buyer' && bid.user_type === 'seller') || 
                    (userRole === 'seller' && bid.user_type === 'buyer')) && 
                    status !== 'accepted' && status !== 'completed' && (
                    <button 
                      onClick={() => acceptBid(bid.bid_id)}
                      style={{
                        marginTop: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Accept Bid
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Place Bid Form */}
          {status === 'active' && (
            <div className="place-bid">
              <h4>Place Your Bid</h4>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="number"
                  placeholder="Price"
                  value={newBid.price}
                  onChange={(e) => setNewBid(prev => ({ ...prev, price: e.target.value }))}
                  style={{ marginRight: '10px', padding: '5px' }}
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newBid.quantity}
                  onChange={(e) => setNewBid(prev => ({ ...prev, quantity: e.target.value }))}
                  style={{ padding: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Message (optional)"
                  value={newBid.message}
                  onChange={(e) => setNewBid(prev => ({ ...prev, message: e.target.value }))}
                  style={{ width: '100%', padding: '5px' }}
                />
              </div>
              <button 
                onClick={placeBid}
                disabled={!isConnected}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isConnected ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isConnected ? 'pointer' : 'not-allowed'
                }}
              >
                Place Bid
              </button>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="chat-section" style={{ flex: '1', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Chat</h3>
          <div className="messages-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {messages.length === 0 ? (
              <p>No messages yet</p>
            ) : (
              messages.map((message, index) => (
                <div key={message.message_id || index} className="message-item" style={{
                  padding: '8px',
                  margin: '5px 0',
                  border: '1px solid #eee',
                  borderRadius: '4px'
                }}>
                  <div>{message.content}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
        
          </div>

          <div className="send-message">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={{ width: '70%', padding: '5px', marginRight: '10px' }}
            />
            <button 
              onClick={sendMessage}
              disabled={!isConnected}
              style={{
                padding: '5px 15px',
                backgroundColor: isConnected ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isConnected ? 'pointer' : 'not-allowed'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BargainRoom;
