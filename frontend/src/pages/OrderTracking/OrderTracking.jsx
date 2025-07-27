import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Phone,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { orderAPI, apiHelpers } from "../../utils/api.js";
import Header from "../../components/Header/Header";
import "./OrderTracking.css";

export const OrderTracking = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState("live");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load orders on component mount and tab change
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      let orderStatus = null;
      if (activeTab === "live") {
        // Load pending, confirmed, and shipped orders
        orderStatus = ["Pending", "Confirmed", "Shipped"];
      } else {
        // Load delivered and cancelled orders
        orderStatus = ["Delivered", "Cancelled"];
      }

      // Load orders for each status
      const allOrders = [];
      for (const status of orderStatus) {
        const response = await orderAPI.getAllOrders({
          order_status: status,
          limit: 50,
        });
        allOrders.push(...response);
      }

      setOrders(allOrders);
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrder(orderId, newStatus);
      loadOrders(); // Refresh orders
      alert("Order status updated successfully!");
    } catch (error) {
      alert("Failed to update order status: " + apiHelpers.handleError(error));
    }
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          text: "Order Placed",
          className: "status-pending",
          color: "#f59e0b",
        };
      case "confirmed":
        return {
          text: "Confirmed",
          className: "status-confirmed",
          color: "#3b82f6",
        };
      case "shipped":
        return {
          text: "Out for Delivery",
          className: "status-shipped",
          color: "#8b5cf6",
        };
      case "delivered":
        return {
          text: "Delivered",
          className: "status-delivered",
          color: "#10b981",
        };
      case "cancelled":
        return {
          text: "Cancelled",
          className: "status-cancelled",
          color: "#ef4444",
        };
      default:
        return {
          text: "Unknown",
          className: "status-unknown",
          color: "#6b7280",
        };
    }
  };

  const getAvailableStatusUpdates = (currentStatus, userRole) => {
    const statusFlow = {
      Pending: userRole === "seller" ? ["Confirmed", "Cancelled"] : [],
      Confirmed: userRole === "seller" ? ["Shipped", "Cancelled"] : [],
      Shipped: userRole === "seller" ? ["Delivered"] : [],
      Delivered: [],
      Cancelled: [],
    };

    return statusFlow[currentStatus] || [];
  };

  return (
    <div className="order-tracking-container">
      <Header
        title="Order Tracking"
        showBackButton
        rightContent={
          <button
            onClick={loadOrders}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab("live")}
          className={`tab-button ${
            activeTab === "live" ? "active" : "inactive"
          }`}
        >
          Active Orders
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`tab-button ${
            activeTab === "history" ? "active" : "inactive"
          }`}
        >
          Order History
        </button>
      </div>

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

      <div className="content-area">
        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              fontSize: "16px",
              color: "#6b7280",
            }}
          >
            Loading orders...
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && !error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              fontSize: "16px",
              color: "#6b7280",
            }}
          >
            <p>
              No {activeTab === "live" ? "active" : "completed"} orders found
            </p>
            {activeTab === "live" && userRole !== "seller" && (
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
            )}
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.order_status);
              const availableStatuses = getAvailableStatusUpdates(
                order.order_status,
                userRole
              );

              return (
                <div key={order.order_id} className="live-order-card">
                  {/* Order Header */}
                  <div className="live-order-header">
                    <div className="flex-between">
                      <div>
                        <div className="order-id-label">
                          Order #{order.order_id.slice(0, 8)}
                        </div>
                        <div className="supplier-name-lg">
                          {userRole === "seller"
                            ? `Buyer: ${order.buyer_id.slice(0, 8)}...`
                            : `Seller: ${order.seller_id.slice(0, 8)}...`}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginTop: "4px",
                          }}
                        >
                          Order Date: {apiHelpers.formatDate(order.order_date)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          className={`status-badge ${statusInfo.className}`}
                          style={{
                            backgroundColor: statusInfo.color + "20",
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.text}
                        </div>
                        {order.estimated_delivery_date && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "4px",
                            }}
                          >
                            ETA:{" "}
                            {apiHelpers.formatDate(
                              order.estimated_delivery_date
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ padding: "12px 0" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "8px",
                      }}
                    >
                      Order Items ({order.order_items?.length || 0}):
                    </h4>
                    {order.order_items && order.order_items.length > 0 ? (
                      <div style={{ display: "grid", gap: "4px" }}>
                        {order.order_items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            style={{
                              fontSize: "14px",
                              color: "#374151",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              Product ID: {item.product_id.slice(0, 8)}...
                            </span>
                            <span>
                              {item.quantity} × ₹{item.price_per_unit}
                            </span>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            +{order.order_items.length - 3} more items
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        No items found
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      Total: ₹{order.total_price}
                    </div>

                    {/* Status Update Buttons (for sellers) */}
                    {availableStatuses.length > 0 && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        {availableStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              updateOrderStatus(order.order_id, status)
                            }
                            style={{
                              padding: "6px 12px",
                              backgroundColor: getStatusInfo(status).color,
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Mark as {status}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Contact Button (for active orders) */}
                    {activeTab === "live" && (
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        <MessageCircle size={14} />
                        Contact
                      </button>
                    )}
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

export default OrderTracking;
