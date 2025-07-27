import React, { useState, useEffect } from 'react';
import CreateBargainModal from './CreateBargainModal';
import PublicBargainList from './PublicBargainList';
import BargainRoom from './BargainRoom';
import './BargainDashboard.css';

const BargainDashboard = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('public');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBargain, setSelectedBargain] = useState(null);
  const [publicBargains, setPublicBargains] = useState([]);
  const [privateBargains, setPrivateBargains] = useState([]);
  const [myBargains, setMyBargains] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    priceRange: { min: '', max: '' },
    search: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch bargains based on active tab
  useEffect(() => {
    fetchBargains();
  }, [activeTab, filters]);

  const fetchBargains = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let url = '';
      switch (activeTab) {
        case 'public':
          url = '/api/v1/bargain/public/available';
          break;
        case 'private':
          url = '/api/v1/bargain/private/available'; // Assuming this endpoint exists
          break;
        case 'my-bargains':
          url = '/api/v1/bargain/my-bargains';
          break;
        default:
          return;
      }

      const response = await fetch(`http://localhost:8000${url}`, { headers });
      const data = await response.json();
      
      if (response.ok) {
        switch (activeTab) {
          case 'public':
            setPublicBargains(data.bargains || []);
            break;
          case 'private':
            setPrivateBargains(data.bargains || []);
            break;
          case 'my-bargains':
            setMyBargains(data.bargains || []);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching bargains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBargain = () => {
    setShowCreateModal(true);
  };

  const handleBargainCreated = (newBargain) => {
    setShowCreateModal(false);
    if (newBargain.type === 'public') {
      setPublicBargains(prev => [newBargain, ...prev]);
    } else {
      setPrivateBargains(prev => [newBargain, ...prev]);
    }
    setMyBargains(prev => [newBargain, ...prev]);
  };

  const handleJoinBargain = (bargain) => {
    setSelectedBargain(bargain);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getCurrentBargains = () => {
    switch (activeTab) {
      case 'public':
        return publicBargains;
      case 'private':
        return privateBargains;
      case 'my-bargains':
        return myBargains;
      default:
        return [];
    }
  };

  const filteredBargains = getCurrentBargains().filter(bargain => {
    if (filters.search && !bargain.product_name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.location && !bargain.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.category && bargain.category !== filters.category) {
      return false;
    }
    if (filters.priceRange.min && bargain.starting_price < parseFloat(filters.priceRange.min)) {
      return false;
    }
    if (filters.priceRange.max && bargain.starting_price > parseFloat(filters.priceRange.max)) {
      return false;
    }
    return true;
  });

  if (selectedBargain) {
    return (
      <BargainRoom 
        bargain={selectedBargain} 
        userRole={userRole}
        onBack={() => setSelectedBargain(null)}
      />
    );
  }

  return (
    <div className="bargain-dashboard">
      <div className="dashboard-header">
        <h1>Live Bargaining</h1>
        <button 
          className="create-bargain-btn"
          onClick={handleCreateBargain}
        >
          + Create Bargain
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          Public Bargains
        </button>
        <button 
          className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => setActiveTab('private')}
        >
          Private Bargains
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-bargains' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-bargains')}
        >
          My Bargains
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <input
            type="text"
            placeholder="Location/Pincode"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="location-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="grains">Grains</option>
            <option value="dairy">Dairy</option>
            <option value="spices">Spices</option>
          </select>
        </div>
        <div className="filter-group price-range">
          <input
            type="number"
            placeholder="Min Price"
            value={filters.priceRange.min}
            onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
            className="price-input"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.priceRange.max}
            onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
            className="price-input"
          />
        </div>
      </div>

      {/* Bargains List */}
      <div className="bargains-container">
        {loading ? (
          <div className="loading">Loading bargains...</div>
        ) : (
          <PublicBargainList 
            bargains={filteredBargains}
            userRole={userRole}
            onJoinBargain={handleJoinBargain}
            bargainType={activeTab}
          />
        )}
      </div>

      {/* Create Bargain Modal */}
      {showCreateModal && (
        <CreateBargainModal
          userRole={userRole}
          onClose={() => setShowCreateModal(false)}
          onBargainCreated={handleBargainCreated}
        />
      )}
    </div>
  );
};

export default BargainDashboard;
