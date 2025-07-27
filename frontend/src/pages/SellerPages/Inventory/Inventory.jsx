import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inventory.css';

// Simulated API call
const fetchInventory = async () => {
  // This will be replaced with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: 'Tomatoes',
          quantity: 50,
          price: 40,
          category: 'Vegetables',
          lastUpdated: '2025-07-27',
          unit: 'kg',
          expiry: '2025-08-15'
        },
        {
          id: 2,
          name: 'Onions',
          quantity: 25,
          price: 35,
          category: 'Vegetables',
          lastUpdated: '2025-07-26',
          unit: 'kg',
          expiry: '2025-09-01'
        },
        {
          id: 3,
          name: 'Potatoes',
          quantity: 150,
          price: 30,
          category: 'Vegetables',
          lastUpdated: '2025-07-25',
          unit: 'kg',
          expiry: '2025-08-30'
        }
      ]);
    }, 1000);
  });
};

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { text: 'No expiry date', class: '' };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffInHours = Math.round((expiry - now) / (1000 * 60 * 60));
  
  if (diffInHours < 0) {
    return { text: 'Expired', class: 'expired' };
  }
  
  if (diffInHours <= 24) {
    return { 
      text: `Expires in ${diffInHours} hours`, 
      class: 'expiring-soon' 
    };
  }
  
  const days = Math.floor(diffInHours / 24);
  if (days <= 7) {
    return { 
      text: `Expires in ${days} days`, 
      class: 'expiring-week' 
    };
  }
  
  return { 
    text: `Expires in ${days} days`,
    class: 'normal'
  };
};

const Inventory = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInventory = async () => {
    try {
      const data = await fetchInventory();
      // Sort by expiry date (soonest first)
      const sortedData = data.sort((a, b) => {
        const dateA = a.expiry ? new Date(a.expiry) : new Date('9999-12-31');
        const dateB = b.expiry ? new Date(b.expiry) : new Date('9999-12-31');
        return dateA - dateB;
      });
      setInventory(sortedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInventory();
  };

  const handleItemClick = (item) => {
    navigate('/update-inventory', { state: { itemData: item } });
  };

  const handleAddUpdate = () => {
    navigate('/update-inventory');
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-left">
          <h1>My Inventory</h1>
          <button 
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <button 
          className="add-inventory-btn"
          onClick={handleAddUpdate}
        >
          Add New Item
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading inventory...</p>
        </div>
      ) : (
        <>
          <div className="inventory-grid">
            {inventory.map((item) => (
              <div 
                key={item.id} 
                className="inventory-card"
                onClick={() => handleItemClick(item)}
              >
                <div className="inventory-card-header">
                  <h3>{item.name}</h3>
                  <span className="category-badge">{item.category}</span>
                </div>
                <div className="inventory-card-content">
                  <p className={`quantity ${item.quantity < 50 ? 'low-stock' : ''}`}>
                    <strong>Quantity:</strong> {item.quantity} {item.unit}
                  </p>
                  <p>
                    <strong>Price:</strong> ₹{item.price}/{item.unit}
                  </p>
                  {item.expiry && (
                    <p className={`expiry-status ${getExpiryStatus(item.expiry).class}`}>
                      {getExpiryStatus(item.expiry).text}
                    </p>
                  )}
                  <p className="last-updated">
                    Last updated: {item.lastUpdated}
                  </p>
                </div>
                <div className="card-overlay">
                  <span>Click to Update</span>
                </div>
              </div>
            ))}
          </div>

          {inventory.length === 0 && (
            <div className="empty-state">
              <p>No inventory items found</p>
              <button 
                className="add-inventory-btn"
                onClick={handleAddUpdate}
              >
                Add Your First Item
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Inventory;
