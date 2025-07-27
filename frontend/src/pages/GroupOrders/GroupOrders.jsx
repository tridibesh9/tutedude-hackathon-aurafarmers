import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingCart, 
  Clock, 
  MapPin, 
  Plus,
  Eye,
  CheckCircle 
} from "lucide-react";
import { orderAPI, apiHelpers } from "../../utils/api.js";
import Header from "../../components/Header/Header";
import "./GroupOrders.css";

const GroupOrders = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState("available");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinQuantity, setJoinQuantity] = useState({});

  // Load orders based on active tab
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "available") {
        // Load available group orders for buyers
        const response = await orderAPI.getAvailableGroupOrders({
          limit: 50,
        });
        setOrders(Array.isArray(response) ? response : []);
      } else {
        // Load user's orders (both individual and group)
        const response = await orderAPI.getAllOrders({
          limit: 50,
        });
        // Filter for group orders only
        const groupOrders = Array.isArray(response) ? response.filter(order => order.order_type === "group") : [];
        setOrders(groupOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      const errorMessage = apiHelpers.handleError(error);
      console.error('Processed error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrder = async (orderId) => {
    const quantity = joinQuantity[orderId] || 1;
    
    try {
      await orderAPI.joinGroupOrder(orderId, quantity);
      alert("Successfully joined group order!");
      loadOrders(); // Refresh the list
    } catch (error) {
      alert("Failed to join order: " + apiHelpers.handleError(error));
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const details = await orderAPI.getGroupOrderDetails(orderId);
      // You can implement a modal or navigate to details page
      console.log("Group order details:", details);
      alert("Order details logged to console");
    } catch (error) {
      alert("Failed to load details: " + apiHelpers.handleError(error));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="page-container">
      <Header title="Group Orders" subtitle="Join others and save more" showSearch />
      
      <div className="group-orders-container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "available" ? "active" : ""}`}
            onClick={() => setActiveTab("available")}
          >
            <Users size={18} />
            Available Groups
          </button>
          <button
            className={`tab-button ${activeTab === "my-orders" ? "active" : ""}`}
            onClick={() => setActiveTab("my-orders")}
          >
            <ShoppingCart size={18} />
            My Group Orders
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="orders-content">
          {loading ? (
            <div className="loading-state">
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>
                {activeTab === "available" 
                  ? "No group orders available" 
                  : "No group orders found"
                }
              </h3>
              <p>
                {activeTab === "available"
                  ? "Check back later for new group orders to join"
                  : "You haven't joined or created any group orders yet"
                }
              </p>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order.order_id} className="group-order-card">
                  <div className="order-header">
                    <div className="order-status">
                      <span className={`status-badge ${order.order_status?.toLowerCase()}`}>
                        {order.order_status}
                      </span>
                      <span className="order-type">Group Order</span>
                    </div>
                  </div>

                  <div className="order-content">
                    <div className="order-info">
                      <h4>Order #{order.order_id?.slice(-8)}</h4>
                      <div className="participants-info">
                        <Users size={16} />
                        <span>{order.total_participants || 1} participants</span>
                      </div>
                      <div className="quantity-info">
                        <ShoppingCart size={16} />
                        <span>{order.total_quantity} items total</span>
                      </div>
                    </div>

                    <div className="pricing-info">
                      <div className="total-price">
                        <strong>{formatCurrency(order.total_price)}</strong>
                      </div>
                      <div className="per-unit-price">
                        ≈ ₹{(order.total_price / order.total_quantity).toFixed(2)} per item
                      </div>
                    </div>

                    <div className="delivery-info">
                      <div className="delivery-date">
                        <Clock size={16} />
                        <span>Delivery: {formatDate(order.estimated_delivery_date)}</span>
                      </div>
                      <div className="order-date">
                        Created: {formatDate(order.order_date)}
                      </div>
                    </div>

                    {activeTab === "available" && (
                      <div className="join-section">
                        <div className="quantity-input">
                          <label>Quantity to join:</label>
                          <input
                            type="number"
                            min="1"
                            value={joinQuantity[order.order_id] || 1}
                            onChange={(e) => setJoinQuantity({
                              ...joinQuantity,
                              [order.order_id]: parseInt(e.target.value) || 1
                            })}
                          />
                        </div>
                        <div className="action-buttons">
                          <button
                            className="view-details-btn"
                            onClick={() => handleViewDetails(order.order_id)}
                          >
                            <Eye size={16} />
                            Details
                          </button>
                          <button
                            className="join-order-btn"
                            onClick={() => handleJoinOrder(order.order_id)}
                          >
                            <Plus size={16} />
                            Join Order
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === "my-orders" && (
                      <div className="my-order-actions">
                        <button
                          className="view-details-btn"
                          onClick={() => handleViewDetails(order.order_id)}
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                        {order.order_status === "Delivered" && (
                          <div className="delivery-status">
                            <CheckCircle size={16} color="#10b981" />
                            <span>Delivered</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupOrders;
