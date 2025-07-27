import React, { useState, useEffect } from 'react';
import CreateBargainModal from './CreateBargainModal';
import PublicBargainList from './PublicBargainList';
import BargainRoom from './BargainRoom';
import './BargainDashboard.css';

const BargainDashboard = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState(userRole === 'seller' ? 'public' : 'private');
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
          // Only allow sellers to access public bargains
          if (userRole !== 'seller') {
            setLoading(false);
            return;
          }
          url = '/api/v1/bargain/public/available';
          break;
        case 'private':
          url = '/api/v1/bargain/my-bargains'; // Assuming this endpoint exists
          break;
        case 'my-bargains':
          url = '/api/v1/bargain/my-bargains';
          break;
        default:
          return;
      }

      const response = await fetch(`http://localhost:8000${url}`, { headers });
      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.ok) {
        // The API returns the array directly, not wrapped in a 'bargains' property
        const bargains = Array.isArray(data) ? data : [];
        
        // Add status information based on expiry time
        const processedBargains = bargains.map(bargain => {
          const now = new Date();
          const expiryTime = bargain.expires_at ? new Date(bargain.expires_at) : null;
          
          let bargainStatus = 'active';
          if (expiryTime && expiryTime <= now) {
            bargainStatus = 'expired';
          } else if (bargain.status === 'completed' || bargain.status === 'accepted') {
            bargainStatus = 'completed';
          } else if (bargain.status === 'cancelled') {
            bargainStatus = 'cancelled';
          }
          
          return {
            ...bargain,
            // Map backend properties to frontend expected properties
            id: bargain.room_id,
            expiry_time: bargain.expires_at,
            starting_price: bargain.initial_bid_price,
            current_price: bargain.current_bid_price,
            quantity: bargain.initial_quantity,
            location: bargain.location_pincode,
            pincode: bargain.location_pincode,
            product_name: `Product ${bargain.product_id.slice(0, 8)}...`, // Placeholder until we get product details
            category: 'Unknown', // Placeholder until we get product details
            description: `Room ID: ${bargain.room_id}`,
            bargain_status: bargainStatus,
            is_expired: expiryTime && expiryTime <= now,
            response_count: 0, // Placeholder
            active_bidders: 0 // Placeholder
          };
        });
        
        switch (activeTab) {
          case 'public':
            setPublicBargains(processedBargains);
            break;
          case 'private':
            setPrivateBargains(processedBargains);
            break;
          case 'my-bargains':
            setMyBargains(processedBargains);
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
        // Only return public bargains for sellers
        return userRole === 'seller' ? publicBargains : [];
      case 'private':
        return privateBargains;
      case 'my-bargains':
        return myBargains;
      default:
        return [];
    }
  };

  const filteredBargains = getCurrentBargains().filter(bargain => {
    if (filters.search && bargain.product_name && !bargain.product_name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.location && bargain.location && !bargain.location.includes(filters.location)) {
      return false;
    }
    
    if (filters.category && filters.category !== '' && bargain.category && bargain.category !== filters.category) {
      return false;
    }
    
    if (filters.priceRange.min && bargain.starting_price && parseFloat(bargain.starting_price) < parseFloat(filters.priceRange.min)) {
      return false;
    }
    
    if (filters.priceRange.max && bargain.starting_price && parseFloat(bargain.starting_price) > parseFloat(filters.priceRange.max)) {
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
        {userRole === 'seller' && (
          <button 
            className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            Public Bargains
          </button>
        )}
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

      {/* Stats Section */}
      <div className="bargain-stats-section" style={{
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        {(() => {
          const currentBargains = getCurrentBargains();
          const liveBargains = currentBargains.filter(b => !b.is_expired && b.status === 'active');
          const expiredBargains = currentBargains.filter(b => b.is_expired);
          const completedBargains = currentBargains.filter(b => b.status === 'completed' || b.status === 'accepted');
          
          return (
            <div className="stats-row" style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}>
              <div className="stat-item live" style={{
                textAlign: 'center',
                color: '#28a745'
              }}>
                <div className="stat-number" style={{ fontSize: '24px', fontWeight: 'bold' }}>{liveBargains.length}</div>
                <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Live Bargains</div>
              </div>
              <div className="stat-item expired" style={{
                textAlign: 'center',
                color: '#dc3545'
              }}>
                <div className="stat-number" style={{ fontSize: '24px', fontWeight: 'bold' }}>{expiredBargains.length}</div>
                <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Expired</div>
              </div>
              <div className="stat-item completed" style={{
                textAlign: 'center',
                color: '#007bff'
              }}>
                <div className="stat-number" style={{ fontSize: '24px', fontWeight: 'bold' }}>{completedBargains.length}</div>
                <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Completed</div>
              </div>
              <div className="stat-item total" style={{
                textAlign: 'center',
                color: '#6c757d'
              }}>
                <div className="stat-number" style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentBargains.length}</div>
                <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Total</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search bargains..."
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
