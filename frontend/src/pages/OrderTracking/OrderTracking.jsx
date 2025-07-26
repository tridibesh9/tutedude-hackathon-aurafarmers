import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle, Truck, Phone, MessageCircle } from 'lucide-react';
import './OrderTracking.css';

// Note: The 'lucide-react' library would need to be installed in your project
// npm install lucide-react

export const OrderTracking = () => {
  // The userRole prop is no longer needed for this static example, but can be added back if required.
  const [activeTab, setActiveTab] = useState('live');

  const liveOrders = [
    {
      id: '1234',
      status: 'out_for_delivery',
      items: ['Onions 5kg', 'Tomatoes 3kg'],
      supplier: 'Gupta Traders',
      eta: '15 minutes',
      driverName: 'Rahul Kumar',
      driverPhone: '+91 98765 43210',
      totalAmount: 195,
      currentLocation: 'Near Connaught Place',
    }
  ];

  const orderHistory = [
    {
      id: '1233',
      date: '10 Jan 2025',
      status: 'delivered',
      items: ['Turmeric Powder 2kg', 'Red Chilli 1kg'],
      supplier: 'Sharma Wholesale',
      amount: 380,
    },
    {
      id: '1232',
      date: '08 Jan 2025',
      status: 'delivered',
      items: ['Onions 10kg', 'Potatoes 5kg'],
      supplier: 'Gupta Traders',
      amount: 425,
    },
  ];

  const getStatusInfo = (status) => {
    switch (status) {
      case 'out_for_delivery':
        return { text: 'Out for Delivery', className: 'status-out-for-delivery' };
      case 'delivered':
        return { text: 'Delivered', className: 'status-delivered' };
      default:
        return { text: 'Unknown', className: 'status-unknown' };
    }
  };

  return (
    <div className="order-tracking-container">
      {/* Header */}
      <div className="header">
        <h1 className="header-title">Order Tracking</h1>
        
        {/* Tabs */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('live')}
            className={`tab-button ${activeTab === 'live' ? 'active' : 'inactive'}`}
          >
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`tab-button ${activeTab === 'history' ? 'active' : 'inactive'}`}
          >
            Order History
          </button>
        </div>
      </div>

      <div className="content-area">
        {activeTab === 'live' && (
          <div className="orders-list">
            {liveOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div key={order.id} className="live-order-card">
                  {/* Live Tracking Header */}
                  <div className="live-order-header">
                    <div className="flex-between">
                      <div>
                        <div className="order-id-label">Order #{order.id}</div>
                        <div className="supplier-name-lg">{order.supplier}</div>
                      </div>
                      <div className={`status-badge ${statusInfo.className}`}>
                        {statusInfo.text}
                      </div>
                    </div>
                  </div>

                  {/* Map Placeholder */}
                  <div className="map-placeholder">
                    <div className="text-center">
                      <Truck className="map-truck-icon" size={32} />
                      <div className="map-label">
                        🗺️ Live Map Tracking
                      </div>
                      <div className="map-location">{order.currentLocation}</div>
                    </div>
                  </div>

                  <div className="order-details-section">
                    {/* ETA */}
                    <div className="eta-info-box">
                      <Clock className="eta-icon" size={20} />
                      <div>
                        <div className="info-box-title">Estimated Arrival</div>
                        <div className="eta-time">Arriving in {order.eta}</div>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <div className="items-label">Items:</div>
                      <div className="items-list">
                        {order.items.map((item, index) => (
                          <div key={index} className="item-entry">• {item}</div>
                        ))}
                      </div>
                    </div>

                    {/* Driver Info */}
                    <div className="driver-info-box">
                      <div className="driver-details">
                        <div className="driver-avatar">
                          <span className="driver-avatar-emoji">🚚</span>
                        </div>
                        <div>
                          <div className="driver-name">{order.driverName}</div>
                          <div className="driver-label">Driver</div>
                        </div>
                      </div>
                      
                      <div className="driver-actions">
                        <button className="action-button call-button">
                          <Phone size={16} />
                        </button>
                        <button className="action-button message-button">
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="total-section">
                      <span className="total-label">Total Amount</span>
                      <span className="total-amount">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="orders-list">
            {orderHistory.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div key={order.id} className="history-order-card">
                  <div className="history-header">
                    <div>
                      <div className="order-id-history">Order #{order.id}</div>
                      <div className="order-date">{order.date}</div>
                      <div className="supplier-name-sm">{order.supplier}</div>
                    </div>
                    <div className={`status-badge ${statusInfo.className}`}>
                      <CheckCircle size={12} className="status-icon" />
                      {statusInfo.text}
                    </div>
                  </div>

                  <div className="history-items-list">
                    {order.items.map((item, index) => (
                      <div key={index} className="item-entry">• {item}</div>
                    ))}
                  </div>

                  <div className="history-footer">
                    <button className="reorder-button">Reorder</button>
                    <span className="history-amount">₹{order.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Exporting as default for easier integration in App.js
export default OrderTracking;
