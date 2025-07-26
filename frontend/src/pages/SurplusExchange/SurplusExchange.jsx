import React, { useState } from 'react';
import { Plus, Camera, MapPin, Clock, Star } from 'lucide-react';
import './SurplusExchange.css'; // Import the CSS file

const SurplusExchange = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [showAddItem, setShowAddItem] = useState(false);

  const surplusItems = [
    {
      id: '1',
      name: 'Fresh Coriander',
      quantity: 2,
      unit: 'kg',
      price: 15,
      originalPrice: 25,
      seller: 'Raj Chaat Wala',
      distance: 0.8,
      timeLeft: '2 hours',
      reason: 'Bought extra',
      image: '🌿',
      rating: 4.3,
    },
    {
      id: '2',
      name: 'Chopped Onions',
      quantity: 1,
      unit: 'kg',
      price: 20,
      originalPrice: 30,
      seller: 'Golu Pakode Wala',
      distance: 1.2,
      timeLeft: '1 hour',
      reason: 'Closing shop early',
      image: '🧅',
      rating: 4.6,
    },
  ];

  const myListings = [
    {
      id: '3',
      name: 'Fresh Tomatoes',
      quantity: 3,
      unit: 'kg',
      price: 22,
      views: 12,
      interested: 3,
      timeLeft: '4 hours',
    },
  ];

  // A helper to prevent background scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = showAddItem ? 'hidden' : 'unset';
  }, [showAddItem]);

  return (
    <div className="surplus-exchange-container">
      {/* Header */}
      <div className="header">
        <h1 className="header-title">Surplus Exchange</h1>
        <p className="header-subtitle">Buy or sell surplus goods</p>
        
        {/* Tabs */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('buy')}
            className={`tab-button ${activeTab === 'buy' ? 'tab-button-active-buy' : 'tab-button-inactive'}`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`tab-button ${activeTab === 'sell' ? 'tab-button-active-sell' : 'tab-button-inactive'}`}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="content-area">
        {activeTab === 'buy' && (
          <div className="buy-section">
            {/* Info Banner */}
            <div className="info-banner buy-banner">
              <div className="info-banner-title">💡 Tips</div>
              <div className="info-banner-text">
                Buy fresh ingredients at a lower price from nearby vendors.
              </div>
            </div>

            {/* Available Items */}
            {surplusItems.map((item) => (
              <div key={item.id} className="item-card">
                {/* Urgency Banner */}
                <div className="item-card-urgency-banner">
                  ⏰ Ends in {item.timeLeft} - Hurry up!
                </div>

                <div className="item-card-content">
                  <div className="item-card-main-flex">
                    <div className="item-image-container">
                      <span className="item-image">{item.image}</span>
                    </div>

                    <div className="item-details">
                      <div className="item-header">
                        <div>
                          <h3 className="item-name">{item.name}</h3>
                          <p className="item-seller">{item.seller}</p>
                        </div>
                        <div className="item-rating">
                          <Star className="item-rating-star" size={12} />
                          <span className="item-rating-text">{item.rating}</span>
                        </div>
                      </div>

                      <div className="item-meta-info">
                        <div className="meta-info-item">
                          <MapPin size={12} className="meta-info-icon" />
                          {item.distance} km
                        </div>
                        <div className="meta-info-item">
                          <Clock size={12} className="meta-info-icon" />
                          {item.timeLeft}
                        </div>
                      </div>

                      <div className="item-pricing-info">
                        <div>
                          <div className="item-reason">Reason: {item.reason}</div>
                          <div className="item-price">
                            <span className="item-original-price">
                              ₹{item.originalPrice}
                            </span>
                            ₹{item.price}/{item.unit}
                          </div>
                        </div>
                        <div className="item-availability-right">
                          <div className="item-availability-label">Available</div>
                          <div className="item-availability-quantity">{item.quantity} {item.unit}</div>
                        </div>
                      </div>

                      <button className="buy-now-button">
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="sell-section">
            {/* Add New Item Button */}
            <button
              onClick={() => setShowAddItem(true)}
              className="add-item-button"
            >
              <Plus size={20} />
              <span>Sell New Item</span>
            </button>

            {/* My Listings */}
            <div>
              <h3 className="my-listings-title">My Listings</h3>
              {myListings.map((item) => (
                <div key={item.id} className="listing-card">
                  <div className="listing-header">
                    <div className="listing-details">
                      <h4 className="listing-name">{item.name}</h4>
                      <p className="listing-quantity-price">{item.quantity} {item.unit} - ₹{item.price}</p>
                    </div>
                    <div className="listing-status">
                      <div className="listing-time">Ends in {item.timeLeft}</div>
                      <div className="listing-interested">{item.interested} interested</div>
                    </div>
                  </div>

                  <div className="listing-actions">
                    <button className="listing-edit-button">
                      Edit
                    </button>
                    <button className="listing-remove-button">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Sell Tips */}
            <div className="info-banner sell-banner">
              <div className="info-banner-title">💡 Selling Tips</div>
              <div className="sell-tips-list">
                <div>• Add a good photo</div>
                <div>• Set a fair price</div>
                <div>• State the reason</div>
                <div>• Respond quickly</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Add New Item</h3>
            
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Fresh Coriander"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="2"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-input">
                    <option>kg</option>
                    <option>gm</option>
                    <option>piece</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Price (per unit)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="15"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for selling</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bought extra"
                />
              </div>

              <button className="add-photo-button">
                <Camera size={20} />
                <span>Add Photo</span>
              </button>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowAddItem(false)}
                className="modal-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="modal-submit-button"
              >
                List Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurplusExchange;