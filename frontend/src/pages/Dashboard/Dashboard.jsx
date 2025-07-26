import React, { useState } from 'react';
import { Search, Mic, TrendingUp, Zap, Bell } from 'lucide-react';
import './Dashboard.css';

// Assuming UserRole is defined in a parent component like:
// export type UserRole = 'buyer' | 'seller';
 const Dashboard = ({ userRole, onCategorySelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'vegetables', name: 'Vegetables', icon: '🥬', style: 'category-green' },
    { id: 'spices', name: 'Spices', icon: '🌶️', style: 'category-red' },
    { id: 'oils', name: 'Oils', icon: '🛢️', style: 'category-yellow' },
    { id: 'dairy', name: 'Dairy', icon: '🥛', style: 'category-blue' },
    { id: 'grains', name: 'Grains', icon: '🌾', style: 'category-amber' },
    { id: 'packaged', name: 'Packaged', icon: '📦', style: 'category-purple' },
  ];

  const trendingItems = [
    { name: 'Onion', price: '₹25/kg', trend: '+5%', image: '🧅' },
    { name: 'Tomato', price: '₹30/kg', trend: '-2%', image: '🍅' },
    { name: 'Turmeric Powder', price: '₹180/kg', trend: '+8%', image: '🌟' },
  ];

  const quickActions = userRole === 'buyer' ? [
    { id: 'reorder', name: 'Reorder', icon: '🔄', style: 'action-blue' },
    { id: 'credit', name: 'Partner Credit', icon: '💳', style: 'action-green' },
    { id: 'bulk', name: 'Bulk Order', icon: '📦', style: 'action-purple' },
  ] : [
    { id: 'inventory', name: 'Inventory', icon: '📊', style: 'action-blue' },
    { id: 'deliveries', name: 'Deliveries', icon: '🚚', style: 'action-green' },
    { id: 'analytics', name: 'Analytics', icon: '📈', style: 'action-purple' },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div>
            <h1 className="header-title">Hello! 🙏</h1>
            <p className="header-subtitle">
              {userRole === 'buyer' ? 'What do you need today?' : "View today's orders"}
            </p>
          </div>
          <div className="header-actions">
            <button className="notification-button">
              <Bell size={20} />
            </button>
            <div className="location-info">
              <div className="location-city">📍 Delhi</div>
              <div className="location-area">Connaught Place</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar-container">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Onion, Tomato, Spices..."
              className="search-input"
            />
            <button className="mic-button">
              <Mic className="mic-icon" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <button key={action.id} className="action-card">
                <div className={`action-icon-wrapper ${action.style}`}>
                  <span className="action-icon">{action.icon}</span>
                </div>
                <div className="action-name">{action.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="section-title">Categories</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="category-card"
              >
                <div className={`category-icon-wrapper ${category.style}`}>
                  <span className="category-icon">{category.icon}</span>
                </div>
                <div className="category-name">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Items */}
        <div>
          <div className="trending-header">
            <h2 className="section-title">Trending Today</h2>
            <button className="view-all-button">
              <TrendingUp size={16} className="view-all-icon" />
              View All
            </button>
          </div>
          <div className="trending-list">
            {trendingItems.map((item, index) => (
              <div key={index} className="trending-item-card">
                <div className="trending-item-content">
                  <div className="trending-item-info">
                    <span className="trending-item-image">{item.image}</span>
                    <div>
                      <div className="trending-item-name">{item.name}</div>
                      <div className="trending-item-price">{item.price}</div>
                    </div>
                  </div>
                  <div className={`trend-indicator ${
                    item.trend.startsWith('+') ? 'trend-up' : 'trend-down'
                  }`}>
                    {item.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Pricing Alert */}
        <div className="flash-sale-alert">
          <div className="flash-sale-content">
            <div className="flash-sale-icon-wrapper">
              <Zap className="flash-sale-icon" size={16} />
            </div>
            <div>
              <div className="flash-sale-title">Flash Sale!</div>
              <div className="flash-sale-desc">Fresh flowers 40% off - 2 hours left</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
