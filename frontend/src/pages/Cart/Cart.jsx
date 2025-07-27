import React, { useState, useEffect } from "react";
import {
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { orderAPI, productAPI, apiHelpers } from "../../utils/api.js";
import Header from "../../components/Header/Header";
import "./Cart.css";

const Cart = ({ userRole }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [useSaathiCredit, setUseSaathiCredit] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const saveCartToStorage = (items) => {
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const updateQuantity = (productId, change) => {
    const updatedItems = cartItems
      .map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      )
      .filter((item) => item.quantity > 0);

    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const removeItem = (productId) => {
    const updatedItems = cartItems.filter(
      (item) => item.product_id !== productId
    );
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const optimizedSavings = Math.floor(totalAmount * 0.05); // 5% potential savings

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    // Group items by seller
    const itemsBySeller = cartItems.reduce((acc, item) => {
      if (!acc[item.seller_id]) {
        acc[item.seller_id] = [];
      }
      acc[item.seller_id].push(item);
      return acc;
    }, {});

    setLoading(true);
    setError("");

    try {
      // Create separate orders for each seller
      const orderPromises = Object.entries(itemsBySeller).map(
        async ([sellerId, items]) => {
          const orderData = {
            seller_id: sellerId,
            estimated_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            order_type: "individual"
          };

          const orderItems = items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price_per_unit: item.price,
          }));

          return orderAPI.createOrder(orderData, orderItems, "solo_singletime");
        }
      );

      await Promise.all(orderPromises);

      // Clear cart after successful checkout
      clearCart();
      alert("Orders placed successfully!");
      window.location.href = "/tracking";
    } catch (error) {
      setError("Checkout failed: " + apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBargain = () => {
    // Group items by seller for bargaining
    const itemsBySeller = cartItems.reduce((acc, item) => {
      if (!acc[item.seller_id]) {
        acc[item.seller_id] = [];
      }
      acc[item.seller_id].push(item);
      return acc;
    }, {});

    // For now, just navigate to bargain with the first seller
    const firstSellerId = Object.keys(itemsBySeller)[0];
    const firstProduct = itemsBySeller[firstSellerId][0];

    if (firstProduct) {
      window.location.href = `/bargain?product_id=${firstProduct.product_id}&seller_id=${firstSellerId}&quantity=${totalItems}`;
    }
  };

  // Get product image based on name/category
  const getProductImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("onion")) return "🧅";
    if (lowerName.includes("tomato")) return "🍅";
    if (lowerName.includes("potato")) return "🥔";
    if (lowerName.includes("carrot")) return "🥕";
    if (lowerName.includes("apple")) return "🍎";
    if (lowerName.includes("banana")) return "🍌";
    return "🛒";
  };

  return (
    <div className="page-container">
      {/* Header */}
      <Header
        title="Cart and Inventory"
        subtitle="Check your cart and inventory"
        showSearch
      />

      {/* Error Message */}
      {error && (
        <div
          style={{
            color: "#ef4444",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px",
            margin: "16px 0",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty Cart State */}
      {cartItems.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          <p>Your cart is empty</p>
          <button
            onClick={() => (window.location.href = "/products")}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-details">
                  <div className="item-image-container">
                    <span className="item-image-emoji">
                      {getProductImage(item.name)}
                    </span>
                  </div>

                  <div className="item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-supplier">
                      Seller: {item.seller_id?.slice(0, 8)}...
                    </p>
                    <p className="item-price">₹{item.price}/unit</p>
                  </div>

                  <div className="item-quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="quantity-button"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="quantity-button-plus"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product_id)}
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
                  {showOptimizer ? "Hide" : "Show"}
                </button>
              </div>

              {showOptimizer && (
                <div className="optimizer-body">
                  <p className="optimizer-text">
                    We found potential savings for you!
                  </p>
                  <div className="optimizer-savings-box">
                    <div className="optimizer-savings-details">
                      <span className="savings-text">
                        Potential Savings: ₹{optimizedSavings}
                      </span>
                      <button className="apply-button" onClick={handleBargain}>
                        Start Bargaining
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
                    <div className="bargain-subtitle">
                      Bargain on orders over ₹500
                    </div>
                  </div>
                  <button className="bargain-button" onClick={handleBargain}>
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

            <button
              className="checkout-button"
              onClick={handleCheckout}
              disabled={loading}
            >
              <CreditCard size={20} />
              <span>{loading ? "Processing..." : "Proceed to Payment"}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
