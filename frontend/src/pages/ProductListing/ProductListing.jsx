import React, { useState } from 'react';
import { Star, MapPin, Clock, Filter, ShoppingCart, Zap, Bot } from 'lucide-react';
import './ProductListing.css';

// The UserRole and Product types would typically be defined in a separate types file
// For this example, we'll assume 'buyer' or 'seller' strings for userRole
// and the Product interface is implicitly defined by the data structure.

const ProductListing = ({ category, userRole }) => {
  const [sortBy, setSortBy] = useState('best');
  const [showFilters, setShowFilters] = useState(false);

  // Mock product data. In a real app, this would come from an API.
  const products = [
    {
      id: '1',
      name: 'Onion (Grade A)',
      price: 25,
      unit: 'kg',
      supplier: 'Gupta Traders',
      distance: 2.1,
      deliveryTime: 'By 6 AM',
      rating: 4.5,
      reviews: 127,
      image: '🧅',
      aiQualityScore: 92,
    },
    {
      id: '2',
      name: 'Onion (Premium)',
      price: 28,
      unit: 'kg',
      supplier: 'Sharma Wholesale',
      distance: 1.8,
      deliveryTime: 'In 2 hours',
      rating: 4.7,
      reviews: 89,
      image: '🧅',
      aiQualityScore: 96,
    },
    {
      id: '3',
      name: 'Onion (Chopped)',
      price: 18,
      originalPrice: 30,
      unit: 'kg',
      supplier: 'Raju Vegetables',
      distance: 3.2,
      deliveryTime: '1 hour',
      rating: 4.2,
      reviews: 45,
      image: '🧅',
      aiQualityScore: 78,
      isDynamic: true,
      expiryHours: 4,
    },
  ];

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
    // In a real app, you would dispatch an action or call an API here
  };

  // Handler for initiating a bargain
  const handleBargain = (product) => {
    console.log('Bargain for:', product);
    // This would likely open a chat or a modal to start negotiation
  };

  return (
    <div className="product-listing-container">
      {/* Header Section */}
      <div className="header">
        <div className="header-top">
          <h1 className="header-title">Onions</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-button"
          >
            <Filter size={16} />
            <span className="filter-button-text">Filter</span>
          </button>
        </div>

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

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            {/* Dynamic Pricing Banner for items on sale */}
            {product.isDynamic && (
              <div className="dynamic-pricing-banner">
                <div className="dynamic-pricing-content">
                  <Zap size={16} />
                  <span className="dynamic-pricing-text">
                    ⏰ {product.expiryHours} hours left - 40% off!
                  </span>
                </div>
              </div>
            )}

            <div className="product-card-content">
              <div className="product-card-body">
                {/* Product Image */}
                <div className="product-image-container">
                  <span className="product-image">{product.image}</span>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <div className="product-info-header">
                    <div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-supplier">{product.supplier}</p>
                    </div>
                    
                    {/* AI Quality Score */}
                    <div className="ai-quality-score">
                      <Bot size={12} className="ai-icon" />
                      <span className="ai-score-text">AI: {product.aiQualityScore}%</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="metrics-grid">
                    {/* Price */}
                    <div className="metric-item">
                      <div className="metric-label">Price</div>
                      <div className="metric-value">
                        {product.isDynamic && product.originalPrice && (
                          <span className="original-price">
                            ₹{product.originalPrice}
                          </span>
                        )}
                        ₹{product.price}/{product.unit}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="metric-item">
                      <div className="metric-label">Time</div>
                      <div className="metric-value-icon text-green">
                        <Clock size={12} className="metric-icon" />
                        {product.deliveryTime}
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="metric-item">
                      <div className="metric-label">Distance</div>
                      <div className="metric-value-icon text-blue">
                        <MapPin size={12} className="metric-icon" />
                        {product.distance} km
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="metric-item">
                      <div className="metric-label">Rating</div>
                      <div className="metric-value-icon text-yellow">
                        <Star size={12} className="metric-icon star-icon" />
                        {product.rating}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="add-to-cart-button"
                    >
                      <ShoppingCart size={16} />
                      <span>Add to Cart</span>
                    </button>
                    
                    {userRole === 'buyer' && (
                      <button
                        onClick={() => handleBargain(product)}
                        className="bargain-button"
                      >
                        Bargain
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
