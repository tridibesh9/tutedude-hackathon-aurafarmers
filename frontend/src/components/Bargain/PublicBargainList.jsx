import React, { useState, useEffect } from 'react';
import './PublicBargainList.css';

const PublicBargainList = ({ bargains, userRole, onJoinBargain, bargainType }) => {
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseData, setResponseData] = useState({
    price: '',
    message: ''
  });

  const handleRespondClick = (bargain) => {
    setRespondingTo(bargain.id);
    setResponseData({
      price: bargain.current_price || bargain.starting_price,
      message: ''
    });
  };

  const handleRespond = async (bargainId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/public/${bargainId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offered_price: parseFloat(responseData.price),
          message: responseData.message
        })
      });

      if (response.ok) {
        setRespondingTo(null);
        setResponseData({ price: '', message: '' });
        // You might want to refresh the bargains list or show a success message
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to respond to bargain');
      }
    } catch (error) {
      console.error('Error responding to bargain:', error);
      alert('Network error. Please try again.');
    }
  };

  const formatTimeRemaining = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getBargainStatus = (bargain) => {
    const now = new Date();
    const expiry = new Date(bargain.expiry_time);
    
    if (expiry <= now) return 'expired';
    if (bargain.status === 'completed') return 'completed';
    if (bargain.status === 'cancelled') return 'cancelled';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'expired': return '#e74c3c';
      case 'completed': return '#3498db';
      case 'cancelled': return '#95a5a6';
      default: return '#27ae60';
    }
  };

  if (bargains.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <h3>No bargains found</h3>
        <p>
          {bargainType === 'my-bargains' 
            ? "You haven't created any bargains yet."
            : "No active bargains available at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="bargain-list">
      {bargains.map(bargain => {
        const status = getBargainStatus(bargain);
        const timeRemaining = formatTimeRemaining(bargain.expiry_time);
        const isResponding = respondingTo === bargain.id;

        return (
          <div key={bargain.id} className={`bargain-card ${status}`}>
            <div className="card-header">
              <div className="product-info">
                <h3>{bargain.product_name}</h3>
                <span className="category">{bargain.category}</span>
              </div>
              <div className="status-info">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(status) }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="time-remaining">{timeRemaining}</span>
              </div>
            </div>

            <div className="card-content">
              <div className="bargain-details">
                <div className="detail-item">
                  <label>Quantity:</label>
                  <span>{bargain.quantity} {bargain.unit || 'units'}</span>
                </div>
                <div className="detail-item">
                  <label>Starting Price:</label>
                  <span>₹{bargain.starting_price}</span>
                </div>
                {bargain.current_price && bargain.current_price !== bargain.starting_price && (
                  <div className="detail-item">
                    <label>Current Bid:</label>
                    <span className="current-bid">₹{bargain.current_price}</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Location:</label>
                  <span>{bargain.location} - {bargain.pincode}</span>
                </div>
                {bargain.description && (
                  <div className="detail-item description">
                    <label>Description:</label>
                    <span>{bargain.description}</span>
                  </div>
                )}
              </div>

              <div className="bargain-stats">
                <div className="stat">
                  <span className="stat-number">{bargain.response_count || 0}</span>
                  <span className="stat-label">Responses</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{bargain.active_bidders || 0}</span>
                  <span className="stat-label">Active Bidders</span>
                </div>
              </div>
            </div>

            {/* Response Section for Sellers */}
            {userRole === 'seller' && status === 'active' && bargainType !== 'my-bargains' && (
              <div className="response-section">
                {!isResponding ? (
                  <button 
                    className="respond-btn"
                    onClick={() => handleRespondClick(bargain)}
                  >
                    Respond to Bargain
                  </button>
                ) : (
                  <div className="response-form">
                    <div className="form-row">
                      <input
                        type="number"
                        step="0.01"
                        value={responseData.price}
                        onChange={(e) => setResponseData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Your offer price"
                        className="price-input"
                      />
                      <input
                        type="text"
                        value={responseData.message}
                        onChange={(e) => setResponseData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Optional message"
                        className="message-input"
                      />
                    </div>
                    <div className="form-actions">
                      <button 
                        className="cancel-response-btn"
                        onClick={() => setRespondingTo(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="submit-response-btn"
                        onClick={() => handleRespond(bargain.id)}
                        disabled={!responseData.price}
                      >
                        Submit Offer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="card-actions">
              <button 
                className="view-details-btn"
                onClick={() => onJoinBargain(bargain)}
              >
                View Details
              </button>
              
              {status === 'active' && (
                <button 
                  className="join-room-btn"
                  onClick={() => onJoinBargain(bargain)}
                >
                  Join Bargaining Room
                </button>
              )}
            </div>

            {/* Bargain Creator Info */}
            <div className="creator-info">
              <span>Created by: {bargain.creator_name || 'Anonymous'}</span>
              <span className="creation-time">
                {new Date(bargain.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PublicBargainList;
