import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, Filter, ShoppingCart, Zap, Bot, Plus } from 'lucide-react';
import { productAPI, apiHelpers } from '../../utils/api.js';
import './ProductListing.css';

const ProductListing = ({ category, userRole }) => {
  const [sortBy, setSortBy] = useState('best');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    category: category || '',
    minPrice: '',
    maxPrice: '',
    sellerOnly: false
  });

  // Load products from API
  const loadProducts = async (pageNum = 0, isRefresh = false) => {
    try {
      const params = {
        skip: pageNum * 10,
        limit: 10,
        category: filters.category,
        min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        seller_only: filters.sellerOnly
      };

      const response = await productAPI.getAllProducts(params);
      
      if (isRefresh || pageNum === 0) {
        setProducts(response);
      } else {
        setProducts(prev => [...prev, ...response]);
      }
      
      setHasMore(response.length === 10);
      setPage(pageNum);
      setError('');
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount and when filters change
  useEffect(() => {
    setLoading(true);
    loadProducts(0, true);
  }, [filters]);

  // Load more products (pagination)
  const loadMore = () => {
    if (!loading && hasMore) {
      loadProducts(page + 1, false);
    }
  };

  // Options for sorting the product list
  const sortOptions = [
    { value: 'best', label: 'Best Value' },
    { value: 'price', label: 'Price' },
    { value: 'time', label: 'Fastest Delivery' },
    { value: 'distance', label: 'Nearest' },
    { value: 'rating', label: 'Top Rated' },
  ];

  // Handler for adding a product to the cart
  const handleAddToCart = (product) => {
    console.log('Added to cart:', product);
    // Add to cart logic - could store in localStorage or call cart API
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.product_id === product.product_id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1,
        seller_id: product.seller_id
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Product added to cart!');
  };

  // Handler for initiating a bargain
  const handleBargain = (product) => {
    console.log('Bargain for:', product);
    // Navigate to bargain page or open bargain modal
    // This would integrate with the bargain API
    window.location.href = `/bargain?product_id=${product.product_id}`;
  };

  // Apply filters
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Get the display image for a product
  const getProductImage = (category) => {
    const imageMap = {
      'Vegetables': '🥬',
      'Fruits': '🍎',
      'Grains': '🌾',
      'Dairy': '🥛',
      'Meat': '🍖',
      'default': '🛒'
    };
    return imageMap[category] || imageMap.default;
  };

  return (
    <div className="product-listing-container">
      {/* Header Section */}
      <div className="header">
        <div className="header-top">
          <h1 className="header-title">
            {filters.category || 'All Products'}
            {userRole === 'seller' && (
              <button 
                onClick={() => window.location.href = '/products/create'}
                className="add-product-button"
                style={{
                  marginLeft: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} style={{ marginRight: '4px' }} />
                Add Product
              </button>
            )}
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-button"
          >
            <Filter size={16} />
            <span className="filter-button-text">Filter</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel" style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}
              >
                <option value="">All Categories</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains">Grains</option>
                <option value="Dairy">Dairy</option>
                <option value="Meat">Meat</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min ₹"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max ₹"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}
              />
            </div>
            
            {userRole === 'seller' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filters.sellerOnly}
                  onChange={(e) => handleFilterChange('sellerOnly', e.target.checked)}
                  id="seller-only"
                />
                <label htmlFor="seller-only" style={{ fontSize: '14px' }}>My Products Only</label>
              </div>
            )}
          </div>
        )}

        {/* Sort Options */}
        <div className="sort-options">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`sort-button ${
                sortBy === option.value ? 'active' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          color: '#ef4444',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          margin: '16px 0',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '16px',
          color: '#6b7280'
        }}>
          Loading products...
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && !error && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '16px',
          color: '#6b7280'
        }}>
          <p>No products found</p>
          {userRole === 'seller' && (
            <button 
              onClick={() => window.location.href = '/products/create'}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Add Your First Product
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.product_id} className="product-card">
            {/* Dynamic Pricing Banner for items with inventory discounts */}
            {product.inventories && product.inventories.length > 0 && product.inventories[0].discount > 0 && (
              <div className="dynamic-pricing-banner">
                <div className="dynamic-pricing-content">
                  <Zap size={16} />
                  <span className="dynamic-pricing-text">
                    🏷️ {product.inventories[0].discount}% off!
                  </span>
                </div>
              </div>
            )}

            <div className="product-card-content">
              <div className="product-card-body">
                {/* Product Image */}
                <div className="product-image-container">
                  <span className="product-image">{getProductImage(product.category)}</span>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <div className="product-info-header">
                    <div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-supplier">Seller ID: {product.seller_id.slice(0, 8)}...</p>
                    </div>
                    
                    {/* AI Quality Score */}
                    <div className="ai-quality-score">
                      <Bot size={12} className="ai-icon" />
                      <span className="ai-score-text">Rating: {product.rating || 0}</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="metrics-grid">
                    {/* Price */}
                    <div className="metric-item">
                      <div className="metric-label">Price</div>
                      <div className="metric-value">
                        {product.inventories && product.inventories.length > 0 && product.inventories[0].discount > 0 && (
                          <span className="original-price">
                            ₹{product.price}
                          </span>
                        )}
                        ₹{product.inventories && product.inventories.length > 0 && product.inventories[0].discount > 0 
                          ? (product.price * (1 - product.inventories[0].discount / 100)).toFixed(2)
                          : product.price}/unit
                      </div>
                    </div>

                    {/* Available Quantity */}
                    <div className="metric-item">
                      <div className="metric-label">Available</div>
                      <div className="metric-value-icon text-green">
                        <Clock size={12} className="metric-icon" />
                        {product.inventories && product.inventories.length > 0 
                          ? `${product.inventories.reduce((total, inv) => total + inv.quantity, 0)} units`
                          : 'Out of stock'}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="metric-item">
                      <div className="metric-label">Category</div>
                      <div className="metric-value-icon text-blue">
                        <MapPin size={12} className="metric-icon" />
                        {product.category}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="metric-item">
                      <div className="metric-label">Rating</div>
                      <div className="metric-value-icon text-yellow">
                        <Star size={12} className="metric-icon star-icon" />
                        {product.rating || 0}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    {userRole === 'buyer' || userRole === 'both' ? (
                      <>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="add-to-cart-button"
                          disabled={!product.inventories || product.inventories.length === 0}
                        >
                          <ShoppingCart size={16} />
                          <span>Add to Cart</span>
                        </button>
                        
                        <button
                          onClick={() => handleBargain(product)}
                          className="bargain-button"
                        >
                          Bargain
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => window.location.href = `/products/edit/${product.product_id}`}
                        className="edit-button"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Edit Product
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && products.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <button
            onClick={loadMore}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Load More Products
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {loading && products.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '20px 0',
          color: '#6b7280'
        }}>
          Loading more products...
        </div>
      )}

      {/* Smart Cart Optimizer FAB */}
      <div className="smart-cart-optimizer">
        <button className="smart-cart-button">
          <span className="smart-cart-icon">💡</span>
        </button>
      </div>
    </div>
  );
};

export default ProductListing;
