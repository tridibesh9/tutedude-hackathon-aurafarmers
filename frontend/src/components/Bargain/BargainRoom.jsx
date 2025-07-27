import React, { useState, useEffect, useRef } from 'react';
import BidHistory from './BidHistory';
import LiveChat from './LiveChat';
import './BargainRoom.css';

const BargainRoom = ({ bargain, userRole, onBack }) => {
  const [roomData, setRoomData] = useState(bargain);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const websocketRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    fetchRoomDetails();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [bargain.id]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/api/v1/bargain/${bargain.id}/ws?token=${token}`;
    
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      setConnected(true);
      setError('');
    };

    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    websocketRef.current.onclose = () => {
      setConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (!websocketRef.current || websocketRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 3000);
    };

    websocketRef.current.onerror = (error) => {
      setError('Connection error. Retrying...');
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'bid_update':
        setRoomData(prev => ({
          ...prev,
          current_price: data.amount,
          bid_history: data.bid_history || prev.bid_history
        }));
        break;
      case 'user_joined':
        setActiveUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
        break;
      case 'user_left':
        setActiveUsers(prev => prev.filter(u => u.id !== data.user.id));
        break;
      case 'bargain_accepted':
        setRoomData(prev => ({ ...prev, status: 'completed', winner: data.winner }));
        break;
      case 'bargain_cancelled':
        setRoomData(prev => ({ ...prev, status: 'cancelled' }));
        break;
      case 'active_users':
        setActiveUsers(data.users);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargain.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoomData(data.bargain);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    const currentPrice = roomData.current_price || roomData.starting_price;
    if (parseFloat(bidAmount) <= currentPrice) {
      setError('Bid must be higher than current price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargain.id}/bid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(bidAmount),
          message: bidMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBidAmount('');
        setBidMessage('');
      } else {
        setError(data.detail || 'Failed to place bid');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!window.confirm('Are you sure you want to accept the current bid? This will end the bargaining.')) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargain.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || 'Failed to accept bid');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const isExpired = new Date(roomData.expiry_time) <= new Date();
  const canBid = !isExpired && roomData.status === 'active' && userRole !== 'seller';
  const canAccept = !isExpired && roomData.status === 'active' && userRole === 'seller';
  const currentPrice = roomData.current_price || roomData.starting_price;

  return (
    <div className="bargain-room">
      {/* Header */}
      <div className="room-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="connection-status">
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '● Disconnected'}
          </div>
          <div className="active-users-count">
            {activeUsers.length} users online
          </div>
        </div>
      </div>

      <div className="room-content">
        {/* Left Panel - Product Info & Bidding */}
        <div className="left-panel">
          {/* Product Details */}
          <div className="product-section">
            <h2>{roomData.product_name}</h2>
            <div className="product-meta">
              <span className="category">{roomData.category}</span>
              <span className="quantity">{roomData.quantity} {roomData.unit || 'units'}</span>
              <span className="location">{roomData.location} - {roomData.pincode}</span>
            </div>
            
            {roomData.description && (
              <div className="product-description">
                <h4>Description</h4>
                <p>{roomData.description}</p>
              </div>
            )}
          </div>

          {/* Current Bid Display */}
          <div className="current-bid-section">
            <div className="bid-display">
              <h3>Current Price</h3>
              <div className="price-amount">₹{currentPrice}</div>
              {roomData.current_price && roomData.current_price !== roomData.starting_price && (
                <div className="starting-price">Starting: ₹{roomData.starting_price}</div>
              )}
            </div>
            
            <div className="bid-info">
              <div className="time-remaining">
                <span className="label">Time Remaining:</span>
                <span className={`time ${isExpired ? 'expired' : ''}`}>
                  {formatTimeRemaining(roomData.expiry_time)}
                </span>
              </div>
              
              {roomData.status === 'completed' && (
                <div className="winner-info">
                  <span className="label">Winner:</span>
                  <span className="winner">{roomData.winner?.name || 'Unknown'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bidding Form */}
          {canBid && (
            <div className="bidding-section">
              <h4>Place Your Bid</h4>
              {error && <div className="error-message">{error}</div>}
              
              <div className="bid-form">
                <div className="bid-input-group">
                  <input
                    type="number"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Minimum: ₹${currentPrice + 1}`}
                    min={currentPrice + 1}
                    className="bid-amount-input"
                  />
                  <span className="currency">₹</span>
                </div>
                
                <input
                  type="text"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Optional message with your bid"
                  className="bid-message-input"
                />
                
                <button
                  onClick={handlePlaceBid}
                  disabled={loading || !bidAmount}
                  className="place-bid-btn"
                >
                  {loading ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </div>
            </div>
          )}

          {/* Accept Bid Button for Sellers */}
          {canAccept && roomData.current_price && (
            <div className="accept-section">
              <button
                onClick={handleAcceptBid}
                disabled={loading}
                className="accept-bid-btn"
              >
                {loading ? 'Accepting...' : `Accept Current Bid (₹${currentPrice})`}
              </button>
            </div>
          )}

          {/* Status Messages */}
          {isExpired && (
            <div className="status-message expired">
              This bargain has expired
            </div>
          )}
          
          {roomData.status === 'completed' && (
            <div className="status-message completed">
              Bargain completed! Winner: {roomData.winner?.name || 'Unknown'}
            </div>
          )}
          
          {roomData.status === 'cancelled' && (
            <div className="status-message cancelled">
              This bargain has been cancelled
            </div>
          )}
        </div>

        {/* Right Panel - Chat & History */}
        <div className="right-panel">
          {/* Active Users */}
          <div className="active-users-section">
            <h4>Active Users ({activeUsers.length})</h4>
            <div className="users-list">
              {activeUsers.map(user => (
                <div key={user.id} className="user-item">
                  <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role ${user.role}`}>{user.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bid History */}
          <BidHistory 
            bargainId={bargain.id} 
            bidHistory={roomData.bid_history || []}
          />

          {/* Live Chat */}
          <LiveChat 
            bargainId={bargain.id}
            websocket={websocketRef.current}
            connected={connected}
          />
        </div>
      </div>
    </div>
  );
};

export default BargainRoom;
