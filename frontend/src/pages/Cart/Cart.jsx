import React, { useState } from 'react';
import { Minus, Plus, Trash2, CreditCard, Lightbulb, MessageCircle } from 'lucide-react';
import './Cart.css';

// Assuming UserRole is defined in another file, e.g., '../App.js'
// export type UserRole = 'buyer' | 'seller';

const Cart = ({ userRole }) => {
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Onion (Grade A)',
      price: 25,
      quantity: 5,
      unit: 'kg',
      supplier: 'Gupta Traders',
      image: '🧅',
    },
    {
      id: '2',
      name: 'Tomato (Fresh)',
      price: 30,
      quantity: 3,
      unit: 'kg',
      supplier: 'Sharma Wholesale',
      image: '🍅',
    },
  ]);

  const [showOptimizer, setShowOptimizer] = useState(false);
  const [useSaathiCredit, setUseSaathiCredit] = useState(false);

  const updateQuantity = (id, change) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const optimizedSavings = 45; // Mock optimization savings

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header">
        <h1 className="cart-title">Your Cart</h1>
        <p className="cart-item-count">{totalItems} Items</p>
      </div>

      {/* Cart Items */}
      <div className="cart-items-list">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-details">
              <div className="item-image-container">
                <span className="item-image-emoji">{item.image}</span>
              </div>
              
              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>
                <p className="item-supplier">{item.supplier}</p>
                <p className="item-price">₹{item.price}/{item.unit}</p>
              </div>

              <div className="item-quantity-controls">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="quantity-button"
                >
                  <Minus size={16} />
                </button>
                <span className="item-quantity">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="quantity-button-plus"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="remove-item-button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Smart Cart Optimizer */}
        <div className="optimizer-container">
          <div className="optimizer-header">
            <div className="optimizer-title-group">
              <Lightbulb className="optimizer-icon" size={20} />
              <span className="optimizer-title">Smart Cart Optimizer</span>
            </div>
            <button
              onClick={() => setShowOptimizer(!showOptimizer)}
              className="optimizer-toggle"
            >
              {showOptimizer ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showOptimizer && (
            <div className="optimizer-body">
              <p className="optimizer-text">
                We found the cheapest combination for you!
              </p>
              <div className="optimizer-savings-box">
                <div className="optimizer-savings-details">
                  <span className="savings-text">Savings: ₹{optimizedSavings}</span>
                  <button className="apply-button">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Options */}
        <div className="payment-options-container">
          <h3 className="payment-options-title">Payment Options</h3>
          
          <div className="payment-options-list">
            <label className="credit-option-label">
              <input
                type="checkbox"
                checked={useSaathiCredit}
                onChange={(e) => setUseSaathiCredit(e.target.checked)}
                className="credit-checkbox"
              />
              <div>
                <div className="credit-title">Use Saathi Credit</div>
                <div className="credit-availability">Available: ₹2,500</div>
              </div>
            </label>
          </div>
        </div>

        {/* Bargain Option */}
        {totalAmount > 500 && (
          <div className="bargain-container">
            <div className="bargain-details">
              <MessageCircle className="bargain-icon" size={20} />
              <div>
                <div className="bargain-title">Bulk Order Discount</div>
                <div className="bargain-subtitle">Bargain on orders over ₹500</div>
              </div>
              <button className="bargain-button">
                Bargain
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Footer */}
      <div className="checkout-footer">
        <div className="checkout-summary">
          <div>
            <div className="total-amount-label">Total Amount</div>
            <div className="total-amount-value">₹{totalAmount}</div>
          </div>
          <div className="delivery-charge-container">
            <div className="delivery-charge-label">Delivery Charge</div>
            <div className="delivery-charge-value">FREE</div>
          </div>
        </div>
        
        <button className="checkout-button">
          <CreditCard size={20} />
          <span>Proceed to Payment</span>
        </button>
      </div>
    </div>
  );
};

export default Cart;