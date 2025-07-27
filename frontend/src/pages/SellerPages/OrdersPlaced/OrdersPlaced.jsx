import React, { useState, useEffect } from "react";
import "./OrdersPlaced.css";
import Header from "../../../components/Header/Header";

const OrdersPlaced = () => {
  const [orders, setOrders] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    // Dummy data for demonstration
    const dummyOrders = [
      {
        id: 1,
        customerName: "John Doe",
        location: "Mumbai, Maharashtra",
        orderDate: "2025-07-27",
        products: [
          { name: "Organic Tomatoes", quantity: 2, price: 40 },
          { name: "Fresh Potatoes", quantity: 3, price: 30 },
        ],
        totalPrice: 170,
        status: "Pending",
      },
      {
        id: 2,
        customerName: "Jane Smith",
        location: "Pune, Maharashtra",
        orderDate: "2025-07-27",
        products: [
          { name: "Fresh Onions", quantity: 5, price: 25 },
          { name: "Organic Carrots", quantity: 2, price: 35 },
        ],
        totalPrice: 195,
        status: "Processing",
      },
    ];

    setOrders(dummyOrders);
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // Dummy API call
      await fetch(`api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="page-container">
      <Header title="Orders Placed" subtitle="" showSearch />
      <div className="orders-placed">
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <span className={`status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <div className="customer-info">
                <p>
                  <strong>Customer:</strong> {order.customerName}
                </p>
                <p>
                  <strong>Location:</strong> {order.location}
                </p>
                <p>
                  <strong>Order Date:</strong> {order.orderDate}
                </p>
              </div>

              <div className="products-list">
                <h4>Products</h4>
                {order.products.map((product, index) => (
                  <div key={index} className="product-item">
                    <span>{product.name}</span>
                    <span>x{product.quantity}</span>
                    <span>₹{product.price * product.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="total-price">
                  <strong>Total:</strong> ₹{order.totalPrice}
                </div>
                <div className="order-actions">
                  {order.status !== "Cancelled" && (
                    <>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
                        className="status-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setShowConfirmation(true);
                        }}
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <h3>Cancel Order?</h3>
              <p>
                Are you sure you want to cancel this order? This action cannot
                be undone.
              </p>
              <div className="modal-actions">
                <button
                  className="confirm-btn"
                  onClick={() => {
                    handleStatusUpdate(selectedOrderId, "Cancelled");
                    setShowConfirmation(false);
                    setSelectedOrderId(null);
                  }}
                >
                  Yes, Cancel Order
                </button>
                <button
                  className="cancel-modal-btn"
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedOrderId(null);
                  }}
                >
                  No, Keep Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPlaced;
