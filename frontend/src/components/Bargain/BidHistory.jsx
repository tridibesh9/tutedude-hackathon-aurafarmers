import React, { useState, useEffect } from 'react';
import './BidHistory.css';

const BidHistory = ({ bargainId, bidHistory }) => {
  const [history, setHistory] = useState(bidHistory || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bidHistory || bidHistory.length === 0) {
      fetchBidHistory();
    } else {
      setHistory(bidHistory);
    }
  }, [bargainId, bidHistory]);

  const fetchBidHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching bid history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    // More than 24 hours
    return date.toLocaleDateString();
  };

  const getBidTypeIcon = (type) => {
    switch (type) {
      case 'bid':
        return '📈';
      case 'response':
        return '💬';
      case 'accept':
        return '✅';
      case 'reject':
        return '❌';
      default:
        return '💰';
    }
  };

  const getBidTypeClass = (type) => {
    switch (type) {
      case 'bid':
        return 'bid-entry';
      case 'response':
        return 'response-entry';
      case 'accept':
        return 'accept-entry';
      case 'reject':
        return 'reject-entry';
      default:
        return 'bid-entry';
    }
  };

  const getUserRoleClass = (userRole) => {
    return userRole === 'buyer' ? 'buyer' : 'seller';
  };

  if (loading) {
    return (
      <div className="bid-history">
        <h4>Bid History</h4>
        <div className="loading">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="bid-history">
      <div className="history-header">
        <h4>Bid History</h4>
        <span className="history-count">
          {history.length} {history.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="history-container">
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">📊</div>
            <p>No bids yet</p>
            <span>Be the first to place a bid!</span>
          </div>
        ) : (
          <div className="timeline">
            {history.map((entry, index) => (
              <div 
                key={`${entry.id || index}-${entry.timestamp}`} 
                className={`timeline-item ${getBidTypeClass(entry.type)}`}
              >
                <div className="timeline-marker">
                  <span className="timeline-icon">
                    {getBidTypeIcon(entry.type)}
                  </span>
                </div>
                
                <div className="timeline-content">
                  <div className="entry-header">
                    <div className="user-info">
                      <span className={`user-name ${getUserRoleClass(entry.user_role)}`}>
                        {entry.user_name || 'Anonymous'}
                      </span>
                      <span className={`user-role-badge ${entry.user_role}`}>
                        {entry.user_role}
                      </span>
                    </div>
                    <span className="timestamp">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>

                  <div className="entry-content">
                    {entry.amount && (
                      <div className="bid-amount">
                        <span className="amount">₹{entry.amount}</span>
                        {entry.previous_amount && (
                          <span className="amount-change">
                            {entry.amount > entry.previous_amount ? '↗' : '↘'}
                            {Math.abs(entry.amount - entry.previous_amount).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}

                    {entry.message && (
                      <div className="bid-message">
                        <span className="message-icon">💬</span>
                        <span className="message-text">{entry.message}</span>
                      </div>
                    )}

                    <div className="entry-type">
                      {entry.type === 'bid' && 'Placed a bid'}
                      {entry.type === 'response' && 'Responded to bargain'}
                      {entry.type === 'accept' && 'Accepted the bid'}
                      {entry.type === 'reject' && 'Rejected the bid'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-stats">
          <div className="stat">
            <span className="stat-label">Highest Bid</span>
            <span className="stat-value">
              ₹{Math.max(...history.filter(h => h.amount).map(h => h.amount)).toFixed(2)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Bids</span>
            <span className="stat-value">
              {history.filter(h => h.type === 'bid').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Participants</span>
            <span className="stat-value">
              {new Set(history.map(h => h.user_id)).size}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidHistory;
